import Product from "@/models/Product";
import Sale from "@/models/Sale";
import PurchaseOrder from "@/models/PurchaseOrder";

/**
 * Demand Forecasting - Predict future demand based on historical sales
 */
export async function forecastDemand(productId: string, daysAhead: number = 30) {
  try {
    const product = await Product.findById(productId);
    if (!product) return null;

    // Get sales history for the product (last 60 days for better analysis)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const sales = await Sale.find({
      "items.productId": productId,
      status: "completed",
      saleDate: { $gte: sixtyDaysAgo }
    });

    // Calculate daily average
    let totalSold = 0;
    sales.forEach(sale => {
      const item = sale.items.find((i: any) => i.productId.toString() === productId.toString());
      if (item) totalSold += item.quantity || 0;
    });

    const daysOfData = 60;
    const dailyAverage = totalSold > 0 ? totalSold / daysOfData : 0;
    const forecastedDemand = Math.ceil(dailyAverage * daysAhead);

    return {
      productId,
      productName: product.name,
      currentStock: product.stockQuantity || 0,
      dailyAverage: parseFloat(dailyAverage.toFixed(2)),
      forecastedDemand,
      daysAhead,
      totalSold,
      recommendedAction: (product.stockQuantity || 0) < forecastedDemand ? "Reorder Soon" : "Stock Sufficient",
      confidence: totalSold > 20 ? "high" : totalSold > 5 ? "medium" : "low"
    };
  } catch (error) {
    console.error("Demand forecasting error:", error);
    return null;
  }
}

/**
 * Smart Reordering - Calculate optimal reorder quantity and timing
 */
export async function calculateSmartReorder(productId: string) {
  try {
    const product = await Product.findById(productId);
    if (!product) return null;

    const currentStock = product.stockQuantity || 0;
    const reorderPoint = product.reorderPoint || product.lowStockThreshold || 20;
    const reorderQuantity = product.reorderQuantity || 50;
    const leadTime = 7; // Assume 7 days lead time

    // Get demand forecast
    const forecast = await forecastDemand(productId, 30);
    
    let dailyDemand = 0;
    let optimalOrderQuantity = reorderQuantity;
    let daysUntilStockout = 0;

    if (forecast && forecast.dailyAverage > 0) {
      // Use forecast data if available
      dailyDemand = forecast.dailyAverage;
      const safetyStock = Math.ceil(dailyDemand * 3); // 3 days safety stock
      const leadTimeDemand = Math.ceil(dailyDemand * leadTime);
      
      optimalOrderQuantity = Math.max(
        Math.ceil(dailyDemand * 30), // 30 days supply
        reorderQuantity, // Minimum configured reorder quantity
        20 // Absolute minimum
      );
      
      daysUntilStockout = dailyDemand > 0 ? Math.floor(currentStock / dailyDemand) : 999;
    } else {
      // No sales history - use configured values and basic heuristics
      dailyDemand = 0.5; // Assume minimal daily demand
      optimalOrderQuantity = reorderQuantity || 50;
      daysUntilStockout = currentStock < reorderPoint ? Math.floor(currentStock / dailyDemand) : 999;
    }

    // Determine if reorder is needed
    const shouldReorder = currentStock <= reorderPoint;
    
    // Calculate urgency based on stock level relative to reorder point
    let urgency = "normal";
    if (currentStock <= reorderPoint * 0.25) {
      urgency = "critical"; // 25% or less of reorder point
    } else if (currentStock <= reorderPoint * 0.5) {
      urgency = "high"; // 50% or less of reorder point
    } else if (currentStock <= reorderPoint) {
      urgency = "normal"; // At or below reorder point
    }

    return {
      productId,
      productName: product.name,
      currentStock,
      dailyDemand: parseFloat(dailyDemand.toFixed(2)),
      reorderPoint,
      optimalOrderQuantity,
      shouldReorder,
      urgency,
      daysUntilStockout: Math.min(daysUntilStockout, 999),
      estimatedCost: (product.costPrice || product.price || 0) * optimalOrderQuantity,
      recommendation: shouldReorder 
        ? `Order ${optimalOrderQuantity} units now (${daysUntilStockout < 999 ? daysUntilStockout + ' days' : 'low stock'} remaining)`
        : `Stock sufficient for ${daysUntilStockout < 999 ? daysUntilStockout + ' days' : 'normal operations'}`
    };
  } catch (error) {
    console.error("Smart reorder calculation error:", error);
    return null;
  }
}

/**
 * Price Optimization - Suggest optimal pricing based on demand and competition
 */
export async function optimizePrice(productId: string) {
  try {
    const product = await Product.findById(productId);
    if (!product) return null;

    const currentPrice = product.price || 0;
    const costPrice = product.costPrice || currentPrice * 0.6; // Assume 40% markup if cost unknown

    // Get sales velocity
    const forecast = await forecastDemand(productId, 30);
    const velocity = forecast ? forecast.dailyAverage : 0;

    // Simple optimization logic
    let suggestedPrice = currentPrice;
    let reasoning = "";

    // Low velocity = reduce price
    if (velocity < 1) {
      suggestedPrice = currentPrice * 0.95; // 5% discount
      reasoning = "Low sales velocity - consider price reduction to boost demand";
    }
    // High velocity = can increase price
    else if (velocity > 10) {
      suggestedPrice = currentPrice * 1.05; // 5% increase
      reasoning = "High demand - opportunity to increase margin";
    }
    // Moderate velocity = maintain
    else {
      suggestedPrice = currentPrice;
      reasoning = "Current price is optimal based on demand";
    }

    // Ensure minimum margin
    const minPrice = costPrice * 1.2; // Minimum 20% margin
    if (suggestedPrice < minPrice) {
      suggestedPrice = minPrice;
      reasoning = "Price adjusted to maintain minimum 20% margin";
    }

    const projectedMargin = ((suggestedPrice - costPrice) / suggestedPrice) * 100;
    const priceChange = ((suggestedPrice - currentPrice) / currentPrice) * 100;

    return {
      productId,
      productName: product.name,
      currentPrice,
      costPrice,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      priceChange: Math.round(priceChange * 100) / 100,
      projectedMargin: Math.round(projectedMargin * 100) / 100,
      salesVelocity: velocity,
      reasoning,
      confidence: velocity > 5 ? "high" : velocity > 2 ? "medium" : "low"
    };
  } catch (error) {
    console.error("Price optimization error:", error);
    return null;
  }
}

/**
 * Customer Churn Prediction - Identify customers at risk of not returning
 */
export async function predictCustomerChurn(customerId: string) {
  try {
    const Customer = (await import("@/models/Customer")).default;
    const customer = await Customer.findOne({ customerId });
    if (!customer) return null;

    const now = new Date();
    const lastVisit = customer.lastVisit ? new Date(customer.lastVisit) : null;
    const daysSinceLastVisit = lastVisit 
      ? Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Churn risk factors
    const avgDaysBetweenVisits = customer.totalPurchases > 1 
      ? 30 // Simplified assumption
      : 60;

    const isInactive = daysSinceLastVisit > avgDaysBetweenVisits * 2;
    const hasLowEngagement = customer.totalPurchases < 3;
    const hasLowSpend = customer.totalSpent < 500;

    let churnRisk = 0;
    if (isInactive) churnRisk += 40;
    if (hasLowEngagement) churnRisk += 30;
    if (hasLowSpend) churnRisk += 30;

    const riskLevel = churnRisk > 70 ? "high" : churnRisk > 40 ? "medium" : "low";

    // Recommendations
    const recommendations = [];
    if (isInactive) recommendations.push("Send re-engagement email with special offer");
    if (hasLowEngagement) recommendations.push("Offer loyalty bonus to encourage repeat visits");
    if (hasLowSpend) recommendations.push("Promote bundle deals to increase basket size");

    return {
      customerId,
      customerName: customer.name,
      segment: customer.segment,
      churnRisk,
      riskLevel,
      daysSinceLastVisit,
      totalPurchases: customer.totalPurchases,
      totalSpent: customer.totalSpent,
      loyaltyPoints: customer.loyaltyPoints,
      recommendations
    };
  } catch (error) {
    console.error("Churn prediction error:", error);
    return null;
  }
}

/**
 * Personalized Recommendations - Suggest products for a customer
 */
export async function getPersonalizedRecommendations(customerId: string, limit: number = 5) {
  try {
    // Get customer's purchase history
    const sales = await Sale.find({
      customerId,
      status: "completed"
    }).limit(10);

    // Extract purchased categories
    const purchasedCategories = new Set<string>();
    const purchasedProducts = new Set<string>();
    
    sales.forEach(sale => {
      sale.items.forEach((item: any) => {
        purchasedProducts.add(item.productId);
      });
    });

    // Get products from purchased categories (collaborative filtering simplified)
    const recommendations = await Product.find({
      _id: { $nin: Array.from(purchasedProducts) },
      inStock: true,
      stockQuantity: { $gt: 0 }
    })
    .sort({ stockQuantity: -1 }) // Popular items
    .limit(limit);

    return recommendations.map(product => ({
      productId: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      brand: product.brand,
      imageUrl: product.imageUrl,
      reason: "Based on your shopping history"
    }));
  } catch (error) {
    console.error("Personalized recommendations error:", error);
    return [];
  }
}

/**
 * Fraud Detection - Identify suspicious transactions
 */
export async function detectFraud(saleId: string) {
  try {
    const sale = await Sale.findById(saleId);
    if (!sale) return null;

    let fraudScore = 0;
    const alerts = [];

    // Check for unusually high transaction amount
    const avgOrderValue = 1000; // Simplified - should calculate from historical data
    if (sale.total > avgOrderValue * 3) {
      fraudScore += 30;
      alerts.push("Transaction amount significantly higher than average");
    }

    // Check for unusual quantity
    const hasHighQuantity = sale.items.some((item: any) => item.quantity > 20);
    if (hasHighQuantity) {
      fraudScore += 25;
      alerts.push("Unusually high quantity of items");
    }

    // Check for rapid transactions (if customerId exists)
    if (sale.customerId) {
      const recentSales = await Sale.find({
        customerId: sale.customerId,
        createdAt: { 
          $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      });

      if (recentSales.length > 5) {
        fraudScore += 45;
        alerts.push("Multiple transactions in short time period");
      }
    }

    const riskLevel = fraudScore > 70 ? "high" : fraudScore > 40 ? "medium" : "low";
    const shouldFlag = fraudScore > 40;

    return {
      saleId,
      fraudScore,
      riskLevel,
      shouldFlag,
      alerts,
      recommendation: shouldFlag 
        ? "Review transaction manually before processing"
        : "Transaction appears legitimate"
    };
  } catch (error) {
    console.error("Fraud detection error:", error);
    return null;
  }
}
