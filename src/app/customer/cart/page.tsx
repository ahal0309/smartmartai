"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  discount?: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCart(data.cart);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity })
      });

      if (res.ok) {
        await fetchCart();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update cart");
      }
    } catch (error) {
      console.error("Update cart error:", error);
      alert("Failed to update cart");
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (productId: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/cart?productId=${productId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Remove item error:", error);
    } finally {
      setUpdating(false);
    }
  };

  const proceedToCheckout = () => {
    router.push("/customer/checkout");
  };

  if (loading) {
    return (
      <DashboardLayout role="customer" title="Shopping Cart">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-600">Loading cart...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="customer" title="Shopping Cart">
      <div className="max-w-6xl mx-auto">
        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <button
              onClick={() => router.push("/customer/shop")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">
                  Cart Items ({cart.items.length})
                </h2>

                {cart.items.map((item: CartItem) => (
                  <div key={item.productId} className="flex items-center gap-4 py-4 border-b last:border-b-0">
                    <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover rounded" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                      <p className="text-lg font-bold text-gray-900">₹{item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={updating}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 disabled:opacity-50 font-bold text-xl transition-colors"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-semibold text-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={updating}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-50 border border-green-300 text-green-600 hover:bg-green-100 disabled:opacity-50 font-bold text-xl transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        disabled={updating}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{cart.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  {cart.appliedPromotion && (
                    <div className="flex justify-between text-green-600">
                      <span>Promotion Discount</span>
                      <span>-₹{cart.appliedPromotion.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{cart.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => router.push("/customer/shop")}
                  className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
