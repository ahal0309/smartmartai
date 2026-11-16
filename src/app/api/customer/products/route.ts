import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import Promotion from "@/models/Promotion";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const featured = searchParams.get("featured");

    const query: any = { stockQuantity: { $gt: 0 } }; // Only show in-stock products

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    let products = await Product.find(query).limit(limit).sort({ createdAt: -1 });

    // Get active promotions
    const now = new Date();
    const activePromotions = await Promotion.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    console.log("🔍 [Customer Products API] Active promotions found:", {
      count: activePromotions.length,
      promotions: activePromotions.map(p => ({
        name: p.name,
        type: p.type,
        discountValue: p.discountValue,
        startDate: p.startDate,
        endDate: p.endDate,
        applicableProducts: p.applicableProducts?.length || 0,
        applicableCategories: p.applicableCategories?.length || 0
      }))
    });

    // Apply promotions to products
    let productsWithPromotions = 0;
    products = products.map((product: any) => {
      const productObj = product.toObject();
      
      // Find applicable promotion for this product
      const promotion = activePromotions.find(p => {
        // Check if promotion applies to this specific product
        if (p.applicableProducts && p.applicableProducts.length > 0) {
          const hasProduct = p.applicableProducts.some((id: any) => 
            id.toString() === product._id.toString()
          );
          if (hasProduct) {
            console.log(`✅ Promotion "${p.name}" matches product "${product.name}" (specific product)`);
            return true;
          }
        }
        
        // Check if promotion applies to this category
        if (p.applicableCategories && p.applicableCategories.length > 0) {
          if (p.applicableCategories.includes(product.category)) {
            console.log(`✅ Promotion "${p.name}" matches product "${product.name}" (category: ${product.category})`);
            return true;
          }
        }
        
        // Check if promotion applies to all products
        if ((!p.applicableProducts || p.applicableProducts.length === 0) && 
            (!p.applicableCategories || p.applicableCategories.length === 0)) {
          console.log(`✅ Promotion "${p.name}" matches product "${product.name}" (applies to all)`);
          return true; // Applies to all products
        }
        
        return false;
      });

      if (promotion) {
        productsWithPromotions++;
        // Check usage limit
        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
          return productObj; // Promotion reached usage limit
        }

        productObj.promotion = {
          id: promotion._id,
          code: promotion.code,
          name: promotion.name,
          description: promotion.description,
          discountType: promotion.type, // Use 'type' field from model
          discountValue: promotion.discountValue
        };

        // Calculate discounted price
        if (promotion.type === 'percentage') {
          const discount = (productObj.price * promotion.discountValue) / 100;
          productObj.discountedPrice = productObj.price - discount;
        } else if (promotion.type === 'fixed') {
          productObj.discountedPrice = Math.max(0, productObj.price - promotion.discountValue);
        }
        // For BOGO and bundle deals, don't set discountedPrice (handle at cart level)

        // Apply maximum discount limit if specified
        if (promotion.maximumDiscount && productObj.discountedPrice) {
          const actualDiscount = productObj.price - productObj.discountedPrice;
          if (actualDiscount > promotion.maximumDiscount) {
            productObj.discountedPrice = productObj.price - promotion.maximumDiscount;
          }
        }

        // Round to 2 decimal places
        if (productObj.discountedPrice) {
          productObj.discountedPrice = Math.round(productObj.discountedPrice * 100) / 100;
        }
      }

      return productObj;
    });

    console.log(`🎯 [Customer Products API] Result: ${productsWithPromotions} out of ${products.length} products have promotions applied`);

    // Get featured products (top sellers or promoted)
    if (featured === 'true') {
      products = products.filter((p: any) => p.promotion || p.featured);
    }

    // Get categories for filter
    const categories = await Product.distinct('category');

    return NextResponse.json({ 
      products,
      categories,
      total: products.length
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    return NextResponse.json({ error: "Failed to get products", details: error.message }, { status: 500 });
  }
}
