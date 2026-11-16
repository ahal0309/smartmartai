import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { detectFraud } from "@/lib/ai-features";
import Sale from "@/models/Sale";
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
  const rateLimitCheck = rateLimit(`ai-fraud-${clientIp}`, 10, 60000);
  if (!rateLimitCheck.success) {
    return addSecurityHeaders(rateLimitCheck.response!);
  }
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const saleId = sanitizeString(searchParams.get("saleId") || "");

    // If specific sale requested
    if (saleId) {
      const detection = await detectFraud(saleId);
      const response = NextResponse.json({ detection });
      return addSecurityHeaders(response);
    }

    // Analyze recent sales for fraud
    const recentSales = await Sale.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).limit(50);

    const detections = [];
    for (const sale of recentSales) {
      const detection = await detectFraud(sale._id.toString());
      if (detection && detection.shouldFlag) {
        detections.push({
          ...detection,
          saleDetails: {
            total: sale.total,
            items: sale.items.length,
            paymentMethod: sale.paymentMethod,
            customerName: sale.customerName
          }
        });
      }
    }

    const response = NextResponse.json({
      detections,
      totalAnalyzed: recentSales.length,
      flaggedTransactions: detections.length,
      highRisk: detections.filter(d => d.riskLevel === "high").length
    });
    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error("Fraud detection error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to detect fraud" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
