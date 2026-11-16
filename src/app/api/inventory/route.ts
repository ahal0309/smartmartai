import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeString, validatePagination, sanitizeObject, isValidObjectId, productSchema } from "@/lib/validation";

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const response = handleCorsPreflightRequest(req);
  return response || new NextResponse(null, { status: 204 });
}

// GET all products with filters
export async function GET(req: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = sanitizeString(searchParams.get("search") || "");
    const category = sanitizeString(searchParams.get("category") || "");
    const inStock = searchParams.get("inStock");
    const lowStock = searchParams.get("lowStock");
    const { page, limit } = validatePagination(
      searchParams.get("page") || undefined,
      searchParams.get("limit") || undefined
    );

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (inStock === "true") {
      query.inStock = true;
      query.stockQuantity = { $gt: 0 };
    } else if (inStock === "false") {
      query.$or = [
        { inStock: false },
        { stockQuantity: { $lte: 0 } }
      ];
    }

    if (lowStock === "true") {
      query.$expr = { $lte: ["$stockQuantity", "$lowStockThreshold"] };
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    // Get categories for filter dropdown
    const categories = await Product.distinct("category");

    // Get stock statistics
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$price", "$stockQuantity"] } },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ["$stockQuantity", "$lowStockThreshold"] }, 1, 0]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $lte: ["$stockQuantity", 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const response = NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      categories,
      stats: stats[0] || {
        totalProducts: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      }
    });

    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error("Inventory GET error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

// POST - Create new product
export async function POST(req: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const rawData = await req.json();
    
    // Sanitize input data
    const data = sanitizeObject(rawData);

    // Validate with Zod schema
    const validation = productSchema.safeParse(data);
    if (!validation.success) {
      const errorResponse = NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    // Check for duplicate SKU or barcode
    if (data.sku) {
      const existing = await Product.findOne({ sku: data.sku });
      if (existing) {
        const errorResponse = NextResponse.json(
          { error: "Product with this SKU already exists" },
          { status: 400 }
        );
        return addSecurityHeaders(errorResponse);
      }
    }

    // Auto-generate SKU if not provided
    if (!data.sku) {
      const prefix = data.category.substring(0, 3).toUpperCase();
      const count = await Product.countDocuments({ category: data.category });
      data.sku = `${prefix}-${String(count + 1).padStart(4, "0")}`;
    }

    // Set default stock threshold if not provided
    if (!data.lowStockThreshold) {
      data.lowStockThreshold = 10;
    }

    // Set inStock based on quantity
    if (data.stockQuantity !== undefined) {
      data.inStock = data.stockQuantity > 0;
    }

    const product = await Product.create(data);

    const response = NextResponse.json({
      success: true,
      product,
      message: "Product created successfully"
    }, { status: 201 });

    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error("Inventory POST error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

// PUT - Update product
export async function PUT(req: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(req);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const rawData = await req.json();
    const { _id, ...updates } = rawData;

    // Validate product ID
    if (!_id || !isValidObjectId(_id)) {
      const errorResponse = NextResponse.json(
        { error: "Valid product ID is required" },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    // Sanitize update data
    const sanitizedUpdates = sanitizeObject(updates);

    // Update inStock based on quantity if quantity is being updated
    if (sanitizedUpdates.stockQuantity !== undefined) {
      sanitizedUpdates.inStock = sanitizedUpdates.stockQuantity > 0;
    }

    const product = await Product.findByIdAndUpdate(
      _id,
      { $set: sanitizedUpdates },
      { new: true, runValidators: true }
    );

    if (!product) {
      const errorResponse = NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({
      success: true,
      product,
      message: "Product updated successfully"
    });

    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error("Inventory PUT error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

// DELETE - Remove product
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

    // Validate product ID
    if (!id || !isValidObjectId(id)) {
      const errorResponse = NextResponse.json(
        { error: "Valid product ID is required" },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      const errorResponse = NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({
      success: true,
      message: "Product deleted successfully"
    });

    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error("Inventory DELETE error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
