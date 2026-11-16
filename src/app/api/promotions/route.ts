import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Promotion from "@/models/Promotion";
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeString, sanitizeObject } from "@/lib/validation";

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const response = handleCorsPreflightRequest(req);
  return response || new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = sanitizeString(searchParams.get("status") || "");
    const admin = searchParams.get("admin"); // Check if this is an admin request

    // If admin=true, require authentication
    if (admin === "true") {
      const authCheck = await requireOwner(req);
      if (!authCheck.authorized) {
        return addSecurityHeaders(authCheck.response!);
      }

      // Owner can see all promotions
      let query: any = {};
      if (status) query.status = status;

      const promotions = await Promotion.find(query).sort({ startDate: -1 });
      const response = NextResponse.json({ promotions });
      return addSecurityHeaders(response);
    }

    // Public access: only show active promotions within date range
    const now = new Date();
    const query: any = {
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    console.log("🎉 [Promotions API] Public access - searching for active promotions", {
      currentDate: now,
      query
    });

    const promotions = await Promotion.find(query)
      .select('name description code type discountValue startDate endDate minimumPurchase')
      .sort({ startDate: -1 })
      .limit(20);

    console.log("🎉 [Promotions API] Found promotions:", {
      count: promotions.length,
      promotions: promotions.map(p => ({
        name: p.name,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        type: p.type
      }))
    });

    const response = NextResponse.json({ promotions });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Fetch promotions error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch promotions" },
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

    // Auto-set status based on dates
    const now = new Date();
    if (new Date(data.startDate) > now) {
      data.status = "scheduled";
    } else if (new Date(data.endDate) < now) {
      data.status = "expired";
    } else {
      data.status = "active";
    }

    const promotion = await Promotion.create(data);

    const response = NextResponse.json({ success: true, promotion }, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Create promotion error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function PUT(req: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();
    const rawData = await req.json();
    const { id, ...updateData } = sanitizeObject(rawData);

    if (!id) {
      const errorResponse = NextResponse.json(
        { error: "Promotion ID is required" },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    // Auto-set status based on dates
    const now = new Date();
    if (new Date(updateData.startDate) > now) {
      updateData.status = "scheduled";
    } else if (new Date(updateData.endDate) < now) {
      updateData.status = "expired";
    } else {
      updateData.status = "active";
    }

    const promotion = await Promotion.findByIdAndUpdate(id, updateData, { new: true });

    if (!promotion) {
      const errorResponse = NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({ success: true, promotion });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Update promotion error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to update promotion" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function DELETE(req: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      const errorResponse = NextResponse.json(
        { error: "Promotion ID is required" },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const promotion = await Promotion.findByIdAndDelete(id);

    if (!promotion) {
      const errorResponse = NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({ success: true, message: "Promotion deleted successfully" });
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Delete promotion error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to delete promotion" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
