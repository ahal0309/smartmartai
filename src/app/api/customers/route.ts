import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Customer from "@/models/Customer";
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeString, sanitizeObject } from "@/lib/validation";

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
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const segment = sanitizeString(searchParams.get("segment") || "");

    let query: any = {};
    if (segment) query.segment = segment;

    const customers = await Customer.find(query).sort({ totalSpent: -1 });

    // Calculate stats
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / (totalCustomers || 1);

    const segmentBreakdown = {
      vip: customers.filter(c => c.segment === "vip").length,
      regular: customers.filter(c => c.segment === "regular").length,
      new: customers.filter(c => c.segment === "new").length
    };

    const response = NextResponse.json({ 
      customers,
      stats: {
        totalCustomers,
        totalRevenue,
        avgOrderValue,
        segmentBreakdown
      }
    });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Fetch customers error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function POST(req: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();
    const rawData = await req.json();
    const data = sanitizeObject(rawData);

    // Generate customer ID if not provided
    if (!data.customerId) {
      const count = await Customer.countDocuments();
      data.customerId = `CUST${String(count + 1).padStart(6, "0")}`;
    }

    const customer = await Customer.create(data);

    const response = NextResponse.json({ success: true, customer }, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Create customer error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
