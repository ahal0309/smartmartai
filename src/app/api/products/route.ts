import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeString, sanitizeObject, isValidObjectId, validatePagination, productSchema } from "@/lib/validation";

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const response = handleCorsPreflightRequest(req);
  return response || new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(request);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const category = sanitizeString(searchParams.get('category') || '');
    const inStock = searchParams.get('inStock');
    const search = sanitizeString(searchParams.get('search') || '');
    
    // Validate pagination with safe limits
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0);

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (inStock !== null) {
      query.inStock = inStock === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .limit(limit)
      .skip(skip)
      .sort({ name: 1 })
      .lean();

    const total = await Product.countDocuments(query);

    const response = NextResponse.json({
      success: true,
      products,
      total,
      limit,
      skip,
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('[Products API] Error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function POST(request: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(request);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);

    // Validate with Zod schema
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      const errorResponse = NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const product = await Product.create(body);

    const response = NextResponse.json({
      success: true,
      product,
    }, { status: 201 });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('[Products API] Error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function PUT(request: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(request);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const rawBody = await request.json();
    const { _id, ...updates } = rawBody;

    // Validate product ID
    if (!_id || !isValidObjectId(_id)) {
      const errorResponse = NextResponse.json(
        { error: 'Valid product ID is required' },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    // Sanitize updates
    const sanitizedUpdates = sanitizeObject(updates);

    const product = await Product.findByIdAndUpdate(
      _id,
      { $set: sanitizedUpdates },
      { new: true, runValidators: true }
    );

    if (!product) {
      const errorResponse = NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({
      success: true,
      product,
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('[Products API] Error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

export async function DELETE(request: NextRequest) {
  // Check authentication and authorization
  const authCheck = await requireOwner(request);
  if (!authCheck.authorized) {
    return addSecurityHeaders(authCheck.response!);
  }

  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate product ID
    if (!id || !isValidObjectId(id)) {
      const errorResponse = NextResponse.json(
        { error: 'Valid product ID is required' },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      const errorResponse = NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('[Products API] Error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
