import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { predictCustomerChurn } from "@/lib/ai-features";
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
  const rateLimitCheck = rateLimit(`ai-churn-${clientIp}`, 10, 60000);
  if (!rateLimitCheck.success) return addSecurityHeaders(rateLimitCheck.response!);

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const customerId = sanitizeString(searchParams.get("customerId") || "");

    // If specific customer requested
    if (customerId) {
      const prediction = await predictCustomerChurn(customerId);
      return addSecurityHeaders(NextResponse.json({ prediction }));
    }

    // Get all customers and analyze churn risk
    const Customer = (await import("@/models/Customer")).default;
    const customers = await Customer.find().limit(100);
    
    const predictions = [];
    for (const customer of customers) {
      const prediction = await predictCustomerChurn(customer.customerId);
      if (prediction) {
        predictions.push(prediction);
      }
    }

    // Sort by risk level
    predictions.sort((a, b) => b.churnRisk - a.churnRisk);

    const highRisk = predictions.filter(p => p.riskLevel === "high");
    const mediumRisk = predictions.filter(p => p.riskLevel === "medium");

    return addSecurityHeaders(NextResponse.json({
      predictions: predictions.slice(0, 20), // Top 20 at-risk customers
      summary: {
        totalAnalyzed: predictions.length,
        highRisk: highRisk.length,
        mediumRisk: mediumRisk.length,
        lowRisk: predictions.length - highRisk.length - mediumRisk.length
      }
    }));

  } catch (error: any) {
    console.error("Churn prediction error:", error);
    return addSecurityHeaders(NextResponse.json({ error: "Failed to predict churn" }, { status: 500 }));
  }
}
