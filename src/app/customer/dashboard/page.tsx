"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name || "Guest";
  
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [promotions, setPromo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch recent orders
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData.orders?.slice(0, 3) || []);
      }

      // Fetch active promotions
      const promoRes = await fetch('/api/promotions');
      if (promoRes.ok) {
        const promoData = await promoRes.json();
        console.log('Fetched promotions:', promoData.promotions?.length);
        setPromo(promoData.promotions || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout role="customer" title="Dashboard">
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-8 mb-6">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Welcome back, {userName}! 👋</h1>
          <p className="text-gray-600 text-lg">Ready for a smarter shopping experience?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Link href="/customer/shop" className="block p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-white">
              <div className="text-4xl mb-3">🛒</div>
              <h3 className="text-xl font-bold mb-2">Start Shopping</h3>
              <p className="text-blue-100">Browse our full product catalog</p>
            </div>
          </Link>

          <Link href="/customer/cart" className="block p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-white">
              <div className="text-4xl mb-3">🛍️</div>
              <h3 className="text-xl font-bold mb-2">View Cart</h3>
              <p className="text-green-100">Check your shopping cart</p>
            </div>
          </Link>

          <Link href="/customer/orders" className="block p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-white">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-xl font-bold mb-2">My Orders</h3>
              <p className="text-purple-100">Track your order history</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-blue-900">Recent Orders</h2>
              <Link href="/customer/orders" className="text-blue-600 hover:underline text-sm">View All</Link>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order._id.slice(-6)}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">{order.items?.length || 0} items</p>
                      <p className="font-bold text-blue-900">₹{order.totalAmount?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-3">No orders yet</p>
                <Link href="/customer/shop" className="text-blue-600 hover:underline">Start shopping now</Link>
              </div>
            )}
          </div>

          {/* Active Promotions */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-blue-900">Hot Deals 🔥</h2>
              <Link href="/customer/shop" className="text-blue-600 hover:underline text-sm">View All</Link>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : promotions.length > 0 ? (
              <div className="space-y-4">
                {promotions.slice(0, 3).map((promotion: any) => (
                  <Link key={promotion._id} href="/customer/shop">
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="bg-orange-600 text-white rounded-lg p-3 flex-shrink-0">
                          <div className="text-2xl font-bold">
                            {promotion.discountType === 'percentage' 
                              ? `${promotion.discountValue}%` 
                              : `₹${promotion.discountValue}`}
                          </div>
                          <div className="text-xs">OFF</div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{promotion.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{promotion.description}</p>
                          
                          {promotion.code && (
                            <div className="inline-flex items-center bg-white border border-dashed border-orange-300 rounded px-3 py-1 mb-2">
                              <span className="text-xs text-gray-500 mr-2">Code:</span>
                              <span className="font-mono font-bold text-orange-600 text-sm">{promotion.code}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-2">
                            {promotion.applicableProducts?.length > 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                                {promotion.applicableProducts.length} Products
                              </span>
                            )}
                            {promotion.applicableCategories?.length > 0 && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                                {promotion.applicableCategories.join(', ')}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Valid till: {new Date(promotion.validUntil).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-3">No active promotions</p>
                <Link href="/customer/shop" className="text-blue-600 hover:underline">Browse products</Link>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-200">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-blue-900 text-lg mb-2">Exclusive Deals</h3>
            <p className="text-gray-600 text-sm">Get access to member-only discounts and promotions</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-200">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="font-bold text-blue-900 text-lg mb-2">Fast Delivery</h3>
            <p className="text-gray-600 text-sm">Quick and reliable delivery to your doorstep</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-200">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-blue-900 text-lg mb-2">Smart Shopping</h3>
            <p className="text-gray-600 text-sm">AI-powered recommendations based on your preferences</p>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}

