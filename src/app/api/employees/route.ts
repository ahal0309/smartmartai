import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Employee from "@/models/Employee";
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
    const role = sanitizeString(searchParams.get("role") || "");
    const status = sanitizeString(searchParams.get("status") || "");

    let query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const employees = await Employee.find(query).sort({ name: 1 });

    const response = NextResponse.json({ employees });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Fetch employees error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch employees" },
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

    // Generate employee ID if not provided
    if (!data.employeeId) {
      const count = await Employee.countDocuments();
      data.employeeId = `EMP${String(count + 1).padStart(5, "0")}`;
    }

    const employee = await Employee.create(data);

    const response = NextResponse.json({ success: true, employee }, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Create employee error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
