"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("inventory");
  const [period, setPeriod] = useState("month");
  const [format, setFormat] = useState("json");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    try {
      setLoading(true);
      const url = `/api/reports?type=${reportType}&period=${period}&format=${format}`;
      
      if (format === "csv") {
        window.open(url, "_blank");
        return;
      }

      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    if (!reportData) return;
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <DashboardLayout role="owner" title="Reports">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📄 Reports & Export</h1>
          <p className="text-slate-600 text-sm mt-1">Generate comprehensive business reports</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-slate-900 bg-white"
              >
                <option value="inventory">Inventory Report</option>
                <option value="sales">Sales Report</option>
                <option value="purchases">Purchase Orders Report</option>
                <option value="profit-loss">Profit & Loss Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-slate-900 bg-white"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Export Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-slate-900 bg-white"
              >
                <option value="json">JSON (View/Download)</option>
                <option value="csv">CSV (Download)</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 font-medium"
          >
            {loading ? "Generating Report..." : "Generate Report"}
          </button>
        </div>

        {reportData && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{reportData.title}</h3>
              <button
                onClick={downloadJSON}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📥 Download JSON
              </button>
            </div>

            <div className="text-sm text-slate-600 mb-4">
              <div>Generated: {new Date(reportData.generatedAt).toLocaleString('en-IN')}</div>
              {reportData.period && <div>Period: {reportData.period}</div>}
              {reportData.dateRange && (
                <div>Date Range: {reportData.dateRange.from} to {reportData.dateRange.to}</div>
              )}
            </div>

            {reportData.summary && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold mb-3">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.summary).map(([key, value]: [string, any]) => {
                    // Skip nested objects in main summary
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                      return null;
                    }
                    
                    const formatValue = (k: string, v: any) => {
                      if (typeof v !== 'number') return v;
                      
                      // Currency fields
                      if (k.toLowerCase().includes('value') || 
                          k.toLowerCase().includes('revenue') || 
                          k.toLowerCase().includes('spend') ||
                          k.toLowerCase().includes('profit') ||
                          k.toLowerCase().includes('cost') ||
                          k.toLowerCase().includes('tax') ||
                          k.toLowerCase().includes('total') && !k.toLowerCase().includes('total sales') && !k.toLowerCase().includes('total orders')) {
                        return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }
                      
                      // Percentage fields
                      if (k.toLowerCase().includes('margin') || k.toLowerCase().includes('percent')) {
                        return `${v.toFixed(2)}%`;
                      }
                      
                      // Count fields
                      return v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
                    };
                    
                    return (
                      <div key={key}>
                        <div className="text-xs text-slate-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-lg font-bold text-slate-900">
                          {formatValue(key, value)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show breakdown sections if available */}
                {reportData.summary.paymentBreakdown && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="text-sm font-semibold mb-2">Payment Methods</h5>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(reportData.summary.paymentBreakdown).map(([method, count]) => (
                        <div key={method} className="text-center p-2 bg-white rounded">
                          <div className="text-xs text-slate-600 capitalize">{method}</div>
                          <div className="text-sm font-bold">{count as number}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportData.summary.statusBreakdown && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="text-sm font-semibold mb-2">Order Status</h5>
                    <div className="grid grid-cols-6 gap-2">
                      {Object.entries(reportData.summary.statusBreakdown).map(([status, count]) => (
                        <div key={status} className="text-center p-2 bg-white rounded">
                          <div className="text-xs text-slate-600 capitalize">{status}</div>
                          <div className="text-sm font-bold">{count as number}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {reportData.data && (
              <div className="overflow-x-auto">
                <div className="text-sm font-medium mb-2">
                  {Array.isArray(reportData.data) 
                    ? `${reportData.data.length} Records`
                    : "Detailed Data"}
                </div>
                
                {/* Table view for array data */}
                {Array.isArray(reportData.data) && reportData.data.length > 0 && (
                  <div className="overflow-x-auto border rounded-lg mb-4">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          {Object.keys(reportData.data[0])
                            .filter(key => !key.includes('Details') && key !== 'orderId') // Hide nested data in table
                            .map(key => (
                              <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {reportData.data.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            {Object.entries(row)
                              .filter(([key]) => !key.includes('Details') && key !== 'orderId')
                              .map(([key, value]: [string, any]) => (
                                <td key={key} className="px-3 py-2 text-sm text-slate-900">
                                  {typeof value === 'number' 
                                    ? (key.toLowerCase().includes('value') || 
                                       key.toLowerCase().includes('price') || 
                                       key.toLowerCase().includes('total') ||
                                       key.toLowerCase().includes('subtotal') ||
                                       key.toLowerCase().includes('tax') ||
                                       key.toLowerCase().includes('profit')
                                      ? `₹${value.toFixed(2)}`
                                      : value)
                                    : (typeof value === 'boolean' 
                                      ? (value ? '✓' : '✗')
                                      : (value?.toString() || 'N/A'))}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* JSON view for nested/complex data */}
                {!Array.isArray(reportData.data) && (
                  <div className="space-y-4">
                    {Object.entries(reportData.data).map(([section, sectionData]: [string, any]) => (
                      <div key={section} className="border rounded-lg p-4 bg-white">
                        <h5 className="font-semibold mb-3 capitalize text-slate-900">
                          {section.replace(/([A-Z])/g, ' $1').trim()}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {typeof sectionData === 'object' && Object.entries(sectionData).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <div className="text-xs text-slate-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              <div className="text-base font-bold text-slate-900">
                                {typeof value === 'number'
                                  ? (key.toLowerCase().includes('revenue') ||
                                     key.toLowerCase().includes('cost') ||
                                     key.toLowerCase().includes('profit') ||
                                     key.toLowerCase().includes('price') ||
                                     key.toLowerCase().includes('value') ||
                                     key.toLowerCase().includes('spend') ||
                                     key.toLowerCase().includes('tax')
                                    ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : key.toLowerCase().includes('percent') || key.toLowerCase().includes('margin')
                                    ? `${value.toFixed(2)}%`
                                    : value.toLocaleString('en-IN'))
                                  : value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expandable JSON for full details */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View Raw JSON Data
                  </summary>
                  <pre className="mt-2 bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(reportData.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">📊 Inventory Report</h4>
            <p className="text-sm text-blue-800">
              Complete stock status, valuations, and alerts. Includes product details, stock levels, and inventory value calculations.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">💰 Sales Report</h4>
            <p className="text-sm text-green-800">
              Comprehensive sales data including transactions, payment methods, and customer information for the selected period.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">📦 Purchase Orders Report</h4>
            <p className="text-sm text-purple-800">
              All purchase orders with supplier details, order status, payment status, and delivery information.
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">📈 Profit & Loss Report</h4>
            <p className="text-sm text-orange-800">
              Financial performance overview including revenue, costs, gross profit, and margins for analysis.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
