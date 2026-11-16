import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import { requireOwner } from "@/lib/auth-helpers";
import { handleCorsPreflightRequest, addSecurityHeaders } from "@/lib/security-headers";
import { sanitizeString } from "@/lib/validation";

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
    const period = sanitizeString(searchParams.get("period") || "week");

    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "day":
        startDate.setDate(now.getDate() - 1);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get all products
    const products = await Product.find();

    // Calculate metrics
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (p.price || 0) * (p.stockQuantity || 0),
      0
    );
    const lowStockCount = products.filter(
      p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= (p.lowStockThreshold || 10)
    ).length;
    const outOfStockCount = products.filter(p => (p.stockQuantity || 0) === 0).length;

    // Category breakdown
    const categoryStats = products.reduce((acc: any, product) => {
      const cat = product.category || "Uncategorized";
      if (!acc[cat]) {
        acc[cat] = {
          count: 0,
          value: 0,
          avgPrice: 0,
          totalStock: 0
        };
      }
      acc[cat].count++;
      acc[cat].value += (product.price || 0) * (product.stockQuantity || 0);
      acc[cat].totalStock += product.stockQuantity || 0;
      return acc;
    }, {});

    // Calculate average prices per category
    Object.keys(categoryStats).forEach(cat => {
      const categoryProducts = products.filter(p => p.category === cat);
      const totalPrice = categoryProducts.reduce((sum, p) => sum + (p.price || 0), 0);
      categoryStats[cat].avgPrice = categoryProducts.length > 0 ? totalPrice / categoryProducts.length : 0;
    });

    // Top 10 products by value
    const topProducts = products
      .map(p => ({
        name: p.name,
        category: p.category,
        value: (p.price || 0) * (p.stockQuantity || 0),
        stock: p.stockQuantity || 0,
        price: p.price || 0,
        brand: p.brand || "N/A"
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Low performers (high stock but potentially slow moving)
    const lowPerformers = products
      .filter(p => (p.stockQuantity || 0) > 50)
      .map(p => ({
        name: p.name,
        category: p.category,
        stock: p.stockQuantity || 0,
        value: (p.price || 0) * (p.stockQuantity || 0),
        brand: p.brand || "N/A"
      }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10);

    // Stock distribution
    const stockDistribution = {
      healthy: products.filter(p => (p.stockQuantity || 0) > (p.lowStockThreshold || 10) * 2).length,
      moderate: products.filter(p => {
        const qty = p.stockQuantity || 0;
        const threshold = p.lowStockThreshold || 10;
        return qty > threshold && qty <= threshold * 2;
      }).length,
      low: lowStockCount,
      outOfStock: outOfStockCount
    };

    // Sales data (if available)
    let salesStats = null;
    try {
      const sales = await Sale.find({
        createdAt: { $gte: startDate, $lte: now }
      });

      if (sales.length > 0) {
        salesStats = {
          totalSales: sales.reduce((sum, s) => sum + s.total, 0),
          orderCount: sales.length,
          avgOrderValue: sales.reduce((sum, s) => sum + s.total, 0) / sales.length
        };
      }
    } catch (error) {
      // Sales collection might not exist yet
      console.log("Sales data not available");
    }

    const response = NextResponse.json({
      overview: {
        totalProducts,
        totalInventoryValue,
        lowStockCount,
        outOfStockCount,
        averageProductValue: totalProducts > 0 ? totalInventoryValue / totalProducts : 0
      },
      categoryStats,
      topProducts,
      lowPerformers,
      stockDistribution,
      salesStats,
      period
    });

    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error("Analytics error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
