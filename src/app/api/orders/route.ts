import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: any = { userId: session.user.email };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Failed to get orders", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      shippingAddress, 
      paymentMethod,
      customerName,
      customerPhone 
    } = await req.json();

    // Get user's cart
    const cart = await Cart.findOne({ userId: session.user.email });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Verify stock availability and update inventory
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({ 
          error: `Product ${item.productName} not found` 
        }, { status: 404 });
      }

      if (product.stockQuantity < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
          productId: product._id,
          available: product.stockQuantity
        }, { status: 400 });
      }
    }

    // Create order
    const order = await Order.create({
      userId: session.user.email,
      customerName: customerName || session.user.name || 'Customer',
      customerEmail: session.user.email,
      customerPhone,
      items: cart.items,
      totalAmount: cart.totalAmount,
      discount: cart.appliedPromotion?.discount || 0,
      finalAmount: cart.totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'completed',
      orderStatus: 'confirmed',
      appliedPromotion: cart.appliedPromotion,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
    });

    // Update product inventory
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockQuantity: -item.quantity } }
      );
    }

    // Create sale record
    await Sale.create({
      customerId: session.user.email,
      customerName: customerName || session.user.name || 'Customer',
      items: cart.items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      totalAmount: cart.totalAmount,
      paymentMethod,
      status: 'completed',
      saleDate: new Date()
    });

    // Clear cart
    cart.items = [];
    cart.totalAmount = 0;
    cart.appliedPromotion = undefined;
    await cart.save();

    return NextResponse.json({ 
      message: "Order placed successfully",
      order 
    });
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order", details: error.message }, { status: 500 });
  }
}
