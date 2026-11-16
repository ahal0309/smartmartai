import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import Sale, { type ISale } from "@/models/Sale";
import PurchaseOrder, { type IPurchaseOrder } from "@/models/PurchaseOrder";
import { Parser } from "json2csv";
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
    const type = sanitizeString(searchParams.get("type") || ""); // inventory, sales, purchases
    const format = sanitizeString(searchParams.get("format") || "json"); // json, csv, pdf
    const period = sanitizeString(searchParams.get("period") || "month");

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

    let reportData: any = {};

    switch (type) {
      case "inventory":
        const products = await Product.find();
        const inventoryData = products.map(p => {
          const price = Number(p.price) || 0;
          const stock = Number(p.stockQuantity) || 0;
          const costPrice = Number(p.costPrice) || 0;
          const threshold = Number(p.lowStockThreshold) || 10;
          
          return {
            name: p.name,
            sku: p.sku || "N/A",
            category: p.category,
            brand: p.brand || "N/A",
            aisle: p.aisle || "Unassigned",
            sellingPrice: price,
            costPrice: costPrice,
            stock: stock,
            retailValue: price * stock,
            costValue: costPrice * stock,
            potentialProfit: (price - costPrice) * stock,
            lowStockThreshold: threshold,
            status: stock === 0 ? "Out of Stock" : 
                    stock <= threshold ? "Low Stock" : "In Stock",
            inStock: p.inStock !== false && stock > 0
          };
        });

        reportData = {
          title: "Inventory Report",
          generatedAt: new Date().toISOString(),
          period: "Current",
          data: inventoryData,
          summary: {
            totalProducts: products.length,
            totalRetailValue: inventoryData.reduce((sum, p) => sum + p.retailValue, 0),
            totalCostValue: inventoryData.reduce((sum, p) => sum + p.costValue, 0),
            potentialProfit: inventoryData.reduce((sum, p) => sum + p.potentialProfit, 0),
            outOfStock: inventoryData.filter(p => p.status === "Out of Stock").length,
            lowStock: inventoryData.filter(p => p.status === "Low Stock").length,
            inStock: inventoryData.filter(p => p.status === "In Stock").length
          }
        };
        break;

      case "sales":
        const sales = await Sale.find({
          createdAt: { $gte: startDate, $lte: now },
          status: "completed"
        }).sort({ createdAt: -1 });

        const salesData = sales.map(s => {
          const subtotal = Number(s.subtotal) || 0;
          const tax = Number(s.tax) || 0;
          const total = Number(s.total) || 0;
          
          return {
            date: s.createdAt.toISOString().split('T')[0],
            time: s.createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            orderId: s._id.toString(),
            customer: s.customerName || "Walk-in",
            itemsCount: s.items.length,
            itemsDetails: s.items.map((item: ISale["items"][number]) => ({
              product: item.productName,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price
            })),
            subtotal: subtotal,
            tax: tax,
            total: total,
            paymentMethod: s.paymentMethod,
            employee: s.employeeName || "N/A"
          };
        });

        const salesTotalRevenue = salesData.reduce((sum, s) => sum + s.total, 0);
        const salesTotalTax = salesData.reduce((sum, s) => sum + s.tax, 0);
        const salesTotalItems = salesData.reduce((sum, s) => sum + s.itemsCount, 0);

        reportData = {
          title: "Sales Report",
          generatedAt: new Date().toISOString(),
          period,
          dateRange: {
            from: startDate.toISOString().split('T')[0],
            to: now.toISOString().split('T')[0]
          },
          data: salesData,
          summary: {
            totalSales: sales.length,
            totalRevenue: salesTotalRevenue,
            totalTax: salesTotalTax,
            totalItems: salesTotalItems,
            avgOrderValue: sales.length > 0 ? salesTotalRevenue / sales.length : 0,
            avgItemsPerOrder: sales.length > 0 ? salesTotalItems / sales.length : 0,
            paymentBreakdown: {
              cash: salesData.filter(s => s.paymentMethod === "cash").length,
              card: salesData.filter(s => s.paymentMethod === "card").length,
              upi: salesData.filter(s => s.paymentMethod === "upi").length,
              wallet: salesData.filter(s => s.paymentMethod === "wallet").length
            }
          }
        };
        break;

      case "purchases":
        const purchases = await PurchaseOrder.find({
          orderDate: { $gte: startDate, $lte: now }
        }).sort({ orderDate: -1 });

        const purchaseData = purchases.map(p => {
          const subtotal = Number(p.subtotal) || 0;
          const tax = Number(p.tax) || 0;
          const total = Number(p.total) || 0;
          
          return {
            poNumber: p.poNumber,
            orderDate: p.orderDate.toISOString().split('T')[0],
            supplier: p.supplierName,
            itemsCount: p.items.length,
            itemsDetails: p.items.map((item: IPurchaseOrder["items"][number]) => ({
              product: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.totalPrice
            })),
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: p.status,
            paymentStatus: p.paymentStatus,
            paymentTerms: p.paymentTerms || "N/A",
            expectedDelivery: p.expectedDeliveryDate?.toISOString().split('T')[0] || "N/A",
            actualDelivery: p.actualDeliveryDate?.toISOString().split('T')[0] || "Pending"
          };
        });

        const purchaseTotalSpend = purchaseData.reduce((sum, p) => sum + p.total, 0);
        const purchaseTotalTax = purchaseData.reduce((sum, p) => sum + p.tax, 0);

        reportData = {
          title: "Purchase Orders Report",
          generatedAt: new Date().toISOString(),
          period,
          dateRange: {
            from: startDate.toISOString().split('T')[0],
            to: now.toISOString().split('T')[0]
          },
          data: purchaseData,
          summary: {
            totalOrders: purchases.length,
            totalSpend: purchaseTotalSpend,
            totalTax: purchaseTotalTax,
            avgOrderValue: purchases.length > 0 ? purchaseTotalSpend / purchases.length : 0,
            statusBreakdown: {
              draft: purchases.filter(p => p.status === "draft").length,
              pending: purchases.filter(p => p.status === "pending").length,
              approved: purchases.filter(p => p.status === "approved").length,
              ordered: purchases.filter(p => p.status === "ordered").length,
              received: purchases.filter(p => p.status === "received").length,
              cancelled: purchases.filter(p => p.status === "cancelled").length
            },
            paymentBreakdown: {
              unpaid: purchases.filter(p => p.paymentStatus === "unpaid").length,
              partial: purchases.filter(p => p.paymentStatus === "partial").length,
              paid: purchases.filter(p => p.paymentStatus === "paid").length
            }
          }
        };
        break;

      case "profit-loss":
        const allSales = await Sale.find({
          createdAt: { $gte: startDate, $lte: now },
          status: "completed"
        });
        const allPurchases = await PurchaseOrder.find({
          orderDate: { $gte: startDate, $lte: now },
          status: "received"
        });
        const allProducts = await Product.find();
        
        // Create product cost map for accurate COGS calculation
        const productCostMap = new Map<string, number>();
        allProducts.forEach(p => {
          productCostMap.set(p._id.toString(), Number(p.costPrice) || Number(p.price) * 0.7 || 0);
        });

        // Calculate accurate revenue and COGS from sales
        let totalRevenue = 0;
        let totalCOGS = 0;
        let totalTaxCollected = 0;
        let totalItemsSold = 0;

        allSales.forEach(sale => {
          totalRevenue += Number(sale.total) || 0;
          totalTaxCollected += Number(sale.tax) || 0;
          
          sale.items.forEach((item: ISale["items"][number]) => {
            const costPrice = productCostMap.get(item.productId) || (Number(item.price) * 0.7);
            totalCOGS += costPrice * item.quantity;
            totalItemsSold += item.quantity;
          });
        });

        const purchaseSpend = allPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
        const grossProfit = totalRevenue - totalCOGS;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const netProfit = grossProfit; // In real scenario, subtract operating expenses
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        reportData = {
          title: "Profit & Loss Report",
          generatedAt: new Date().toISOString(),
          period,
          dateRange: {
            from: startDate.toISOString().split('T')[0],
            to: now.toISOString().split('T')[0]
          },
          summary: {
            totalRevenue: totalRevenue,
            costOfGoodsSold: totalCOGS,
            grossProfit: grossProfit,
            grossMargin: grossMargin,
            netProfit: netProfit,
            netMargin: netMargin,
            totalSales: allSales.length,
            totalItemsSold: totalItemsSold,
            avgRevenuePerSale: allSales.length > 0 ? totalRevenue / allSales.length : 0,
            avgProfitPerSale: allSales.length > 0 ? grossProfit / allSales.length : 0
          },
          data: {
            revenue: {
              salesCount: allSales.length,
              totalRevenue: totalRevenue,
              taxCollected: totalTaxCollected,
              revenueExclTax: totalRevenue - totalTaxCollected,
              averageOrderValue: allSales.length > 0 ? totalRevenue / allSales.length : 0
            },
            costs: {
              costOfGoodsSold: totalCOGS,
              purchaseOrders: allPurchases.length,
              totalPurchaseSpend: purchaseSpend,
              avgCostPerItem: totalItemsSold > 0 ? totalCOGS / totalItemsSold : 0
            },
            profit: {
              grossProfit: grossProfit,
              grossMarginPercent: grossMargin,
              netProfit: netProfit,
              netMarginPercent: netMargin,
              profitPerSale: allSales.length > 0 ? grossProfit / allSales.length : 0,
              profitPerItem: totalItemsSold > 0 ? grossProfit / totalItemsSold : 0
            },
            performance: {
              totalItemsSold: totalItemsSold,
              avgItemsPerSale: allSales.length > 0 ? totalItemsSold / allSales.length : 0,
              avgRevenuePerItem: totalItemsSold > 0 ? totalRevenue / totalItemsSold : 0,
              avgProfitPerItem: totalItemsSold > 0 ? grossProfit / totalItemsSold : 0
            }
          }
        };
        break;

      default:
        const errorResponse = NextResponse.json({ error: "Invalid report type" }, { status: 400 });
        return addSecurityHeaders(errorResponse);
    }

    // Format output
    if (format === "csv" && reportData.data) {
      try {
        const parser = new Parser();
        const csv = parser.parse(Array.isArray(reportData.data) ? reportData.data : [reportData.data]);
        
        const csvResponse = new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
        return addSecurityHeaders(csvResponse);
      } catch (err) {
        console.error("CSV conversion error:", err);
        const errorResponse = NextResponse.json({ error: "Failed to generate CSV" }, { status: 500 });
        return addSecurityHeaders(errorResponse);
      }
    }

    const response = NextResponse.json(reportData);
    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error("Report generation error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
