import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getPersonalizedRecommendations } from "@/lib/ai-features";
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

  // Apply rate limiting for AI endpoints (expensive operations)
  const clientIp = getClientIp(req);
  const rateLimitCheck = rateLimit(`ai-rec-${clientIp}`, 10, 60000); // 10 requests per minute
  if (!rateLimitCheck.success) {
    return addSecurityHeaders(rateLimitCheck.response!);
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const customerId = sanitizeString(searchParams.get("customerId") || "");
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 20);

    if (!customerId) {
      const errorResponse = NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const recommendations = await getPersonalizedRecommendations(customerId, limit);

    const response = NextResponse.json({
      customerId,
      recommendations,
      count: recommendations.length
    });
    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error("Recommendations error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
