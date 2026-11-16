import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { products } = await req.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Products array is required" },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[],
    };

    for (const productData of products) {
      try {
        // Check if product exists by SKU or name
        let product = null;
        
        if (productData.sku) {
          product = await Product.findOne({ sku: productData.sku });
        }
        
        if (!product && productData.name) {
          product = await Product.findOne({ name: productData.name });
        }

        if (product) {
          // Update existing
          Object.assign(product, productData);
          await product.save();
          results.updated++;
        } else {
          // Create new
          await Product.create(productData);
          results.created++;
        }
      } catch (error: any) {
        results.errors.push({
          product: productData.name || productData.sku,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.created} new, updated ${results.updated} existing products`
    });

  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Failed to import products", details: error.message },
      { status: 500 }
    );
  }
}
