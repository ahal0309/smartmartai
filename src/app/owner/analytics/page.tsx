"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface AnalyticsData {
  overview: {
    totalProducts: number;
    totalInventoryValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    averageProductValue: number;
  };
  categoryStats: Record<string, any>;
  topProducts: Array<any>;
  lowPerformers: Array<any>;
  stockDistribution: {
    healthy: number;
    moderate: number;
    low: number;
    outOfStock: number;
  };
  salesStats?: {
    totalSales: number;
    orderCount: number;
    avgOrderValue: number;
  };
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

export default function OwnerAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics?period=${period}`);
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout role="owner" title="Analytics">
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-slate-600">Loading analytics...</div>
        </div>
      </DashboardLayout>
    );
  }

  const categoryChartData = Object.entries(data.categoryStats).map(([name, stats]: [string, any]) => ({
    name,
    value: stats.value,
    count: stats.count
  }));

  const stockDistData = [
    { name: "Healthy Stock", value: data.stockDistribution.healthy, color: "#10b981" },
    { name: "Moderate", value: data.stockDistribution.moderate, color: "#f59e0b" },
    { name: "Low Stock", value: data.stockDistribution.low, color: "#ef4444" },
    { name: "Out of Stock", value: data.stockDistribution.outOfStock, color: "#991b1b" }
  ];

  return (
    <DashboardLayout role="owner" title="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">📊 Business Analytics</h1>
            <p className="text-slate-600 text-sm mt-1">Comprehensive insights into your business performance</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-600 font-medium">Total Products</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {data.overview.totalProducts}
            </div>
            <div className="text-xs text-slate-500 mt-1">Across all categories</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-600 font-medium">Inventory Value</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              ₹{data.overview.totalInventoryValue.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total stock value</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-600 font-medium">Avg Product Value</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              ₹{data.overview.averageProductValue.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Per product average</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-600 font-medium">Stock Alerts</div>
            <div className="text-3xl font-bold text-red-600 mt-2">
              {data.overview.lowStockCount + data.overview.outOfStockCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {data.overview.lowStockCount} low, {data.overview.outOfStockCount} out
            </div>
          </div>
        </div>

        {/* Sales Stats (if available) */}
        {data.salesStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-md text-white">
              <div className="text-sm font-medium opacity-90">Total Sales</div>
              <div className="text-3xl font-bold mt-2">
                ₹{data.salesStats.totalSales.toFixed(2)}
              </div>
              <div className="text-xs opacity-75 mt-1">{data.salesStats.orderCount} orders</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-md text-white">
              <div className="text-sm font-medium opacity-90">Average Order Value</div>
              <div className="text-3xl font-bold mt-2">
                ₹{data.salesStats.avgOrderValue.toFixed(2)}
              </div>
              <div className="text-xs opacity-75 mt-1">Per transaction</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-md text-white">
              <div className="text-sm font-medium opacity-90">Order Count</div>
              <div className="text-3xl font-bold mt-2">
                {data.salesStats.orderCount}
              </div>
              <div className="text-xs opacity-75 mt-1">Total transactions</div>
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Performance */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Category Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Inventory Value (₹)" />
                <Bar dataKey="count" fill="#10b981" name="Product Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stock Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Stock Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockDistData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stockDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">🏆 Top 10 Products by Value</h3>
            <p className="text-sm text-slate-600 mt-1">Products with highest inventory value</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Rank</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Brand</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.topProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm">
                      <span className="font-bold text-slate-900">#{index + 1}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.brand}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">₹{product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.stock}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      ₹{product.value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Performers */}
        {data.lowPerformers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">⚠️ Products with High Stock</h3>
              <p className="text-sm text-slate-600 mt-1">Monitor these items for potential slow movement</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Brand</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Stock Qty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.lowPerformers.map((product, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{product.brand}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">₹{product.value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
