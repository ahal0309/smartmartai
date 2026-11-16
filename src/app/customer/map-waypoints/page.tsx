"use client";
import DashboardLayout from '@/components/DashboardLayout';
import StoreMap from '@/components/store-map';

export default function MapWaypointsPage() {
  return (
    <DashboardLayout role="customer" title="Map & Waypoints">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#1A408D] mb-4">Supermarket Layout & Directions</h1>
        <StoreMap />
      </div>
    </DashboardLayout>
  );
}
