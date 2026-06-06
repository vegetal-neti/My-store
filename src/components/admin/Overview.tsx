import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, DollarSign, Users } from 'lucide-react';
import { getOrders, getProducts, getUsers } from '../../firebase';

export const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalSales: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersData, productsData, usersData] = await Promise.all([
          getOrders(),
          getProducts(),
          getUsers()
        ]);

        let sales = 0;
        let pending = 0;
        ordersData?.forEach((order: any) => {
          sales += order.totalPrice || 0;
          if (order.status === 'pending') pending++;
        });

        setStats({
          totalOrders: ordersData?.length || 0,
          pendingOrders: pending,
          totalProducts: productsData?.length || 0,
          totalSales: sales,
          totalUsers: usersData?.length || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-brand-text">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <DollarSign className="text-blue-500" size={24} />
          </div>
          <div>
            <span className="block text-[13px] text-neutral-500 font-medium mb-1 uppercase tracking-wider">Total Sales</span>
            <span className="block text-2xl font-serif text-brand-text">${stats.totalSales.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <ShoppingCart className="text-orange-500" size={24} />
          </div>
          <div>
            <span className="block text-[13px] text-neutral-500 font-medium mb-1 uppercase tracking-wider">Pending Orders</span>
            <span className="block text-2xl font-serif text-brand-text">{stats.pendingOrders}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <Package className="text-purple-500" size={24} />
          </div>
          <div>
            <span className="block text-[13px] text-neutral-500 font-medium mb-1 uppercase tracking-wider">Total Products</span>
            <span className="block text-2xl font-serif text-brand-text">{stats.totalProducts}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <Users className="text-green-500" size={24} />
          </div>
          <div>
            <span className="block text-[13px] text-neutral-500 font-medium mb-1 uppercase tracking-wider">Customers</span>
            <span className="block text-2xl font-serif text-brand-text">{stats.totalUsers}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
