"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface Product {
  _id: string;
  name: string;
  sku?: string;
  category: string;
  aisle?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  inStock?: boolean;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
}

interface Stats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export default function OwnerInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [bulkCsv, setBulkCsv] = useState("");

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    category: "",
    price: 0,
    stockQuantity: 0,
    lowStockThreshold: 10,
  });

  useEffect(() => {
    fetchInventory();
  }, [search, categoryFilter, stockFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);
      if (stockFilter) params.append(stockFilter, "true");
      
      // Fetch all products - set high limit to show all inventory
      params.append("limit", "1000");
      params.append("page", "1");

      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();

      setProducts(data.products || []);
      setStats(data.stats || stats);
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          name: "",
          category: "",
          price: 0,
          stockQuantity: 0,
          lowStockThreshold: 10,
        });
        fetchInventory();
        alert("Product added successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add product");
      }
    } catch (error) {
      console.error("Add product error:", error);
      alert("Failed to add product");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentProduct),
      });

      if (res.ok) {
        setShowEditModal(false);
        setCurrentProduct(null);
        fetchInventory();
        alert("Product updated successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Update product error:", error);
      alert("Failed to update product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/inventory?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchInventory();
        alert("Product deleted successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete product error:", error);
      alert("Failed to delete product");
    }
  };

  const handleStockAdjust = async (productId: string, adjustment: number) => {
    const reason = prompt("Reason for adjustment:");
    if (!reason) return;

    try {
      const res = await fetch("/api/inventory/adjust-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, adjustment, reason }),
      });

      if (res.ok) {
        fetchInventory();
        alert(`Stock adjusted by ${adjustment > 0 ? "+" : ""}${adjustment}`);
      }
    } catch (error) {
      console.error("Stock adjustment error:", error);
    }
  };

  const handleBulkImport = async () => {
    try {
      const lines = bulkCsv.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      
      const products = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ''));
        const product: any = {};
        
        headers.forEach((header, i) => {
          if (values[i]) {
            if (header === "price" || header === "stockQuantity" || header === "lowStockThreshold") {
              product[header] = parseFloat(values[i]) || 0;
            } else if (header === "inStock") {
              product[header] = values[i].toLowerCase() === "true";
            } else {
              product[header] = values[i];
            }
          }
        });
        
        return product;
      });

      const res = await fetch("/api/inventory/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowBulkModal(false);
        setBulkCsv("");
        fetchInventory();
        alert(`Imported: ${data.results.created} new, ${data.results.updated} updated`);
      }
    } catch (error) {
      console.error("Bulk import error:", error);
      alert("Failed to import products");
    }
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct({ ...product });
    setShowEditModal(true);
  };

  const getStockBadge = (product: Product) => {
    const qty = product.stockQuantity || 0;
    const threshold = product.lowStockThreshold || 10;

    if (qty === 0) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Out of Stock</span>;
    } else if (qty <= threshold) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">In Stock</span>;
    }
  };

  const exampleCsv = `name,sku,category,aisle,description,price,stockQuantity,lowStockThreshold,brand
"Organic Milk",MILK-002,dairy,A2,"Organic whole milk",5.99,50,10,Horizon
"Sourdough Bread",BREAD-002,bakery,A1,"Artisan sourdough bread",4.49,30,5,Boudin`;

  return (
    <DashboardLayout role="owner" title="Inventory Management">
      <div className="p-6 space-y-6 pb-24">
        {/* Low Stock Alert */}
        {stats.lowStockCount > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Restock Alert: {stats.lowStockCount} {stats.lowStockCount === 1 ? 'product is' : 'products are'} running low on stock
                </p>
                <p className="mt-1 text-xs text-yellow-700">
                  Please review and reorder inventory to avoid stockouts.
                </p>
              </div>
              <button
                onClick={() => setStockFilter('lowStock')}
                className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded hover:bg-yellow-200"
              >
                View Low Stock
              </button>
            </div>
          </div>
        )}

        {/* Out of Stock Alert */}
        {stats.outOfStockCount > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">
                  Critical: {stats.outOfStockCount} {stats.outOfStockCount === 1 ? 'product is' : 'products are'} out of stock
                </p>
                <p className="mt-1 text-xs text-red-700">
                  Immediate action required to replenish inventory.
                </p>
              </div>
              <button
                onClick={() => setStockFilter('outOfStock')}
                className="ml-3 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded hover:bg-red-200"
              >
                View Out of Stock
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-slate-600">Total Products</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalProducts}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-slate-600">Total Inventory Value</div>
            <div className="text-3xl font-bold text-green-600">₹{stats.totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-slate-600">Low Stock Items</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.lowStockCount}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-slate-600">Out of Stock</div>
            <div className="text-3xl font-bold text-red-600">{stats.outOfStockCount}</div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border rounded text-slate-900"
            />
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded text-slate-900"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2 border rounded text-slate-900"
            >
              <option value="">All Stock Levels</option>
              <option value="lowStock">Low Stock ({stats.lowStockCount})</option>
              <option value="outOfStock">Out of Stock ({stats.outOfStockCount})</option>
              <option value="inStock">In Stock</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#1A408D] text-white rounded hover:bg-[#0f2a6b]"
            >
              + Add Product
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              📄 Bulk Import
            </button>

            <button
              onClick={fetchInventory}
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading inventory...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No products found. Click &quot;+ Add Product&quot; to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-50">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-50">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-50">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-50">Aisle</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-50">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-50">Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-50">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{product.name}</div>
                        {product.brand && <div className="text-xs text-slate-500">{product.brand}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.sku || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.aisle || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                        ₹{product.price?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{product.stockQuantity || 0}</span>
                          <button
                            onClick={() => handleStockAdjust(product._id, 10)}
                            className="text-green-600 hover:text-green-700 text-xs"
                            title="Add 10"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleStockAdjust(product._id, -10)}
                            className="text-red-600 hover:text-red-700 text-xs"
                            title="Remove 10"
                          >
                            -10
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStockBadge(product)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Add New Product</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Category *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                        placeholder="e.g., dairy, snacks"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={formData.sku || ""}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                        placeholder="Auto-generated if empty"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Aisle
                      </label>
                      <input
                        type="text"
                        value={formData.aisle || ""}
                        onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                        placeholder="e.g., A2, B3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        value={formData.lowStockThreshold}
                        onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.brand || ""}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-slate-900"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-[#1A408D] text-white rounded hover:bg-[#0f2a6b]"
                    >
                      Add Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditModal && currentProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Edit Product</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleEdit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={currentProduct.name}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Category *
                      </label>
                      <input
                        type="text"
                        required
                        value={currentProduct.category}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={currentProduct.sku || ""}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Aisle
                      </label>
                      <input
                        type="text"
                        value={currentProduct.aisle || ""}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, aisle: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={currentProduct.price}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={currentProduct.stockQuantity}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, stockQuantity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        value={currentProduct.lowStockThreshold}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, lowStockThreshold: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={currentProduct.brand || ""}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, brand: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={currentProduct.description || ""}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-slate-900"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-[#1A408D] text-white rounded hover:bg-[#0f2a6b]"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Bulk Import Products</h2>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm font-medium text-blue-900 mb-2">CSV Format:</div>
                  <div className="text-xs text-blue-800 font-mono">
                    name,sku,category,aisle,description,price,stockQuantity,lowStockThreshold,brand,barcode
                  </div>
                  <div className="text-xs text-blue-700 mt-2">
                    Example: &quot;Organic Milk&quot;,MILK-001,dairy,A2,&quot;Fresh organic milk&quot;,5.99,50,10,Horizon,123456789
                  </div>
                </div>

                <textarea
                  value={bulkCsv}
                  onChange={(e) => setBulkCsv(e.target.value)}
                  className="w-full h-64 px-3 py-2 border rounded font-mono text-sm text-slate-900"
                  placeholder="Paste CSV data here..."
                />

                <button
                  onClick={() => setBulkCsv(exampleCsv)}
                  className="mt-2 px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                >
                  Use Example CSV
                </button>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleBulkImport}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Import Products
                  </button>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
