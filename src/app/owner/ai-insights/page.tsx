"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface SmartReorder {
  productName: string;
  currentStock: number;
  optimalOrderQuantity: number;
  urgency: string;
  daysUntilStockout: number;
  estimatedCost: number;
  recommendation: string;
}

interface PriceOptimization {
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  priceChange: number;
  projectedMargin: number;
  reasoning: string;
  confidence: string;
}

interface ChurnPrediction {
  customerName: string;
  segment: string;
  churnRisk: number;
  riskLevel: string;
  daysSinceLastVisit: number;
  recommendations: string[];
}

export default function AIInsightsPage() {
  const [activeTab, setActiveTab] = useState("reorder");
  const [loading, setLoading] = useState(true);
  
  const [reorders, setReorders] = useState<SmartReorder[]>([]);
  const [reorderStats, setReorderStats] = useState<any>(null);
  
  const [priceOpts, setPriceOpts] = useState<PriceOptimization[]>([]);
  const [priceStats, setPriceStats] = useState<any>(null);
  
  const [churnPreds, setChurnPreds] = useState<ChurnPrediction[]>([]);
  const [churnStats, setChurnStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "reorder":
          const reorderRes = await fetch("/api/ai/smart-reorder");
          const reorderData = await reorderRes.json();
          setReorders(reorderData.recommendations || []);
          setReorderStats({
            total: reorderData.totalProducts,
            critical: reorderData.critical,
            high: reorderData.high
          });
          break;

        case "pricing":
          const priceRes = await fetch("/api/ai/price-optimization");
          const priceData = await priceRes.json();
          setPriceOpts(priceData.optimizations || []);
          setPriceStats({
            total: priceData.totalProducts,
            increases: priceData.priceIncreases,
            decreases: priceData.priceDecreases
          });
          break;

        case "churn":
          const churnRes = await fetch("/api/ai/churn-prediction");
          const churnData = await churnRes.json();
          setChurnPreds(churnData.predictions || []);
          setChurnStats(churnData.summary);
          break;
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      normal: "bg-green-100 text-green-800"
    };
    return colors[urgency] || "bg-gray-100 text-gray-800";
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800"
    };
    return colors[risk] || "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout role="owner" title="AI Insights">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🤖 AI-Powered Insights</h1>
          <p className="text-slate-600 text-sm mt-1">
            Smart recommendations powered by machine learning
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("reorder")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "reorder"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📦 Smart Reordering
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "pricing"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            💰 Price Optimization
          </button>
          <button
            onClick={() => setActiveTab("churn")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "churn"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            👤 Churn Prediction
          </button>
          <button
            onClick={() => setActiveTab("demand")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "demand"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📈 Demand Forecast
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-xl text-slate-600">Analyzing data...</div>
          </div>
        ) : (
          <>
            {/* Smart Reordering Tab */}
            {activeTab === "reorder" && (
              <div className="space-y-6">
                {reorderStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">Products Need Reordering</div>
                      <div className="text-3xl font-bold text-slate-900 mt-2">
                        {reorderStats.total}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">Critical Urgency</div>
                      <div className="text-3xl font-bold text-red-600 mt-2">
                        {reorderStats.critical}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">High Urgency</div>
                      <div className="text-3xl font-bold text-orange-600 mt-2">
                        {reorderStats.high}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Reorder Recommendations</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Product</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Current Stock</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Order Qty</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Days Left</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Urgency</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Est. Cost</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reorders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                              No reordering needed at this time. All stock levels are healthy! ✅
                            </td>
                          </tr>
                        ) : (
                          reorders.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                {item.productName}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{item.currentStock}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                                {item.optimalOrderQuantity}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {item.daysUntilStockout} days
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(item.urgency)}`}>
                                  {item.urgency}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-900">
                                ₹{item.estimatedCost.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                                {item.recommendation}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Price Optimization Tab */}
            {activeTab === "pricing" && (
              <div className="space-y-6">
                {priceStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">Products to Optimize</div>
                      <div className="text-3xl font-bold text-slate-900 mt-2">
                        {priceStats.total}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">Suggested Increases</div>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        {priceStats.increases}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">Suggested Decreases</div>
                      <div className="text-3xl font-bold text-orange-600 mt-2">
                        {priceStats.decreases}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Price Optimization Suggestions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Product</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Current Price</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Suggested Price</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Change</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Margin</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Confidence</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Reasoning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {priceOpts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                              All prices are currently optimized! ✨
                            </td>
                          </tr>
                        ) : (
                          priceOpts.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                {item.productName}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                ₹{item.currentPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                                ₹{item.suggestedPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`font-medium ${item.priceChange > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                  {item.priceChange > 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {item.projectedMargin.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                  item.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.confidence}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                                {item.reasoning}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Churn Prediction Tab */}
            {activeTab === "churn" && (
              <div className="space-y-6">
                {churnStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">Customers Analyzed</div>
                      <div className="text-3xl font-bold text-slate-900 mt-2">
                        {churnStats.totalAnalyzed}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">High Risk</div>
                      <div className="text-3xl font-bold text-red-600 mt-2">
                        {churnStats.highRisk}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">Medium Risk</div>
                      <div className="text-3xl font-bold text-yellow-600 mt-2">
                        {churnStats.mediumRisk}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-sm text-slate-600">Low Risk</div>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        {churnStats.lowRisk}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">At-Risk Customers</h3>
                  </div>
                  <div className="space-y-4 p-6">
                    {churnPreds.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No customers at risk! All customers are engaged. 🎉
                      </div>
                    ) : (
                      churnPreds.map((customer, idx) => (
                        <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-900">{customer.customerName}</h4>
                              <p className="text-sm text-slate-600">
                                Segment: <span className="capitalize">{customer.segment}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(customer.riskLevel)}`}>
                                {customer.churnRisk}% Risk
                              </span>
                              <p className="text-xs text-slate-500 mt-1">
                                {customer.daysSinceLastVisit} days since visit
                              </p>
                            </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-sm font-medium text-blue-900 mb-2">💡 Recommendations:</div>
                            <ul className="text-sm text-blue-800 space-y-1">
                              {customer.recommendations.map((rec, i) => (
                                <li key={i}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Demand Forecast Tab */}
            {activeTab === "demand" && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Demand Forecasting</h3>
                <p className="text-slate-600 mb-4">
                  Advanced demand forecasting is integrated into the Smart Reordering feature.
                </p>
                <button
                  onClick={() => setActiveTab("reorder")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Smart Reordering
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
