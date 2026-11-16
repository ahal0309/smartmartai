import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Supplier from "@/models/Supplier";
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
    const status = sanitizeString(searchParams.get("status") || "");

    let query: any = {};
    if (status) query.status = status;

    const suppliers = await Supplier.find(query).sort({ name: 1 });

    const response = NextResponse.json({ suppliers });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Fetch suppliers error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch suppliers" },
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

    const supplier = await Supplier.create(data);

    const response = NextResponse.json({ success: true, supplier }, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Create supplier error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
