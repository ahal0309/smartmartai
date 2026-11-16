"use client";
import React, { useState } from 'react';

import Link from 'next/link';
import ChatWidget from './ChatWidget';

export default function DashboardLayout({ children, title, role }: { children: React.ReactNode; title?: string; role: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isOwner = role === 'owner';
  return (
    <div className="min-h-screen bg-[#F8F9FA] relative">
      {/* Header with Hamburger Icon */}
      <header className="bg-[#1A408D] shadow-md flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            className="text-white focus:outline-none mr-4"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
          <span className="text-2xl font-bold text-white tracking-wide">Smart Mart</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-md bg-white text-[#1A408D] font-semibold shadow">{role === 'owner' ? 'Owner' : 'Customer'}</span>
          <img src="/avatar.png" alt="avatar" className="w-9 h-9 rounded-full border-2 border-white" />
        </div>
      </header>
      {/* Collapsible Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg border-r border-[#EAF2FB] flex flex-col gap-6 z-30 transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: '260px', borderTopRightRadius: '24px', borderBottomRightRadius: '24px' }}
      >
        <nav className="flex flex-col gap-3 py-10 px-8">
          <span className="text-lg font-bold text-[#1A408D] mb-2">Menu</span>
          {isOwner ? (
            <>
              <Link href="/owner/dashboard" className="text-base font-medium text-[#1A408D] bg-[#EAF2FB] rounded-lg px-3 py-2 shadow transition">📊 Dashboard</Link>
              <Link href="/owner/inventory" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">📦 Inventory</Link>
              <Link href="/owner/restock" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🔔 Restock Alerts</Link>
              <Link href="/owner/analytics" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">📈 Analytics</Link>
              <Link href="/owner/ai-insights" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🤖 AI Insights</Link>
              <Link href="/owner/maps-waypoints" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🗺️ Maps & Waypoints</Link>
              <Link href="/owner/purchase-orders" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🛒 Purchase Orders</Link>
              <Link href="/owner/suppliers" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🏭 Suppliers</Link>
              <Link href="/owner/employees" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">👥 Employees</Link>
              <Link href="/owner/customers" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">👤 Customers</Link>
              <Link href="/owner/promotions" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🎉 Promotions</Link>
              <Link href="/owner/reports" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">📄 Reports</Link>
            </>
          ) : (
            <>
              <Link href="/customer/dashboard" className="text-base font-medium text-[#1A408D] bg-[#EAF2FB] rounded-lg px-3 py-2 shadow transition">🏠 Dashboard</Link>
              <Link href="/customer/shop" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🛒 Shop</Link>
              <Link href="/customer/cart" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🛍️ Cart</Link>
              <Link href="/customer/orders" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">📦 Orders</Link>
              <Link href="/customer/recipe-finder" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🍳 Recipe Finder</Link>
              <Link href="/customer/profile" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">👤 Profile</Link>
              <Link href="/customer/map-waypoints" className="text-base text-gray-700 hover:text-[#1A408D] transition rounded-lg px-3 py-2">🗺️ Map & Waypoints</Link>
            </>
          )}
        </nav>
      </aside>
      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-20"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      {/* Main Content Area - full width when menu is closed */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <main className="space-y-8">
          {title ? (
            <h2 className="text-3xl font-extrabold text-[#1A408D] mb-4 drop-shadow">{title}</h2>
          ) : null}
          {children}
        </main>
      </div>
      {/* Chat Widget - floating assistant */}
      <ChatWidget />
    </div>
  );
}
