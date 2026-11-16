import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Sale from "@/models/Sale";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "week";

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

    // Aggregate sales by day
    const salesByDay = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
          status: "completed"
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalSales: { $sum: "$total" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Best selling products
    const bestSellers = await Sale.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: "completed"
        } 
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // Sales by payment method
    const paymentMethods = await Sale.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: "completed"
        } 
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          total: { $sum: "$total" }
        }
      }
    ]);

    // Calculate totals
    const totals = salesByDay.reduce(
      (acc, day) => ({
        revenue: acc.revenue + day.totalSales,
        orders: acc.orders + day.orderCount
      }),
      { revenue: 0, orders: 0 }
    );

    const avgOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0;

    return NextResponse.json({
      salesByDay,
      bestSellers,
      paymentMethods,
      totals: {
        ...totals,
        avgOrderValue
      },
      period
    });

  } catch (error: any) {
    console.error("Sales analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales analytics", details: error.message },
      { status: 500 }
    );
  }
}
