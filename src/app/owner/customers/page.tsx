"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface Customer {
  _id: string;
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  segment: string;
  loyaltyPoints: number;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  lastVisit?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchCustomers();
  }, [filter]);

  const fetchCustomers = async () => {
    try {
      const url = filter === "all" ? "/api/customers" : `/api/customers?segment=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data.customers || []);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      vip: "bg-purple-100 text-purple-800",
      regular: "bg-blue-100 text-blue-800",
      new: "bg-green-100 text-green-800"
    };
    return colors[segment] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <DashboardLayout role="owner" title="Customers">
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="owner" title="Customers">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">👤 Customer Insights</h1>
            <p className="text-slate-600 text-sm mt-1">Understand your customers and build loyalty</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white text-slate-900"
          >
            <option value="all">All Customers</option>
            <option value="vip">VIP</option>
            <option value="regular">Regular</option>
            <option value="new">New</option>
          </select>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-slate-600">Total Customers</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{stats.totalCustomers}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-slate-600">Total Revenue</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                ₹{stats.totalRevenue.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-slate-600">Avg Order Value</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                ₹{stats.avgOrderValue.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-slate-600">VIP Customers</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                {stats.segmentBreakdown.vip}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Customer List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Segment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Purchases</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Total Spent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Loyalty Points</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {customer.customerId}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div>{customer.email || "-"}</div>
                        <div className="text-xs">{customer.phone || "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSegmentColor(customer.segment)}`}>
                          {customer.segment.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{customer.totalPurchases}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ₹{customer.totalSpent.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          {customer.loyaltyPoints} pts
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : "Never"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
