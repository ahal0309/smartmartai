import DashboardLayout from '@/components/DashboardLayout';

export default function OwnerDashboardPage() {
  return (
    <DashboardLayout role="owner" title="Owner Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-lg border border-indigo-100 flex flex-col items-center">
          <span className="text-2xl font-bold text-indigo-700 mb-2">Inventory</span>
          <span className="text-gray-600">Track stock levels and manage products.</span>
        </div>
        <div className="p-6 bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-lg border border-yellow-100 flex flex-col items-center">
          <span className="text-2xl font-bold text-yellow-700 mb-2">Restock Alerts</span>
          <span className="text-gray-600">Get notified when products are low.</span>
        </div>
        <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg border border-green-100 flex flex-col items-center">
          <span className="text-2xl font-bold text-green-700 mb-2">Profit/Loss</span>
          <span className="text-gray-600">View sales analytics by category.</span>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-lg text-gray-700">Other owner features coming soon...</div>
    </DashboardLayout>
  );
}
