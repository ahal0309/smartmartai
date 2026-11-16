import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import { optimizePrice } from "@/lib/ai-features";
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { rateLimit, getClientIp } from "@/lib/rate-limiter";
import { sanitizeString } from "@/lib/validation";

export async function OPTIONS(req: NextRequest) {
  const response = handleCorsPreflightRequest(req);
  return response || new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) return addSecurityHeaders(authCheck.response!);
  const clientIp = getClientIp(req);
  const rateLimitCheck = rateLimit(`ai-price-${clientIp}`, 10, 60000);
  if (!rateLimitCheck.success) return addSecurityHeaders(rateLimitCheck.response!);

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const productId = sanitizeString(searchParams.get("productId") || "");

    // If specific product requested
    if (productId) {
      const optimization = await optimizePrice(productId);
      return addSecurityHeaders(NextResponse.json({ optimization }));
    }

    // Get price optimization for all products
    const products = await Product.find({ inStock: true }).limit(50);
    const optimizations = [];

    for (const product of products) {
      const optimization = await optimizePrice(product._id.toString());
      if (optimization && Math.abs(optimization.priceChange) > 1) {
        optimizations.push(optimization);
      }
    }

    // Sort by potential impact
    optimizations.sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange));

    return addSecurityHeaders(NextResponse.json({
      optimizations,
      totalProducts: optimizations.length,
      priceIncreases: optimizations.filter(o => o.priceChange > 0).length,
      priceDecreases: optimizations.filter(o => o.priceChange < 0).length
    }));

  } catch (error: any) {
    console.error("Price optimization error:", error);
    return addSecurityHeaders(NextResponse.json({ error: "Failed to optimize prices" }, { status: 500 }));
  }
}
