"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from 'next-auth/react';
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  category: string;
  imageUrl?: string;
  stockQuantity: number;
  promotion?: {
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
  };
}

interface Promotion {
  _id: string;
  name: string;
  description?: string;
  code?: string;
  type: "percentage" | "fixed" | "bogo" | "bundle";
  discountValue: number;
  status: string;
  startDate: string;
  endDate: string;
}

export default function CustomerHomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string; imageUrl?: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    if (session) {
      fetchCart();
    }
  }, [selectedCategory, searchQuery, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");

      const [productsRes, promotionsRes] = await Promise.all([
        fetch(`/api/customer/products?${params.toString()}`),
        fetch(`/api/promotions`)
      ]);

      const productsData = await productsRes.json();
      const promotionsData = await promotionsRes.json();

      console.log("🔍 Customer Products API Response:", {
        totalProducts: productsData.products?.length || 0,
        productsWithPromotions: (productsData.products || []).filter((p: Product) => p.promotion).length,
        sampleProduct: productsData.products?.[0]
      });

      console.log("🎉 Promotions API Response:", {
        totalPromotions: promotionsData.promotions?.length || 0,
        activePromotions: (promotionsData.promotions || []).filter((p: any) => p.status === 'active').length,
        promotions: promotionsData.promotions
      });

      setProducts(productsData.products || []);
      setCategories(productsData.categories || []);
      
      // Get featured products (with promotions)
      const featuredWithPromotions = (productsData.products || []).filter((p: Product) => p.promotion).slice(0, 6);
      console.log("⭐ Featured products with promotions:", featuredWithPromotions.length);
      setFeaturedProducts(featuredWithPromotions);

      const activePromotions = (promotionsData.promotions || [])
          .filter((p: any) => p.status === 'active')
          .slice(0, 3);
      console.log("✅ Active promotions for banners:", activePromotions.length);
      setPromotions(activePromotions);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCart(data.cart);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    }
  };

  const addToCart = async (productId: string) => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (res.ok) {
        fetchCart();
        alert("Added to cart!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Failed to add to cart");
    }
  };

  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setChatImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() && !chatImagePreview) return;

    const userMessage = chatInput.trim();
    const userImage = chatImagePreview;
    
    setChatInput("");
    setChatImagePreview(null);
    setChatMessages(prev => [...prev, { 
      role: "user", 
      content: userMessage || "What is this?",
      imageUrl: userImage || undefined
    }]);
    setChatLoading(true);

    try {
      // Use /api/assistant if image is present for Gemini vision, otherwise /api/chat
      const endpoint = userImage ? "/api/assistant" : "/api/chat";
      
      let requestBody;
      if (userImage) {
        // Assistant API format for image recognition
        requestBody = {
          query: userMessage || "What is this image? Identify the items and suggest recipes or where to find them in a grocery store.",
          images: [{ url: userImage }],
        };
      } else {
        // Chat API format for regular queries
        requestBody = {
          query: userMessage,
          userType: "customer"
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      
      if (res.ok) {
        setChatMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.answer || data.response || "Sorry, I couldn't process that."
        }]);
      } else {
        setChatMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Sorry, I couldn't process your request. Please try again." 
        }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, there was an error connecting to the assistant." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getDiscountBadge = (product: Product) => {
    // Check if product has discount (either through promotion or discountedPrice)
    let discountText = '';
    
    if (product.promotion) {
      discountText = product.promotion.discountType === 'percentage'
        ? `${product.promotion.discountValue}% OFF`
        : `₹${product.promotion.discountValue} OFF`;
    } else if (product.discountedPrice && product.discountedPrice < product.price) {
      const percentOff = Math.round(((product.price - product.discountedPrice) / product.price) * 100);
      discountText = `${percentOff}% OFF`;
    } else {
      return null;
    }

    return (
      <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
        {discountText}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg border-r border-gray-200 flex flex-col gap-6 z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '260px', borderTopRightRadius: '24px', borderBottomRightRadius: '24px' }}
      >
        <nav className="flex flex-col gap-3 py-10 px-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-blue-900">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {session ? (
            <>
              <button onClick={() => { router.push('/customer/dashboard'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">🏠 Dashboard</button>
              <button onClick={() => { router.push('/customer/shop'); setSidebarOpen(false); }} className="text-base font-medium text-blue-900 bg-blue-100 rounded-lg px-3 py-2 shadow transition text-left">🛒 Shop</button>
              <button onClick={() => { router.push('/customer/cart'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">🛍️ Cart</button>
              <button onClick={() => { router.push('/customer/orders'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">📦 Orders</button>
              <button onClick={() => { router.push('/customer/recipe-finder'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">🍳 Recipe Finder</button>
              <button onClick={() => { router.push('/customer/profile'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">👤 Profile</button>
              <button onClick={() => { signOut({ callbackUrl: '/customer/shop' }); setSidebarOpen(false); }} className="text-base text-red-600 hover:text-red-700 hover:bg-red-50 transition rounded-lg px-3 py-2 text-left font-medium">🚪 Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => { router.push('/customer/shop'); setSidebarOpen(false); }} className="text-base font-medium text-blue-900 bg-blue-100 rounded-lg px-3 py-2 shadow transition text-left">🛒 Shop</button>
              <button onClick={() => { router.push('/customer/recipe-finder'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">🍳 Recipe Finder</button>
              <button onClick={() => { router.push('/login?redirect=/customer/shop'); setSidebarOpen(false); }} className="text-base text-white bg-blue-600 hover:bg-blue-700 transition rounded-lg px-3 py-2 text-left font-medium">🔐 Login</button>
              <button onClick={() => { router.push('/signup'); setSidebarOpen(false); }} className="text-base text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">📝 Sign Up</button>
            </>
          )}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-blue-600 focus:outline-none"
                aria-label="Open menu"
              >
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
              <button onClick={() => router.push("/")} className="text-2xl font-bold text-blue-600">
                🛒 Smart Mart
              </button>
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-gray-600">📍 Deliver to</span>
                <span className="text-sm font-semibold">Your Location</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="absolute right-2 top-2 text-gray-500">
                  🔍
                </button>
              </div>
            </div>

            {/* Cart & Account */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  if (!session) {
                    setShowLoginModal(true);
                  } else {
                    router.push("/customer/cart");
                  }
                }}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
                title={session ? "View cart" : "Login to view cart"}
              >
                <span className="text-2xl">🛒</span>
                {session && cart?.items?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.items.length}
                  </span>
                )}
              </button>
              
              {session ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Hi, {session.user?.name || 'User'}</span>
                </div>
              ) : (
                <button 
                  onClick={() => router.push("/login?redirect=/customer/shop")}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Promotional Banners */}
        {promotions.length > 0 && (
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promotions.map((promo) => (
                <div
                  key={promo._id}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold mb-2">{promo.name}</h3>
                  {promo.description && <p className="text-sm mb-3">{promo.description}</p>}
                  <div className="flex items-center justify-between">
                    {promo.code && (
                      <span className="bg-white text-purple-600 px-3 py-1 rounded font-bold text-sm">
                        Code: {promo.code}
                      </span>
                    )}
                    <span className="text-2xl font-bold ml-auto">
                      {promo.type === 'percentage' 
                        ? `${promo.discountValue}% OFF`
                        : promo.type === 'fixed'
                        ? `₹${promo.discountValue} OFF`
                        : promo.type === 'bogo'
                        ? 'BOGO'
                        : 'BUNDLE DEAL'}
                    </span>
                  </div>
                  <div className="text-xs mt-3 opacity-90">
                    Valid until {new Date(promo.endDate).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">🔥 Hot Deals</h2>
              <span className="text-sm text-gray-600">Limited time offers!</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} onAddToCart={addToCart} getDiscountBadge={getDiscountBadge} />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory === "all" ? "All Products" : selectedCategory}
            </h2>
            <span className="text-sm text-gray-600">{products.length} items</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl text-gray-600">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} onAddToCart={addToCart} getDiscountBadge={getDiscountBadge} fullHeight />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Smart Mart</h3>
              <p className="text-sm text-gray-400">
                Your one-stop shop for all your grocery needs
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/customer/orders" className="hover:text-white">My Orders</a></li>
                <li><a href="/customer/cart" className="hover:text-white">Cart</a></li>
                <li><a href="/customer/dashboard" className="hover:text-white">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Categories</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {categories.slice(0, 5).map(cat => (
                  <li key={cat}>
                    <button onClick={() => setSelectedCategory(cat)} className="hover:text-white">
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📧 support@smartmart.com</li>
                <li>📞 +91-9876543210</li>
                <li>📍 Mumbai, India</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            © 2025 Smart Mart. All rights reserved.
          </div>
        </div>
      </footer>

      {/* AI Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all z-40 flex items-center justify-center"
        title="AI Shopping Assistant"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>

      {/* AI Chatbot Modal */}
      {showChatbot && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Smart Mart AI</h3>
                <p className="text-xs text-blue-100">Your Shopping Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setShowChatbot(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👋</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Hi! I'm your AI assistant</h4>
                <p className="text-sm text-gray-600 mb-4">Ask me anything about products, prices, promotions, or upload images!</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setChatInput("What products are on sale?")}
                    className="w-full text-left px-4 py-2 bg-white rounded-lg hover:bg-blue-50 text-sm text-gray-700 border border-gray-200"
                  >
                    💰 What products are on sale?
                  </button>
                  <button
                    onClick={() => setChatInput("Show me products under ₹100")}
                    className="w-full text-left px-4 py-2 bg-white rounded-lg hover:bg-blue-50 text-sm text-gray-700 border border-gray-200"
                  >
                    🏷️ Show me products under ₹100
                  </button>
                  <button
                    onClick={() => setChatInput("What are today's active promotions?")}
                    className="w-full text-left px-4 py-2 bg-white rounded-lg hover:bg-blue-50 text-sm text-gray-700 border border-gray-200"
                  >
                    🎉 What are today's promotions?
                  </button>
                  <button
                    onClick={() => chatFileInputRef.current?.click()}
                    className="w-full text-left px-4 py-2 bg-white rounded-lg hover:bg-blue-50 text-sm text-gray-700 border border-gray-200"
                  >
                    📸 Upload food image for recipes
                  </button>
                </div>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">🤖</span>
                      <span className="text-xs font-semibold text-gray-500">AI Assistant</span>
                    </div>
                  )}
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                      <Image
                        src={msg.imageUrl}
                        alt="Uploaded"
                        width={200}
                        height={150}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image Preview */}
          {chatImagePreview && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center gap-3">
              <div className="relative">
                <Image
                  src={chatImagePreview}
                  alt="Preview"
                  width={60}
                  height={60}
                  className="rounded-lg border-2 border-blue-600 object-cover"
                />
              </div>
              <div className="flex-1 text-xs text-gray-700">
                <p className="font-semibold">Image attached</p>
                <p className="text-gray-500">AI will identify this image</p>
              </div>
              <button
                onClick={() => setChatImagePreview(null)}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition"
              >
                Remove
              </button>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <input
              type="file"
              ref={chatFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleChatImageUpload}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => chatFileInputRef.current?.click()}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition flex-shrink-0"
                title="Upload image"
                disabled={chatLoading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder={chatImagePreview ? "Describe what you want to know..." : "Ask me anything..."}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={chatLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || (!chatInput.trim() && !chatImagePreview)}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              📸 Upload images for AI recognition • Press Enter to send
            </p>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white rounded-full p-2">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Login Required</h3>
                    <p className="text-blue-100 text-sm">Please sign in to continue</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Smart Mart!</h4>
                <p className="text-gray-600">
                  To add items to your cart and enjoy personalized shopping, please log in to your account.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Save your cart</span> and continue shopping later</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Track your orders</span> in real-time</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Get exclusive deals</span> and personalized offers</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/login?redirect=/customer/shop")}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Login to Continue
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Continue Browsing
                </button>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-600 mt-4">
                Don't have an account?{' '}
                <button
                  onClick={() => router.push("/signup")}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign up now
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart, getDiscountBadge, fullHeight = false }: { 
  product: Product; 
  onAddToCart: (id: string) => void; 
  getDiscountBadge: (p: Product) => React.ReactNode;
  fullHeight?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition cursor-pointer border border-gray-200">
      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
        {getDiscountBadge(product)}
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            📦
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
          <span className="text-xs text-white bg-gray-800/70 px-2 py-1 rounded">
            {product.category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 h-10">
          {product.name}
        </h3>
        {fullHeight && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-baseline space-x-2 mb-3">
          {product.discountedPrice && product.discountedPrice < product.price ? (
            <>
              <span className="text-xl font-bold text-green-600">
                ₹{product.discountedPrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                ₹{product.price.toFixed(2)}
              </span>
              <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                Save ₹{(product.price - product.discountedPrice).toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-gray-900">
              ₹{product.price.toFixed(2)}
            </span>
          )}
        </div>
        {product.stockQuantity < 10 && product.stockQuantity > 0 && (
          <p className="text-xs text-red-600 mb-2">
            Only {product.stockQuantity} left!
          </p>
        )}
        <button
          onClick={() => onAddToCart(product._id)}
          disabled={product.stockQuantity === 0}
          className={`w-full py-2 rounded-lg text-sm font-medium transition ${
            product.stockQuantity === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {product.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
