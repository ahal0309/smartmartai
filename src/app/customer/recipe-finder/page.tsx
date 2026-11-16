"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from 'next-auth/react';
import Image from "next/image";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp: Date;
};

export default function RecipeFinderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!input.trim() && !imagePreview) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input || "What recipe can I make with this?",
      imageUrl: imagePreview || undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentImage = imagePreview;
    setInput("");
    setImagePreview(null);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentInput || "Analyze this image and suggest a recipe with ingredients and step-by-step instructions.",
          images: currentImage ? [{ url: currentImage }] : [],
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer || "Sorry, I couldn't process that image.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Recipe finder error:", error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "❌ Error processing image. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
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
              <button onClick={() => { router.push('/customer/shop'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">🛒 Shop</button>
              <button onClick={() => { router.push('/customer/cart'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">🛍️ Cart</button>
              <button onClick={() => { router.push('/customer/orders'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">📦 Orders</button>
              <button onClick={() => { router.push('/customer/recipe-finder'); setSidebarOpen(false); }} className="text-base font-medium text-blue-900 bg-blue-100 rounded-lg px-3 py-2 shadow transition text-left">🍳 Recipe Finder</button>
              <button onClick={() => { router.push('/customer/profile'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">👤 Profile</button>
              <button onClick={() => { signOut({ callbackUrl: '/customer/shop' }); setSidebarOpen(false); }} className="text-base text-red-600 hover:text-red-700 hover:bg-red-50 transition rounded-lg px-3 py-2 text-left font-medium">🚪 Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => { router.push('/customer/shop'); setSidebarOpen(false); }} className="text-base text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition rounded-lg px-3 py-2 text-left">🛒 Shop</button>
              <button onClick={() => { router.push('/customer/recipe-finder'); setSidebarOpen(false); }} className="text-base font-medium text-blue-900 bg-blue-100 rounded-lg px-3 py-2 shadow transition text-left">🍳 Recipe Finder</button>
              <button onClick={() => { router.push('/login?redirect=/customer/recipe-finder'); setSidebarOpen(false); }} className="text-base text-white bg-blue-600 hover:bg-blue-700 transition rounded-lg px-3 py-2 text-left font-medium">🔐 Login</button>
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
            </div>

            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">🍳 Recipe Finder</h1>
            </div>

            <div className="flex items-center space-x-4">
              {session ? (
                <span className="text-sm text-gray-700">Hi, {session.user?.name || 'User'}</span>
              ) : (
                <button 
                  onClick={() => router.push("/login?redirect=/customer/recipe-finder")}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-8 text-white text-center">
            <h2 className="text-4xl font-bold mb-3">📸 AI Recipe Finder</h2>
            <p className="text-lg opacity-90">Upload an image and let AI suggest delicious recipes!</p>
            <p className="text-sm opacity-75 mt-2">Powered by Google Gemini Vision AI</p>
          </div>

          {/* Upload Section */}
          {messages.length === 0 && (
            <div className="p-8">
              <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 transition">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                
                {!imagePreview ? (
                  <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                    <div className="text-8xl mb-4">🍽️</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Food Image</h3>
                    <p className="text-gray-600 mb-6">Click to upload or drag and drop</p>
                    <button className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition">
                      Choose Image
                    </button>
                    <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-gray-600">
                      <div>
                        <div className="text-3xl mb-2">🥗</div>
                        <p className="font-semibold">Ingredients</p>
                        <p className="text-xs">Upload ingredients photo</p>
                      </div>
                      <div>
                        <div className="text-3xl mb-2">🍕</div>
                        <p className="font-semibold">Dishes</p>
                        <p className="text-xs">Get recipe ideas</p>
                      </div>
                      <div>
                        <div className="text-3xl mb-2">🛒</div>
                        <p className="font-semibold">Products</p>
                        <p className="text-xs">Find in our store</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={400}
                        height={300}
                        className="mx-auto rounded-lg shadow-lg"
                      />
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Change Image
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={loading}
                        className="px-8 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg font-semibold disabled:opacity-50"
                      >
                        {loading ? "Analyzing..." : "Get Recipe 🍳"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="p-6 space-y-6 min-h-[400px] max-h-[600px] overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                      : "bg-white border-2 border-gray-200 text-gray-900"
                  }`}>
                    {msg.imageUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden">
                        <Image
                          src={msg.imageUrl}
                          alt="Uploaded"
                          width={300}
                          height={200}
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                        <span className="text-2xl">🤖</span>
                        <span className="font-bold text-blue-600">AI Chef</span>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <p className="text-xs opacity-60 mt-3">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></span>
                        <span className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">AI is analyzing your image...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Section (when chat started) */}
          {messages.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              
              {imagePreview && (
                <div className="mb-3 p-3 bg-white rounded-lg border-2 border-blue-300 flex items-center gap-3">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={60}
                    height={60}
                    className="rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">New image attached</p>
                    <p className="text-xs text-gray-500">Ready to analyze</p>
                  </div>
                  <button
                    onClick={() => setImagePreview(null)}
                    className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask follow-up questions or upload another image..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || (!input.trim() && !imagePreview)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 font-semibold"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                📸 Upload food images • AI will suggest recipes and identify ingredients
              </p>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-orange-200">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-bold text-orange-900 text-lg mb-2">AI-Powered</h3>
            <p className="text-gray-600 text-sm">Advanced Google Gemini Vision AI recognizes ingredients and suggests recipes</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-pink-200">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="font-bold text-pink-900 text-lg mb-2">Detailed Recipes</h3>
            <p className="text-gray-600 text-sm">Get step-by-step instructions with ingredients and cooking tips</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
            <div className="text-4xl mb-3">🛒</div>
            <h3 className="font-bold text-blue-900 text-lg mb-2">Shop Ingredients</h3>
            <p className="text-gray-600 text-sm">Find all ingredients in our Smart Mart store</p>
          </div>
        </div>
      </main>
    </div>
  );
}
