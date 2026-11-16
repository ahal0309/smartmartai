import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Supplier from "@/models/Supplier";
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeObject, isValidObjectId } from "@/lib/validation";

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const response = handleCorsPreflightRequest(req);
  return response || new NextResponse(null, { status: 204 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }
  try {
    await connectToDatabase();

    if (!isValidObjectId(params.id)) {
      const errorResponse = NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }

    const supplier = await Supplier.findById(params.id);

    if (!supplier) {
      const errorResponse = NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({ supplier });
    return addSecurityHeaders(response);
  } catch (error: any) {
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    if (!isValidObjectId(params.id)) {
      const errorResponse = NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }

    const rawData = await req.json();
    const data = sanitizeObject(rawData);

    const supplier = await Supplier.findByIdAndUpdate(
      params.id,
      data,
      { new: true }
    );

    if (!supplier) {
      const errorResponse = NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({ success: true, supplier });
    return addSecurityHeaders(response);
  } catch (error: any) {
    const errorResponse = NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    if (!isValidObjectId(params.id)) {
      const errorResponse = NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }

    await Supplier.findByIdAndDelete(params.id);
    const response = NextResponse.json({ success: true });
    return addSecurityHeaders(response);
  } catch (error: any) {
    const errorResponse = NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
