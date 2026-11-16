"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface Promotion {
  _id: string;
  name: string;
  type: string;
  discountValue: number;
  status: string;
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit?: number;
  code?: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [applyTo, setApplyTo] = useState<'all' | 'products' | 'categories'>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  // Helper to get date 30 days from now
  const getDefaultEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };
  
  const [formData, setFormData] = useState({
    name: "",
    type: "percentage",
    discountValue: 0,
    startDate: getTodayDate(),
    endDate: getDefaultEndDate(),
    code: "",
    minimumPurchase: 0,
    usageLimit: 0
  });

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await fetch("/api/promotions?admin=true", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        console.error('Failed to fetch promotions:', res.status, res.statusText);
        if (res.status === 403) {
          alert('Authentication error. Please log in again.');
          return;
        }
      }
      
      const data = await res.json();
      setPromotions(data.promotions || []);
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=1000", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        console.error('Failed to fetch products:', res.status, res.statusText);
        if (res.status === 403) {
          alert('Authentication error. Please log in again.');
          return;
        }
      }
      
      const data = await res.json();
      console.log("Fetched products:", data.products?.length, "products");
      setProducts(data.products || []);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set((data.products || []).map((p: any) => p.category)));
      console.log("Extracted categories:", uniqueCategories);
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (applyTo === 'products' && selectedProducts.length === 0) {
      alert('Please select at least one product for this promotion');
      return;
    }
    if (applyTo === 'categories' && selectedCategories.length === 0) {
      alert('Please select at least one category for this promotion');
      return;
    }

    try {
      const payload = {
        ...formData,
        applicableProducts: applyTo === 'products' ? selectedProducts : [],
        applicableCategories: applyTo === 'categories' ? selectedCategories : [],
        ...(editingId && { id: editingId })
      };

      const res = await fetch("/api/promotions", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert(editingId ? "Promotion updated successfully!" : "Promotion created successfully!");
        setShowForm(false);
        setEditingId(null);
        fetchPromotions();
        resetForm();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save promotion");
      }
    } catch (error) {
      console.error("Failed to save promotion:", error);
      alert("Failed to save promotion");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "percentage",
      discountValue: 0,
      startDate: getTodayDate(),
      endDate: getDefaultEndDate(),
      code: "",
      minimumPurchase: 0,
      usageLimit: 0
    });
    setApplyTo('all');
    setSelectedProducts([]);
    setSelectedCategories([]);
    setEditingId(null);
  };

  const handleEdit = (promo: Promotion) => {
    setEditingId(promo._id);
    setFormData({
      name: promo.name,
      type: promo.type,
      discountValue: promo.discountValue,
      startDate: new Date(promo.startDate).toISOString().split('T')[0],
      endDate: new Date(promo.endDate).toISOString().split('T')[0],
      code: promo.code || "",
      minimumPurchase: 0,
      usageLimit: promo.usageLimit || 0
    });
    
    // Set apply to and selections
    if (promo.applicableProducts && promo.applicableProducts.length > 0) {
      setApplyTo('products');
      setSelectedProducts(promo.applicableProducts);
      setSelectedCategories([]);
    } else if (promo.applicableCategories && promo.applicableCategories.length > 0) {
      setApplyTo('categories');
      setSelectedCategories(promo.applicableCategories);
      setSelectedProducts([]);
    } else {
      setApplyTo('all');
      setSelectedProducts([]);
      setSelectedCategories([]);
    }
    
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the promotion "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/promotions?id=${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        alert("Promotion deleted successfully!");
        fetchPromotions();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete promotion");
      }
    } catch (error) {
      console.error("Failed to delete promotion:", error);
      alert("Failed to delete promotion");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100 text-blue-800",
      expired: "bg-gray-100 text-gray-800",
      disabled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      percentage: "💯",
      fixed: "💰",
      bogo: "🎁",
      bundle: "📦"
    };
    return icons[type] || "🏷️";
  };

  if (loading) {
    return (
      <DashboardLayout role="owner" title="Promotions">
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="owner" title="Promotions">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">🎉 Promotions & Pricing</h1>
            <p className="text-slate-600 text-sm mt-1">Manage discounts and special offers</p>
          </div>
          <button
            onClick={() => {
              if (!showForm) {
                resetForm(); // Reset form with today's dates when opening
              } else {
                setEditingId(null); // Cancel edit mode
              }
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Create Promotion"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{editingId ? "Edit Promotion" : "Create New Promotion"}</h3>
              <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1 rounded">
                📊 {products.length} products • {categories.length} categories loaded
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Promotion Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Sale"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Promotion Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900 bg-white"
                  >
                    <option value="percentage">Percentage Off (e.g., 20% off)</option>
                    <option value="fixed">Fixed Amount Off (e.g., ₹50 off)</option>
                    <option value="bogo">Buy One Get One</option>
                    <option value="bundle">Bundle Deal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    placeholder={formData.type === 'percentage' ? 'e.g., 20 (for 20%)' : 'e.g., 50 (for ₹50)'}
                    required
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.type === 'percentage' ? 'Enter percentage (e.g., 20 for 20% off)' : 'Enter amount in rupees'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., SAVE20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900"
                  />
                  <p className="text-xs text-green-600 mt-1">✓ Defaults to today - promotion will be active immediately</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900"
                  />
                  <p className="text-xs text-slate-600 mt-1">Defaults to 30 days from now</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Minimum Purchase Amount (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="₹0 = No minimum required"
                    min="0"
                    value={formData.minimumPurchase}
                    onChange={(e) => setFormData({ ...formData, minimumPurchase: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">Customer must spend this amount to use the promotion</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="0 = Unlimited uses"
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">How many times this promotion can be used in total</p>
                </div>
              </div>

              {/* Apply To Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">📦 Apply Promotion To:</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200">
                    <input
                      type="radio"
                      name="applyTo"
                      value="all"
                      checked={applyTo === 'all'}
                      onChange={(e) => setApplyTo(e.target.value as any)}
                      className="w-5 h-5"
                    />
                    <span className="text-base font-semibold text-slate-900">🌟 All Products (Store-wide promotion)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200">
                    <input
                      type="radio"
                      name="applyTo"
                      value="categories"
                      checked={applyTo === 'categories'}
                      onChange={(e) => setApplyTo(e.target.value as any)}
                      className="w-5 h-5"
                    />
                    <span className="text-base font-semibold text-slate-900">📂 Specific Categories</span>
                  </label>

                  {applyTo === 'categories' && (
                    <div className="ml-7 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Select categories to apply this promotion:</p>
                      {categories.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-base text-slate-600">No categories found. Please add products with categories first.</p>
                        </div>
                      ) : (
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {categories.map((category) => (
                          <label key={category} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategories([...selectedCategories, category]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(c => c !== category));
                                }
                              }}
                              className="w-5 h-5"
                            />
                            <span className="text-base font-medium text-slate-900">{category}</span>
                          </label>
                        ))}
                      </div>
                      )}
                      {selectedCategories.length > 0 && (
                        <p className="text-xs text-green-600 mt-2">✓ {selectedCategories.length} category(ies) selected</p>
                      )}
                    </div>
                  )}

                  <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200">
                    <input
                      type="radio"
                      name="applyTo"
                      value="products"
                      checked={applyTo === 'products'}
                      onChange={(e) => setApplyTo(e.target.value as any)}
                      className="w-5 h-5"
                    />
                    <span className="text-base font-semibold text-slate-900">📦 Specific Products</span>
                  </label>

                  {applyTo === 'products' && (
                    <div className="ml-7 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Select products to apply this promotion:</p>
                      {products.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-base text-slate-600">No products found. Please add products first.</p>
                        </div>
                      ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {products.map((product) => (
                          <label key={product._id} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProducts([...selectedProducts, product._id]);
                                } else {
                                  setSelectedProducts(selectedProducts.filter(id => id !== product._id));
                                }
                              }}
                              className="w-5 h-5"
                            />
                            <div className="flex-1">
                              <span className="text-base font-semibold text-slate-900">{product.name}</span>
                              <span className="text-sm text-slate-700 ml-2">₹{product.price}</span>
                              <span className="text-sm text-slate-600 ml-2">({product.category})</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      )}
                      {selectedProducts.length > 0 && (
                        <p className="text-xs text-green-600 mt-2">✓ {selectedProducts.length} product(s) selected</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">Total products available: {products.length}</p>
                    </div>
                  )}
                </div>
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
                  {editingId ? "Update Promotion" : "Create Promotion"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              No promotions found. Create your first promotion to boost sales!
            </div>
          ) : (
            promotions.map((promo) => (
              <div key={promo._id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTypeIcon(promo.type)}</span>
                    <h3 className="text-lg font-semibold text-slate-900">{promo.name}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promo.status)}`}>
                    {promo.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Discount:</span>
                    <span className="text-lg font-bold text-green-600">
                      {promo.type === "percentage" ? `${promo.discountValue}%` : `₹${promo.discountValue}`}
                    </span>
                  </div>
                  
                  {promo.code && (
                    <div className="bg-slate-100 p-2 rounded text-center">
                      <span className="text-xs text-slate-600">Code:</span>
                      <div className="font-mono font-bold text-lg">{promo.code}</div>
                    </div>
                  )}
                  
                  <div className="text-sm space-y-1 pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Start:</span>
                      <span className="font-medium">{new Date(promo.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">End:</span>
                      <span className="font-medium">{new Date(promo.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Used:</span>
                      <span className="font-medium">
                        {promo.usageCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Show what the promotion applies to */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-semibold text-slate-900 mb-2">Applies to:</div>
                    {(!promo.applicableProducts || promo.applicableProducts.length === 0) && 
                     (!promo.applicableCategories || promo.applicableCategories.length === 0) ? (
                      <span className="inline-block px-3 py-1.5 bg-purple-100 text-purple-900 text-xs font-semibold rounded-full border border-purple-300">
                        🌟 All Products
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {promo.applicableCategories && promo.applicableCategories.length > 0 && (
                          <span className="inline-block px-3 py-1.5 bg-blue-100 text-blue-900 text-xs font-semibold rounded-full border border-blue-300">
                            📂 {promo.applicableCategories.length} {promo.applicableCategories.length === 1 ? 'Category' : 'Categories'}
                          </span>
                        )}
                        {promo.applicableProducts && promo.applicableProducts.length > 0 && (
                          <span className="inline-block px-3 py-1.5 bg-green-100 text-green-900 text-xs font-semibold rounded-full border border-green-300 ml-1">
                            📦 {promo.applicableProducts.length} {promo.applicableProducts.length === 1 ? 'Product' : 'Products'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 pt-4 border-t flex space-x-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(promo._id, promo.name)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
                    >
                      🗑️ Delete
                    </button>
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
