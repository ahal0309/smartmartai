import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ userId: session.user.email });
    
    if (!cart) {
      cart = await Cart.create({
        userId: session.user.email,
        items: [],
        totalAmount: 0
      });
    }

    return NextResponse.json({ cart });
  } catch (error: any) {
    console.error("Get cart error:", error);
    return NextResponse.json({ error: "Failed to get cart", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity = 1 } = await req.json();

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check stock availability
    if (product.stockQuantity < quantity) {
      return NextResponse.json({ 
        error: "Insufficient stock", 
        available: product.stockQuantity 
      }, { status: 400 });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: session.user.email });
    
    if (!cart) {
      cart = new Cart({
        userId: session.user.email,
        items: [],
        totalAmount: 0
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      
      // Check total quantity against stock
      if (cart.items[existingItemIndex].quantity > product.stockQuantity) {
        return NextResponse.json({ 
          error: "Requested quantity exceeds available stock",
          available: product.stockQuantity
        }, { status: 400 });
      }
    } else {
      // Add new item
      cart.items.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity,
        imageUrl: product.imageUrl,
        discount: 0
      });
    }

    await cart.save();

    return NextResponse.json({ 
      message: "Item added to cart",
      cart 
    });
  } catch (error: any) {
    console.error("Add to cart error:", error);
    return NextResponse.json({ error: "Failed to add to cart", details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity } = await req.json();

    const cart = await Cart.findOne({ userId: session.user.email });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }

    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity - check stock
      const product = await Product.findById(productId);
      if (product && quantity > product.stockQuantity) {
        return NextResponse.json({ 
          error: "Requested quantity exceeds available stock",
          available: product.stockQuantity
        }, { status: 400 });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    return NextResponse.json({ 
      message: "Cart updated",
      cart 
    });
  } catch (error: any) {
    console.error("Update cart error:", error);
    return NextResponse.json({ error: "Failed to update cart", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const cart = await Cart.findOne({ userId: session.user.email });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    if (productId) {
      // Remove specific item
      cart.items = cart.items.filter(
        (item: any) => item.productId.toString() !== productId
      );
    } else {
      // Clear entire cart
      cart.items = [];
    }

    await cart.save();

    return NextResponse.json({ 
      message: "Cart updated",
      cart 
    });
  } catch (error: any) {
    console.error("Delete cart error:", error);
    return NextResponse.json({ error: "Failed to delete cart", details: error.message }, { status: 500 });
  }
}
