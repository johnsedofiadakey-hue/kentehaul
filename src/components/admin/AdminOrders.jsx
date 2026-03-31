import React, { useState } from 'react';
import { Package, Plus, DollarSign, CreditCard, Edit, Printer, ChevronDown, TrendingUp, Clock, Truck, MapPin, User, X, Check, ExternalLink, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { ORDER_STATUSES } from '../../data/constants';

export default function AdminOrders({
    orders,
    onCreateInvoice,
    onEditInvoice,
    onViewOrder
}) {
    const [orderSearch, setOrderSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);
    const [assigningRiderOrder, setAssigningRiderOrder] = useState(null);
    const [riderForm, setRiderForm] = useState({ name: '', phone: '', vehicle: 'Motorbike', plate: '', company: '' });

    const filteredOrdersList = orders
        .filter(o =>
            (statusFilter === 'all' || o.status === statusFilter) &&
            (o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
            (o.customer?.name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
            (o.customer?.phone || '').includes(orderSearch))
        )
        .sort((a, b) => {
            if (b.createdAt && a.createdAt) return b.createdAt - a.createdAt;
            if (b.date && a.date) return new Date(b.date) - new Date(a.date);
            return b.id > a.id ? 1 : -1;
        });

    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        } catch (e) {
            alert("Could not update status.");
        }
        setUpdatingId(null);
    };

    const revenue = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const paidRevenue = orders.filter(o => ['Payment Confirmed', 'Preparing Order', 'Quality Check', 'Delivered', 'Rider Assigned', 'Out for Delivery'].includes(o.status)).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'Order Placed').length;
    const todayOrders = orders.filter(o => o.date === new Date().toLocaleDateString()).length;

    const handleAssignRider = async (e) => {
        e.preventDefault();
        if (!assigningRiderOrder) return;
        setUpdatingId(assigningRiderOrder.id);
        try {
            await updateDoc(doc(db, "orders", assigningRiderOrder.id), { 
                rider: riderForm,
                status: 'Rider Assigned'
            });
            setAssigningRiderOrder(null);
            setRiderForm({ name: '', phone: '', vehicle: 'Motorbike', plate: '', company: '' });
        } catch (e) {
            alert("Could not assign rider.");
        }
        setUpdatingId(null);
    };

    const statusColors = {
        'Order Placed': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'Payment Confirmed': 'bg-blue-50 text-blue-700 border-blue-200',
        'Preparing Order': 'bg-amber-50 text-amber-700 border-amber-200',
        'Quality Check': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Rider Assigned': 'bg-purple-50 text-purple-700 border-purple-200',
        'Out for Delivery': 'bg-orange-50 text-orange-700 border-orange-200',
        'Delivered': 'bg-green-50 text-green-700 border-green-200',
        'Cancelled': 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Sales & Orders</h2>
                    <p className="text-gray-500 font-medium mt-1">Real-time revenue tracking and order management.</p>
                </div>
                <button
                    onClick={onCreateInvoice}
                    className="bg-blue-600 text-white px-8 py-4 rounded-[22px] font-black flex items-center gap-3 shadow-2xl hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all text-sm uppercase tracking-widest"
                >
                    <Plus size={22} /> Create Invoice
                </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-gray-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl text-white">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <DollarSign size={14} className="text-green-400" /> Revenue
                    </p>
                    <p className="text-2xl md:text-4xl font-black">₵{revenue.toLocaleString()}</p>
                    <p className="text-green-400 text-xs mt-1 font-bold">₵{paidRevenue.toLocaleString()} confirmed</p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border shadow-sm">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Package size={14} className="text-blue-500" /> Total Orders
                    </p>
                    <p className="text-2xl md:text-4xl font-black text-gray-800">{orders.length}</p>
                    <p className="text-blue-500 text-xs mt-1 font-bold">{todayOrders} today</p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border shadow-sm">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Clock size={14} className="text-yellow-500" /> New Orders
                    </p>
                    <p className="text-2xl md:text-4xl font-black text-yellow-600">{pendingCount}</p>
                    <p className="text-yellow-500 text-xs mt-1 font-bold">Needs attention</p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border shadow-sm">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-green-500" /> Avg Order
                    </p>
                    <p className="text-2xl md:text-4xl font-black text-gray-800">
                        ₵{orders.length ? Math.round(revenue / orders.length).toLocaleString() : 0}
                    </p>
                    <p className="text-green-500 text-xs mt-1 font-bold">per transaction</p>
                </div>
            </div>

            {/* SEARCH + STATUS FILTER */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Search by Order ID, name, or phone..."
                    className="flex-1 p-4 border rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="p-4 border rounded-2xl bg-white shadow-sm font-bold appearance-none outline-none sm:w-48"
                >
                    <option value="all">All Statuses</option>
                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* ORDERS LIST */}
            <div className="space-y-4">
                {filteredOrdersList.length === 0 ? (
                    <div className="text-center py-16 bg-gray-100/50 rounded-[40px] border-2 border-dashed border-gray-200 font-black text-gray-300 italic">
                        No orders found.
                    </div>
                ) : (
                    filteredOrdersList.map(order => (
                        <div key={order.id} className="border border-gray-100 p-5 md:p-8 rounded-[32px] md:rounded-[40px] bg-white shadow-sm hover:shadow-xl transition-all duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                                <div className="flex items-start gap-4">
                                    <div className={`h-12 w-12 md:h-16 md:w-16 rounded-[20px] md:rounded-[24px] flex-shrink-0 flex items-center justify-center text-white shadow-lg ${['Delivered'].includes(order.status) ? 'bg-green-500' : order.status === 'Cancelled' ? 'bg-gray-300' : 'bg-amber-400'}`}>
                                        <Package size={22} />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="font-black text-lg md:text-2xl text-gray-900 tracking-tight font-mono">#{order.id}</span>
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${statusColors[order.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-black text-gray-700">{order.customer?.name || "Anonymous"}</p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                            <p className="text-xs text-gray-400 capitalize flex items-center gap-1.5"><Truck size={12} /> {order.deliveryMethod?.replace('_', ' ') || 'Standard'}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1.5"><MapPin size={12} /> {order.shippingRegion}</p>
                                            <p className="text-xs text-gray-400">{order.date} · {order.method}</p>
                                        </div>
                                        {order.rider && (
                                            <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-100 inline-flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Rider: {order.rider.name} ({order.rider.phone})</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto pl-16 md:pl-0">
                                    <div className="text-left sm:text-right">
                                        <p className="font-black text-2xl md:text-3xl text-green-600 leading-none">₵{Number(order.total).toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{order.items?.length || 0} items</p>
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={order.status}
                                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                                            disabled={updatingId === order.id}
                                            className="appearance-none pl-4 pr-8 py-3 rounded-2xl text-sm font-black border border-gray-200 bg-gray-50 outline-none cursor-pointer hover:bg-gray-100 transition-all disabled:opacity-50"
                                        >
                                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>

                                    <div className="flex gap-2">
                                        {order.deliveryMethod === 'seller_rider' && !order.rider && (
                                            <button 
                                                onClick={() => setAssigningRiderOrder(order)}
                                                className="flex items-center gap-2 font-black text-amber-600 bg-amber-50 px-5 py-3 rounded-2xl hover:bg-amber-100 transition-all text-sm"
                                            >
                                                <Truck size={16} /> Assign Rider
                                            </button>
                                        )}
                                        <button onClick={() => onEditInvoice(order)} className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-900 hover:text-white transition-all" title="Edit Order">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => onViewOrder(order)} className="flex items-center gap-2 font-black text-blue-600 bg-blue-50 px-5 py-3 rounded-2xl hover:bg-blue-100 transition-all text-sm" title="View Invoice">
                                            <Printer size={16} /> Invoice
                                        </button>
                                        <a 
                                            href={`/track/${order.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-900 hover:text-white transition-all"
                                            title="View Public Tracking"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* RIDER ASSIGNMENT MODAL */}
            <AnimatePresence>
                {assigningRiderOrder && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setAssigningRiderOrder(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-amber-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 leading-tight">Assign Delivery Rider</h3>
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">Order #{assigningRiderOrder.id}</p>
                                </div>
                                <button onClick={() => setAssigningRiderOrder(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAssignRider} className="p-8 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rider Name *</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                required
                                                type="text"
                                                placeholder="e.g. Samuel Okyere"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:border-amber-400 outline-none transition font-bold text-sm"
                                                value={riderForm.name}
                                                onChange={e => setRiderForm({...riderForm, name: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rider Phone *</label>
                                        <div className="relative">
                                            <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                required
                                                type="tel"
                                                placeholder="024 XXX XXXX"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:border-amber-400 outline-none transition font-bold text-sm"
                                                value={riderForm.phone}
                                                onChange={e => setRiderForm({...riderForm, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                                        <select 
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:border-amber-400 outline-none transition font-bold text-sm appearance-none"
                                            value={riderForm.vehicle}
                                            onChange={e => setRiderForm({...riderForm, vehicle: e.target.value})}
                                        >
                                            <option value="Motorbike">🏍️ Motorbike</option>
                                            <option value="Bicycle">🚲 Bicycle</option>
                                            <option value="Car">🚗 Car</option>
                                            <option value="Van">🚚 Van</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plate Number</label>
                                        <input 
                                            type="text"
                                            placeholder="e.g. GW 1234-23"
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:border-amber-400 outline-none transition font-bold text-sm"
                                            value={riderForm.plate}
                                            onChange={e => setRiderForm({...riderForm, plate: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dispatch Company (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Glovo, Jumia, or Independent"
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:border-amber-400 outline-none transition font-bold text-sm"
                                        value={riderForm.company}
                                        onChange={e => setRiderForm({...riderForm, company: e.target.value})}
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={updatingId}
                                    className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-sm uppercase tracking-[3px] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4"
                                >
                                    {updatingId ? "Assigning..." : <><Check size={20} /> Confirm Rider Assignment</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
