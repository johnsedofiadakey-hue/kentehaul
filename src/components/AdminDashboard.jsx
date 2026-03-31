import React, { useState } from 'react';
import { Package, Users, Edit, Settings, LogOut, Menu, X, ChevronRight, MessageSquare, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from "firebase/auth";
import { auth, db, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';

// Sub-Components
import AdminOrders from './admin/AdminOrders';
import AdminCRM from './admin/AdminCRM';
import AdminProducts from './admin/AdminProducts';
import AdminSettings from './admin/AdminSettings';
import InvoiceCreator from './admin/InvoiceCreator';
import AdminReviews from './admin/AdminReviews';
import AdminPartnerships from './admin/AdminPartnerships';
import AdminWishlists from './admin/AdminWishlists';
import AdminAnalytics from './admin/AdminAnalytics';
import { Heart, BarChart3 } from 'lucide-react';

// Shared Global Components
import InvoiceModal from './InvoiceModal'; // For viewing invoices

export default function AdminDashboard({
  siteContent,
  setSiteContent,
  products,
  orders,
  gallery,
  feedbacks,
  customers,
  setIsAdminAuthenticated
}) {
  // --- STATE ---
  const [adminTab, setAdminTab] = useState('orders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- FCM: Placeholder ---
  useEffect(() => {
    // FCM Setup disabled to prevent console noise until ready for full integration
  }, []);

  // --- INVOICE STATE (Shared between Orders & CRM) ---
  const [isInvoiceCreatorOpen, setIsInvoiceCreatorOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [invoiceInitialCustomer, setInvoiceInitialCustomer] = useState(null);

  // --- VIEW ORDER STATE ---
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState(null);

  // --- HANDLERS: INVOICE COORDINATION ---
  const openCreateInvoice = (initialCustomer = null) => {
    setEditingOrder(null);
    setInvoiceInitialCustomer(initialCustomer);
    setIsInvoiceCreatorOpen(true);
  };

  const openEditInvoice = (order) => {
    setEditingOrder(order);
    setInvoiceInitialCustomer(null);
    setIsInvoiceCreatorOpen(true);
  };

  const onViewOrder = (order) => {
    setViewInvoiceOrder(order);
  };

  // --- NAVIGATION ---
  const sideMenu = [
    { id: 'orders', icon: Package, label: 'Order Management' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'products', icon: Edit, label: 'Our Products' },
    { id: 'logistics', icon: Truck, label: 'Delivery & Logistics' },
    { id: 'partnerships', icon: Users, label: 'Partnerships' },
    { id: 'reviews', icon: MessageSquare, label: 'Shop Reviews' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'analytics', icon: BarChart3, label: 'Market Insights' },
    { id: 'wishlists', icon: Heart, label: 'Customer Interests' }
  ];

  const switchTab = (tabId) => {
    setAdminTab(tabId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden relative">

      {/* GLOBAL MODALS */}
      <InvoiceModal
        isOpen={!!viewInvoiceOrder}
        onClose={() => setViewInvoiceOrder(null)}
        order={viewInvoiceOrder}
        siteContent={siteContent}
      />

      <InvoiceCreator
        isOpen={isInvoiceCreatorOpen}
        onClose={() => setIsInvoiceCreatorOpen(false)}
        editingOrder={editingOrder}
        initialCustomer={invoiceInitialCustomer}
        customers={customers}
      />

      {/* MOBILE: HEADER */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white/80 z-[150] border-b border-gray-100 px-6 py-5 flex justify-between items-center shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-black/5" style={{ backgroundColor: siteContent.primaryColor }}>
            A
          </div>
          <span className="font-black text-gray-900 tracking-tight text-lg">Admin Hub</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 bg-gray-50 text-gray-900 rounded-[20px] active:scale-95 transition-all border border-gray-100 shadow-sm"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE: OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[210] md:hidden backdrop-blur-md"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[220] w-[85%] max-w-[320px] bg-white flex flex-col shadow-[40px_0_80px_rgba(0,0,0,0.15)] md:shadow-none
        transform transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:translate-x-0 md:w-80 md:opacity-100
        ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[18px] flex items-center justify-center text-white font-black text-xl shadow-xl" style={{ backgroundColor: siteContent.primaryColor }}>
              A
            </div>
            <div>
              <h1 className="font-black text-gray-900 leading-tight">Admin Center</h1>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[2px]">Shop Management</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-300 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
          {sideMenu.map(item => {
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => switchTab(item.id)}
                className={`
                   w-full flex items-center justify-between px-6 py-4 rounded-[22px] transition-all duration-300 group
                   ${isActive
                    ? 'bg-gray-900 text-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] translate-x-2'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={22} className={isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-600'} />
                  <span className="font-bold text-base">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={18} className="text-gray-600" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 bg-gray-50/50">
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-red-600 bg-red-50 rounded-[22px] hover:bg-red-100 transition-all font-black text-sm uppercase tracking-widest shadow-sm"
          >
            <LogOut size={20} />
            Secure Exit
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50 w-full pt-20 md:pt-0">
        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-10 pb-32">

          {adminTab === 'orders' && (
            <AdminOrders
              orders={orders}
              onCreateInvoice={() => openCreateInvoice(null)}
              onEditInvoice={openEditInvoice}
              onViewOrder={onViewOrder}
            />
          )}

          {adminTab === 'customers' && (
            <AdminCRM
              customers={customers}
              orders={orders}
              onCreateInvoice={openCreateInvoice} // Passes the function that accepts 'customer' argument
            />
          )}

          {adminTab === 'products' && (
            <AdminProducts
              products={products}
              gallery={gallery}
              feedbacks={feedbacks}
              siteContent={siteContent}
            />
          )}

          {adminTab === 'reviews' && (
            <AdminReviews products={products} />
          )}

          {adminTab === 'partnerships' && (
            <AdminPartnerships siteContent={siteContent} />
          )}

          {adminTab === 'logistics' && (
            <AdminSettings
              siteContent={siteContent}
              setSiteContent={setSiteContent}
              onlyLogistics={true}
            />
          )}

          {adminTab === 'settings' && (
            <AdminSettings
              siteContent={siteContent}
              setSiteContent={setSiteContent}
            />
          )}

          {adminTab === 'wishlists' && (
            <AdminWishlists products={products} />
          )}

          {adminTab === 'analytics' && (
            <AdminAnalytics products={products} orders={orders} />
          )}

        </div>
      </main>
    </div>
  );
}