'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

export default function SuperAdminReports() {
  const [reports, setReports] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [salesRes, productsRes, customersRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/products'),
        fetch('/api/customers')
      ]);

      const salesData = await salesRes.json();
      const productsData = await productsRes.json();
      const customersData = await customersRes.json();

      const revenue = salesData.sales.reduce((sum, sale) => sum + (sale.total || 0), 0);

      setReports({
        totalRevenue: revenue,
        totalSales: salesData.sales.length,
        totalProducts: productsData.products.length,
        totalCustomers: customersData.customers.length
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout userRole="superadmin">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">₹{reports.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">{reports.totalSales}</p>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">{reports.totalProducts}</p>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">{reports.totalCustomers}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

