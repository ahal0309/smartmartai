import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import { calculateSmartReorder, forecastDemand } from "@/lib/ai-features";
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { rateLimit, getClientIp } from "@/lib/rate-limiter";
import { sanitizeString } from "@/lib/validation";

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const response = handleCorsPreflightRequest(req);
  return response || new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  // Apply rate limiting for AI endpoints
  const clientIp = getClientIp(req);
  const rateLimitCheck = rateLimit(`ai-reorder-${clientIp}`, 10, 60000);
  if (!rateLimitCheck.success) {
    return addSecurityHeaders(rateLimitCheck.response!);
  }
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const productId = sanitizeString(searchParams.get("productId") || "");

    // If specific product requested
    if (productId) {
      const reorder = await calculateSmartReorder(productId);
      const response = NextResponse.json({ reorder });
      return addSecurityHeaders(response);
    }

    // Get all products (check all products for reordering needs)
    const products = await Product.find({});
    const reorderRecommendations = [];

    for (const product of products) {
      // Check if product stock is below reorder point OR has low stock
      const reorderPoint = product.reorderPoint || product.lowStockThreshold || 20;
      const currentStock = product.stockQuantity || 0;
      
      // Always calculate for products below reorder point or with low stock
      if (currentStock <= reorderPoint || currentStock < 30) {
        const reorder = await calculateSmartReorder(product._id.toString());
        if (reorder && reorder.shouldReorder) {
          reorderRecommendations.push(reorder);
        }
      }
    }

    // Sort by urgency
    reorderRecommendations.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, normal: 2 };
      return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - 
             urgencyOrder[b.urgency as keyof typeof urgencyOrder];
    });

    const response = NextResponse.json({
      recommendations: reorderRecommendations,
      totalProducts: reorderRecommendations.length,
      critical: reorderRecommendations.filter(r => r.urgency === "critical").length,
      high: reorderRecommendations.filter(r => r.urgency === "high").length
    });
    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error("Smart reorder error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to calculate reorder recommendations" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
