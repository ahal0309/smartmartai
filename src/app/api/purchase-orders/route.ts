import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PurchaseOrder from "@/models/PurchaseOrder";
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
    const supplierId = sanitizeString(searchParams.get("supplierId") || "");

    let query: any = {};
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;

    const orders = await PurchaseOrder.find(query).sort({ orderDate: -1 });

    const response = NextResponse.json({ orders });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Fetch POs error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch purchase orders" },
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

    // Generate PO number if not provided
    if (!data.poNumber) {
      const count = await PurchaseOrder.countDocuments();
      data.poNumber = `PO${String(count + 1).padStart(6, "0")}`;
    }

    // Calculate totals
    let subtotal = 0;
    data.items = data.items.map((item: any) => {
      item.totalPrice = item.quantity * item.unitPrice;
      subtotal += item.totalPrice;
      return item;
    });

    data.subtotal = subtotal;
    data.tax = data.tax || subtotal * 0.18; // 18% GST
    data.total = data.subtotal + data.tax;

    const po = await PurchaseOrder.create(data);

    const response = NextResponse.json({ success: true, order: po }, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Create PO error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
