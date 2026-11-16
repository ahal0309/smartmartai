
"use client";
import React, { useEffect, useState } from 'react';

type User = {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  membership?: string;
  cardLast4?: string;
  cardExp?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  loyaltyPercent?: string;
  loyaltyPoints?: string;
  loyaltyTier?: string;
  address?: string;
};
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/icons';

import DashboardLayout from '@/components/DashboardLayout';

export default function CustomerProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  if (!user) {
    return (
      <DashboardLayout role="customer" title="Profile">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <span className="text-lg text-[#1A408D] font-semibold">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="customer" title="Profile">
      <main className="flex-1 flex flex-row gap-8 p-10 bg-white">
        {/* Central Profile Content */}
        <div className="flex-1 flex flex-col gap-8">
          <h1 className="text-3xl font-bold text-[#1A408D] mb-2">Profile</h1>
          {/* Account Details Card */}
          <Card className="w-full rounded-2xl shadow-lg border border-[#EAF2FB] p-8 flex flex-col gap-6 bg-white">
              <div className="flex gap-8">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2 w-1/2">
                      <label className="text-gray-700 font-semibold">Name</label>
                      <input type="text" value={user?.name || ''} readOnly className="bg-[#F8F9FA] rounded-lg px-4 py-2 border border-[#EAF2FB] text-gray-900 font-medium" />
                    </div>
                    <div className="flex flex-col gap-2 w-1/2">
                      <label className="text-gray-700 font-semibold">Email</label>
                      <input type="email" value={user?.email || ''} readOnly className="bg-[#F8F9FA] rounded-lg px-4 py-2 border border-[#EAF2FB] text-gray-900 font-medium" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2 w-1/2">
                      <label className="text-gray-700 font-semibold">Phone</label>
                      <input type="text" value={user?.phone || ''} readOnly className="bg-[#F8F9FA] rounded-lg px-4 py-2 border border-[#EAF2FB] text-gray-900 font-medium" />
                    </div>
                    <div className="flex flex-col gap-2 w-1/2">
                      <label className="text-gray-700 font-semibold">Credit Card</label>
                      <div className="flex items-center gap-2 bg-[#F8F9FA] rounded-lg px-4 py-2 border border-[#EAF2FB]">
                        <Image src="/visa.png" alt="Visa" width={32} height={20} />
                        <Image src="/mastercard.png" alt="Mastercard" width={32} height={20} />
                        <span className="text-gray-900 font-medium ml-2">{user?.cardLast4 ? `•••• ${user.cardLast4} Exp: ${user.cardExp}` : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Toggles */}
                <div className="flex flex-col gap-6 justify-center items-center w-1/3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-semibold">Email Notifications</span>
                    <input type="checkbox" checked={user?.emailNotifications ?? true} className="accent-[#1A408D] scale-125" readOnly />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-semibold">Push Notifications</span>
                    <input type="checkbox" checked={user?.pushNotifications ?? true} className="accent-[#1A408D] scale-125" readOnly />
                  </div>
                </div>
              </div>
            </Card>

            {/* Loyalty & Rewards Card */}
            <Card className="w-full rounded-2xl shadow-lg border border-[#EAF2FB] p-8 flex flex-col gap-6 bg-white">
              <div className="flex gap-8 items-center">
                <div className="flex flex-col gap-2 w-1/2">
                  <label className="text-gray-700 font-semibold">Loyalty & Rewards</label>
                  <div className="flex items-center gap-6">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 36 36" className="w-20 h-20">
                        <path stroke="#EAF2FB" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path stroke="#1A408D" strokeWidth="4" fill="none" strokeDasharray="75, 25" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center font-bold text-[#1A408D] text-lg">{user?.loyaltyPercent ?? '75%'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#1A408D] text-lg">{user?.loyaltyPoints ?? '750 / 1000 Points'}</span>
                      <span className="text-gray-500 text-sm">{user?.loyaltyTier ?? 'Current Tier: Silver. 250 points to Gold!'}</span>
                      <div className="w-full h-2 bg-[#EAF2FB] rounded mt-2">
                        <div className="h-2 bg-[#1A408D] rounded" style={{ width: user?.loyaltyPercent ? user.loyaltyPercent : '75%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Rewards */}
                <div className="flex flex-col gap-4 w-1/2 items-center">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 border-2 border-[#1A408D] rounded-lg bg-[#EAF2FB] text-[#1A408D] font-bold shadow">
                      <Icons.sparkles className="w-5 h-5" /> 20% off next purchase
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border-2 border-[#1A408D] rounded-lg bg-[#EAF2FB] text-[#1A408D] font-bold shadow">
                      <Icons.truck className="w-5 h-5" /> Free Shipping
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Summary Card (Top Right) */}
          <div className="w-96 flex flex-col gap-6">
            <Card className="rounded-2xl shadow-lg border border-[#EAF2FB] p-8 flex flex-col items-center bg-white">
              <Image src={user?.avatarUrl || "/avatar.jpg"} alt="User Avatar" width={80} height={80} className="rounded-full border-4 border-[#1A408D] mb-4" />
              <span className="font-bold text-xl text-[#1A408D]">{user?.name || ''}</span>
              {user?.membership && (
                <span className="mt-2 bg-[#FFD700] text-[#1A408D] px-3 py-1 rounded text-sm font-bold">{user.membership}</span>
              )}
              <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#1A408D] text-white rounded-lg font-bold shadow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                Edit Profile
              </button>
            </Card>
            {/* Account Details Summary */}
            <Card className="rounded-2xl shadow-lg border border-[#EAF2FB] p-6 flex flex-col gap-4 bg-white">
              <div className="flex gap-2 items-center">
                <span className="text-gray-700 font-semibold">Name:</span>
                <span className="text-gray-900 font-bold">{user?.name || ''}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-gray-700 font-semibold">Email:</span>
                <span className="text-gray-900 font-bold">{user?.email || ''}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-gray-700 font-semibold">Phone:</span>
                <span className="text-gray-900 font-bold">{user?.phone || ''}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-gray-700 font-semibold">Address:</span>
                <span className="text-gray-900 font-bold">{user?.address || ''}</span>
              </div>
            </Card>
          </div>
        </main>
    </DashboardLayout>
  );
}