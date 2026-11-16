import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { forecastDemand } from "@/lib/ai-features";
import Product from "@/models/Product";
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
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) return addSecurityHeaders(authCheck.response!);
  const clientIp = getClientIp(req);
  const rateLimitCheck = rateLimit(`ai-forecast-${clientIp}`, 10, 60000);
  if (!rateLimitCheck.success) return addSecurityHeaders(rateLimitCheck.response!);
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const productId = sanitizeString(searchParams.get("productId") || "");
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 365);

    // If specific product requested
    if (productId) {
      const forecast = await forecastDemand(productId, days);
      return addSecurityHeaders(NextResponse.json({ forecast }));
    }

    // Get forecasts for top products
    const products = await Product.find({ inStock: true })
      .sort({ stockQuantity: -1 })
      .limit(20);
    
    const forecasts = [];
    for (const product of products) {
      const forecast = await forecastDemand(product._id.toString(), days);
      if (forecast) {
        forecasts.push(forecast);
      }
    }

    return addSecurityHeaders(NextResponse.json({
      forecasts,
      period: `${days} days`,
      totalProducts: forecasts.length
    }));

  } catch (error: any) {
    console.error("Demand forecast error:", error);
    return addSecurityHeaders(NextResponse.json({ error: "Failed to forecast demand" }, { status: 500 }));
  }
}
