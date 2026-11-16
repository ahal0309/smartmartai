"use client";
import DashboardLayout from '@/components/DashboardLayout';
import StoreMap from '@/components/store-map';

export default function StoreMapPage() {
  return (
    <DashboardLayout role="customer" title="Store Map">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#1A408D] mb-4">Store Map & Wayfinding</h1>
        <StoreMap />
      </div>
    </DashboardLayout>
  );
}
