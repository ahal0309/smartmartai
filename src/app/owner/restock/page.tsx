import DashboardLayout from '@/components/DashboardLayout';

export default function OwnerRestockPage() {
  return (
    <DashboardLayout role="owner" title="Restock Alerts">
      <div className="bg-white p-6 rounded-xl shadow border">
        <p className="text-gray-700">Set thresholds and get alerts when items go low.</p>
      </div>
    </DashboardLayout>
  );
}
