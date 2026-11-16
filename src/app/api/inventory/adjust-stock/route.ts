import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { productId, adjustment, reason } = await req.json();

    if (!productId || adjustment === undefined) {
      return NextResponse.json(
        { error: "Product ID and adjustment amount are required" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const oldQuantity = product.stockQuantity || 0;
    const newQuantity = Math.max(0, oldQuantity + adjustment);

    product.stockQuantity = newQuantity;
    product.inStock = newQuantity > 0;

    // Add to stock history
    if (!product.stockHistory) {
      product.stockHistory = [];
    }

    product.stockHistory.push({
      date: new Date(),
      oldQuantity,
      newQuantity,
      adjustment,
      reason: reason || "Manual adjustment",
    });

    // Keep only last 50 history entries
    if (product.stockHistory.length > 50) {
      product.stockHistory = product.stockHistory.slice(-50);
    }

    await product.save();

    return NextResponse.json({
      success: true,
      product,
      message: `Stock adjusted by ${adjustment > 0 ? "+" : ""}${adjustment}`
    });

  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock", details: error.message },
      { status: 500 }
    );
  }
}
