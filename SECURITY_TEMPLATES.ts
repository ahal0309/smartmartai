/**
 * 🔐 Bulk Security Patcher
 * 
 * This script provides templates for securing all owner API routes.
 * Copy-paste these templates into each route file.
 */

// ============================================
// TEMPLATE 1: Standard Owner Route (Full CRUD)
// Use for: employees, customers, suppliers, promotions
// ============================================

/*
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ModelName from "@/models/ModelName"; // Change ModelName
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeString, sanitizeObject, isValidObjectId, validatePagination } from "@/lib/validation";

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const response = handleCorsPreflightRequest(req);
  return response || new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = sanitizeString(searchParams.get("search") || "");
    const { page, limit } = validatePagination(
      searchParams.get("page"),
      searchParams.get("limit")
    );

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const items = await ModelName.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await ModelName.countDocuments(query);

    const response = NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("GET error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const rawData = await req.json();
    const data = sanitizeObject(rawData);

    const item = await ModelName.create(data);

    const response = NextResponse.json({
      success: true,
      item,
      message: "Item created successfully"
    }, { status: 201 });

    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("POST error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const rawData = await req.json();
    const { _id, ...updates } = rawData;

    if (!_id || !isValidObjectId(_id)) {
      const errorResponse = NextResponse.json(
        { error: "Valid ID is required" },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const sanitizedUpdates = sanitizeObject(updates);

    const item = await ModelName.findByIdAndUpdate(
      _id,
      { $set: sanitizedUpdates },
      { new: true, runValidators: true }
    );

    if (!item) {
      const errorResponse = NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({
      success: true,
      item,
      message: "Item updated successfully"
    });

    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("PUT error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !isValidObjectId(id)) {
      const errorResponse = NextResponse.json(
        { error: "Valid ID is required" },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const item = await ModelName.findByIdAndDelete(id);

    if (!item) {
      const errorResponse = NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({
      success: true,
      message: "Item deleted successfully"
    });

    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("DELETE error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
*/

// ============================================
// TEMPLATE 2: Read-Only Route (GET only)
// Use for: analytics, reports
// ============================================

/*
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeString } from "@/lib/validation";

export async function OPTIONS(req: NextRequest) {
  const response = handleCorsPreflightRequest(req);
  return response || new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const period = sanitizeString(searchParams.get("period") || "month");

    // Your analytics/report logic here
    const data = {}; // Replace with actual data fetching

    const response = NextResponse.json({
      success: true,
      data
    });

    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("GET error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
*/

// ============================================
// TEMPLATE 3: AI Route (POST only with rate limiting)
// Use for: AI features
// ============================================

/*
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeObject } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limiter";

export async function OPTIONS(req: NextRequest) {
  const response = handleCorsPreflightRequest(req);
  return response || new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  // Apply rate limiting for AI routes (expensive operations)
  const clientIp = getClientIp(req);
  const rateLimitCheck = rateLimit(`ai:${clientIp}`, 5, 60000); // 5 requests per minute
  if (!rateLimitCheck.success) {
    return addSecurityHeaders(rateLimitCheck.response!);
  }

  try {
    const rawData = await req.json();
    const data = sanitizeObject(rawData);

    // Your AI logic here
    const result = {}; // Replace with actual AI processing

    const response = NextResponse.json({
      success: true,
      result
    });

    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("AI POST error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
*/

// ============================================
// TEMPLATE 4: Auth Route with Rate Limiting
// Use for: login, register
// ============================================

/*
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limiter";
import { addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeObject } from "@/lib/validation";

export async function POST(req: NextRequest) {
  // Apply strict rate limiting for auth routes
  const clientIp = getClientIp(req);
  const rateLimitCheck = rateLimit(`auth:${clientIp}`, 5, 900000); // 5 attempts per 15 minutes
  if (!rateLimitCheck.success) {
    return addSecurityHeaders(rateLimitCheck.response!);
  }

  try {
    const rawData = await req.json();
    const data = sanitizeObject(rawData);

    // Your auth logic here
    const result = {}; // Replace with actual auth processing

    const response = NextResponse.json({
      success: true,
      result
    });

    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Auth error:", error);
    const errorResponse = NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
*/

// ============================================
// QUICK REFERENCE: Which Template to Use
// ============================================

/*
Route                                    | Template | Notes
-----------------------------------------|----------|---------------------------------------
/api/employees/route.ts                  | 1        | Full CRUD for employee management
/api/customers/route.ts                  | 1        | Full CRUD for customer management
/api/suppliers/route.ts                  | 1        | Full CRUD for supplier management
/api/suppliers/[id]/route.ts             | 1        | Single supplier operations
/api/purchase-orders/route.ts            | 1        | Full CRUD for PO management
/api/purchase-orders/[id]/route.ts       | 1        | Single PO operations
/api/promotions/route.ts                 | 1        | Full CRUD for promotions
/api/promotions/[id]/route.ts            | 1        | Single promotion operations
/api/analytics/route.ts                  | 2        | Read-only analytics data
/api/reports/route.ts                    | 2        | Read-only report generation
/api/ai/generate-*.ts                    | 3        | AI generation with rate limiting
/api/ai/optimize-*.ts                    | 3        | AI optimization with rate limiting
/api/auth/login/route.ts                 | 4        | Add rate limiting only
/api/auth/register/route.ts              | 4        | Add rate limiting only
*/

export {};
