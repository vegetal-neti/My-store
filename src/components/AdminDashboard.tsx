import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../firebase';
import { ArrowLeft, LayoutDashboard, ShoppingCart, Package, Tag, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { AdminOverview } from './admin/Overview';
import { AdminOrders } from './admin/Orders';
import { AdminProducts } from './admin/Products';
import { AdminCategories } from './admin/Categories';
import { AdminCustomers } from './admin/Customers';
import { AdminSettings } from './admin/Settings';

export const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'categories' | 'customers' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="w-8 h-8 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
       <div className="flex-1 flex flex-col items-center justify-center p-6 bg-brand-bg min-h-screen">
         <h2 className="text-xl font-medium text-brand-text">Access Denied</h2>
         <p className="text-[15px] text-neutral-500 mt-2 text-center max-w-[300px]">You don't have permission to view this page. This area is restricted to administrators.</p>
         <button onClick={onBack} className="mt-8 bg-brand-text text-white px-8 py-3.5 rounded-full font-medium text-[15px] hover:bg-neutral-800 transition-colors shadow-sm">
           Return to Shop
         </button>
       </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await logOut();
      onBack();
    } catch (error) {
      console.error(error);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen bg-neutral-50 font-sans selection:bg-brand-text selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-neutral-200/60 w-64 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex items-center justify-between border-b border-neutral-100">
          <div className="flex flex-col">
             <span className="font-serif italic text-2xl tracking-tight text-brand-text leading-none">Shoplix</span>
             <span className="text-[11px] font-medium tracking-widest text-neutral-400 uppercase mt-1">Admin Panel</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 -mr-1 lg:hidden text-neutral-500 hover:text-brand-text">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                  isActive ? 'bg-neutral-100 text-brand-text' : 'text-neutral-500 hover:bg-neutral-50 hover:text-brand-text'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 mb-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Admin" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-500 font-medium shrink-0">
                 {currentUser.email?.[0].toUpperCase() || 'A'}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-[14px] font-medium text-brand-text truncate">{currentUser.displayName || 'Admin'}</span>
              <span className="text-[12px] text-neutral-500 truncate">{currentUser.email}</span>
            </div>
          </div>
          
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-neutral-500 hover:bg-neutral-50 hover:text-brand-text transition-colors mb-1"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
            Back to Store
          </button>

          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-neutral-200/60 px-5 md:px-8 py-4 flex items-center shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-1 -ml-1 mr-4 lg:hidden text-neutral-500 hover:text-brand-text">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-medium text-brand-text capitalize">
            {activeTab}
          </h1>
        </header>

        <div className="flex-1 overflow-auto p-5 md:p-8">
           <div className="w-full mx-auto max-w-6xl">
             {activeTab === 'dashboard' && <AdminOverview />}
             {activeTab === 'orders' && <AdminOrders />}
             {activeTab === 'products' && <AdminProducts />}
             {activeTab === 'categories' && <AdminCategories />}
             {activeTab === 'customers' && <AdminCustomers />}
             {activeTab === 'settings' && <AdminSettings />}
           </div>
        </div>
      </main>
    </div>
  );
};
