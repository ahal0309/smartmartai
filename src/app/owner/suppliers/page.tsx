"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface Supplier {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  rating: number;
  totalOrders: number;
  totalSpend: number;
  status: string;
  onTimeDeliveryRate: number;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactPerson: "",
    paymentTerms: "Net 30"
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert("Supplier added successfully!");
        setShowForm(false);
        fetchSuppliers();
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          contactPerson: "",
          paymentTerms: "Net 30"
        });
      }
    } catch (error) {
      console.error("Failed to add supplier:", error);
      alert("Failed to add supplier");
    }
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (loading) {
    return (
      <DashboardLayout role="owner" title="Suppliers">
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="owner" title="Suppliers">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">🤝 Supplier Management</h1>
            <p className="text-slate-600 text-sm mt-1">Manage your supplier relationships</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Add Supplier"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Add New Supplier</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Supplier Name *"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-slate-900"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-slate-900"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-slate-900"
                />
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-slate-900 bg-white"
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              No suppliers found. Add your first supplier to get started.
            </div>
          ) : (
            suppliers.map((supplier) => (
              <div key={supplier._id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">{supplier.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    supplier.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {supplier.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  {supplier.email && (
                    <div className="text-slate-600">
                      📧 {supplier.email}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="text-slate-600">
                      📞 {supplier.phone}
                    </div>
                  )}
                  
                  <div className="flex items-center pt-2">
                    <span className="text-yellow-500 text-lg">
                      {renderStars(supplier.rating)}
                    </span>
                    <span className="ml-2 text-slate-600">({supplier.rating}/5)</span>
                  </div>
                  
                  <div className="pt-3 border-t space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Orders:</span>
                      <span className="font-semibold">{supplier.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Spend:</span>
                      <span className="font-semibold text-green-600">₹{supplier.totalSpend.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">On-Time Rate:</span>
                      <span className="font-semibold">{supplier.onTimeDeliveryRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
