import React, { useState } from 'react';
import { Package, Plus, DollarSign, CreditCard, Edit, Printer, ChevronDown, ChevronUp, TrendingUp, Clock, Truck, MapPin, User, Mail, X, Check, ExternalLink, Smartphone, Trash2, Eye, Zap, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from '../../firebase';
import { ORDER_STATUSES } from '../../data/constants';

const callBookKwik    = httpsCallable(functions, 'bookKwikDelivery');
const callConfirmKwik = httpsCallable(functions, 'confirmKwikDelivery');

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

    // Kwik delivery booking state
    const [kwik, setKwik] = useState({ orderId: null, loading: false, quote: null, confirming: false, result: null, error: null });

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

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "orders", orderId));
        } catch (e) {
            alert("Could not delete order: " + e.message);
        }
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

    const handleKwikGetQuote = async (orderId) => {
        setKwik({ orderId, loading: true, quote: null, confirming: false, result: null, error: null });
        try {
            const res = await callBookKwik({ orderId });
            setKwik(prev => ({ ...prev, loading: false, quote: res.data }));
        } catch (err) {
            setKwik(prev => ({ ...prev, loading: false, error: err.message || "Failed to get quote. Check Settings → Integrations." }));
        }
    };

    const handleKwikConfirm = async () => {
        if (!kwik.quote) return;
        setKwik(prev => ({ ...prev, confirming: true, error: null }));
        try {
            const res = await callConfirmKwik({ orderId: kwik.orderId, quoteId: kwik.quote.quoteId });
            setKwik(prev => ({ ...prev, confirming: false, result: res.data }));
        } catch (err) {
            setKwik(prev => ({ ...prev, confirming: false, error: err.message || "Booking failed. Please try again." }));
        }
    };

    const handleKwikNotifyCustomer = (order, result) => {
        const { customer, id } = order;
        const waPhone = (customer?.phone || '').replace(/[^0-9]/g, '');
        if (!waPhone) return;
        const msg = `Hello ${customer?.name || 'Valued Customer'}, your KenteHaul order #${id} is on its way! 🎉\n\nRider: ${result.riderName}${result.riderPhone ? `\nRider Phone: ${result.riderPhone}` : ''}\nETA: ${result.eta || '30–45 min'}\n\n📦 Track your order:\n${result.trackingUrl}\n\nThank you for shopping with KenteHaul! 🛍️`;
        window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const notifyRiderAssignment = async (order) => {
        const { rider, customer, id } = order;
        if (!rider) return;

        const trackingUrl = `${window.location.origin}/track/${id}`;
        const msg = `Hello ${customer?.name || 'Valued Client'}, your KenteHaul order #${id} has been assigned to a rider!\n\nRider: ${rider.name}\nPhone: ${rider.phone}\nVehicle: ${rider.vehicle} (${rider.plate || 'No Plate'})\n\nTrack here: ${trackingUrl}`;

        const waPhone = (customer?.phone || '').replace(/[^0-9]/g, '');
        if (waPhone) {
            window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            alert("Customer phone number missing.");
        }
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
                                        {order.rider && (
                                            <button 
                                                onClick={() => notifyRiderAssignment(order)}
                                                className="flex items-center gap-2 font-black text-green-600 bg-green-50 px-5 py-3 rounded-2xl hover:bg-green-100 transition-all text-sm"
                                            >
                                                <Smartphone size={16} /> Notify
                                            </button>
                                        )}
                                        <button onClick={() => onEditInvoice(order)} className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-900 hover:text-white transition-all" title="Edit Order">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDeleteOrder(order.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all" title="Delete Order">
                                            <Trash2 size={18} />
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

                            {/* ── EXPANDED ORDER DETAIL ── */}
                            <AnimatePresence>
                                {expandedOrderId === order.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-gray-100 bg-gray-50/60 p-5 md:p-8 grid md:grid-cols-2 gap-6">

                                            {/* LEFT: Items ordered */}
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Items Ordered</p>
                                                <div className="space-y-3">
                                                    {(order.items || []).map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                                                {item.image ? (
                                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                        <Package size={18} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-black text-sm text-gray-900 truncate">{item.name}</p>
                                                                <p className="text-xs text-gray-400">{item.subcategory || item.category || ''}</p>
                                                                {item.isPreorder && (
                                                                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                                                        Pre-order · {item.preorderDays || 14} days
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <p className="font-black text-sm text-gray-800">₵{(item.price * item.quantity).toLocaleString()}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold">×{item.quantity} @ ₵{item.price?.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between items-center pt-2 px-1">
                                                        <span className="text-xs text-gray-500 font-bold">Subtotal</span>
                                                        <span className="font-black text-sm text-gray-700">₵{(order.subtotal || order.total - (order.shippingFee || 0)).toLocaleString()}</span>
                                                    </div>
                                                    {order.shippingFee > 0 && (
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-xs text-gray-500 font-bold">Shipping</span>
                                                            <span className="font-black text-sm text-amber-600">₵{Number(order.shippingFee).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center px-1 pt-1 border-t border-gray-200">
                                                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Total Paid</span>
                                                        <span className="font-black text-base text-green-600">₵{Number(order.total).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT: Customer + Delivery info */}
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Customer Details</p>
                                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                                                        <div className="flex items-center gap-3 p-3">
                                                            <User size={15} className="text-gray-400 flex-shrink-0" />
                                                            <span className="font-black text-sm text-gray-800">{order.customer?.name || '—'}</span>
                                                        </div>
                                                        {order.customer?.phone && (
                                                            <div className="flex items-center gap-3 p-3">
                                                                <Smartphone size={15} className="text-green-500 flex-shrink-0" />
                                                                <a href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" className="font-black text-sm text-green-600 hover:underline">
                                                                    {order.customer.phone}
                                                                </a>
                                                            </div>
                                                        )}
                                                        {order.customer?.email && (
                                                            <div className="flex items-center gap-3 p-3">
                                                                <Mail size={15} className="text-blue-400 flex-shrink-0" />
                                                                <span className="text-sm text-gray-600 font-medium truncate">{order.customer.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Delivery Address</p>
                                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                                                        <div className="flex items-start gap-2">
                                                            <Truck size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm font-black text-gray-700 capitalize">{order.deliveryMethod?.replace(/_/g, ' ') || 'Standard Delivery'} · {order.shippingRegion}</span>
                                                        </div>
                                                        {order.deliveryMethod === 'pickup' ? (
                                                            <div className="flex items-start gap-2">
                                                                <MapPin size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                                <span className="text-sm font-medium text-gray-700">{order.customer?.pickupLocationId || 'Pickup at store'}</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {order.customer?.address && (
                                                                    <div className="flex items-start gap-2">
                                                                        <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                                        <span className="text-sm font-medium text-gray-700">{order.customer.address}</span>
                                                                    </div>
                                                                )}
                                                                {order.customer?.landmark && (
                                                                    <div className="flex items-start gap-2">
                                                                        <MapPin size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                                                        <span className="text-sm font-black text-gray-900 leading-relaxed">{order.customer.landmark}</span>
                                                                    </div>
                                                                )}
                                                                {!order.customer?.address && !order.customer?.landmark && (
                                                                    <p className="text-xs text-red-500 font-bold italic">No address provided</p>
                                                                )}
                                                            </>
                                                        )}
                                                        {/* Customer's own rider details */}
                                                        {order.deliveryMethod === 'customer_rider' && order.customer?.riderName && (
                                                            <div className="mt-2 pt-3 border-t border-gray-100 space-y-1">
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Their Rider</p>
                                                                <p className="text-sm font-black text-gray-800">{order.customer.riderName}</p>
                                                                {order.customer.riderPhone && (
                                                                    <a href={`https://wa.me/${order.customer.riderPhone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 font-bold hover:underline block">
                                                                        {order.customer.riderPhone}
                                                                    </a>
                                                                )}
                                                                {order.customer.riderCompany && <p className="text-xs text-gray-400">{order.customer.riderCompany}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Notes / pre-order info */}
                                                {order.hasPreorder && (
                                                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Pre-order Notice</p>
                                                        <p className="text-sm font-bold text-orange-800">
                                                            This order contains pre-order items. Expected lead time: <strong>{order.maxLeadTime || 14} days</strong>.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Kwik Delivery booking */}
                                                {order.shippingRegion === 'Accra' && order.deliveryMethod === 'seller_rider' && (
                                                    <div>
                                                        {order.delivery?.provider === 'kwik' ? (
                                                            // Already booked — show booking card
                                                            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-2">
                                                                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
                                                                    <Zap size={12} /> Kwik Rider Dispatched
                                                                </p>
                                                                <p className="text-sm font-black text-gray-900">{order.delivery.riderName}</p>
                                                                {order.delivery.riderPhone && (
                                                                    <a href={`https://wa.me/${order.delivery.riderPhone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 font-bold hover:underline block">{order.delivery.riderPhone}</a>
                                                                )}
                                                                {order.delivery.price > 0 && (
                                                                    <p className="text-xs text-violet-700 font-bold">Cost: ₵{order.delivery.price}</p>
                                                                )}
                                                                {order.delivery.trackingUrl && (
                                                                    <a href={order.delivery.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-violet-700 bg-violet-100 px-3 py-1.5 rounded-xl hover:bg-violet-200 transition-colors">
                                                                        <ExternalLink size={12} /> Track on Kwik
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            // Not yet booked — show Book button
                                                            <button
                                                                onClick={() => handleKwikGetQuote(order.id)}
                                                                disabled={kwik.loading && kwik.orderId === order.id}
                                                                className="w-full flex items-center justify-center gap-2 py-4 bg-violet-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-60"
                                                            >
                                                                {kwik.loading && kwik.orderId === order.id ? (
                                                                    <><Loader size={16} className="animate-spin" /> Getting Quote...</>
                                                                ) : (
                                                                    <><Zap size={16} /> Book Rider via Kwik</>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>

            {/* KWIK DELIVERY QUOTE / CONFIRM MODAL */}
            <AnimatePresence>
                {kwik.orderId && (kwik.quote || kwik.result || kwik.error) && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setKwik({ orderId: null, loading: false, quote: null, confirming: false, result: null, error: null })}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-violet-50/60">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 leading-tight flex items-center gap-2">
                                        <Zap size={22} className="text-violet-500" /> Kwik Delivery
                                    </h3>
                                    <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mt-1">Order #{kwik.orderId}</p>
                                </div>
                                <button
                                    onClick={() => setKwik({ orderId: null, loading: false, quote: null, confirming: false, result: null, error: null })}
                                    className="p-2 hover:bg-white rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Error state */}
                                {kwik.error && (
                                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-bold text-red-700">{kwik.error}</p>
                                    </div>
                                )}

                                {/* Quote state */}
                                {kwik.quote && !kwik.result && (
                                    <>
                                        <div className="bg-gray-50 rounded-[24px] p-6 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Cost</span>
                                                <span className="text-3xl font-black text-violet-600">₵{kwik.quote.price}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Est. Arrival</span>
                                                <span className="text-sm font-black text-gray-700">{kwik.quote.eta}</span>
                                            </div>
                                            <div className="pt-4 border-t border-gray-100 space-y-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pickup</p>
                                                <p className="text-xs font-bold text-gray-600">{kwik.quote.pickupAddress}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Dropoff</p>
                                                <p className="text-xs font-bold text-gray-600">{kwik.quote.dropoffAddress}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleKwikConfirm}
                                            disabled={kwik.confirming}
                                            className="w-full py-5 bg-violet-600 text-white rounded-3xl font-black text-sm uppercase tracking-[3px] shadow-2xl hover:bg-violet-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                        >
                                            {kwik.confirming ? (
                                                <><Loader size={20} className="animate-spin" /> Dispatching Rider...</>
                                            ) : (
                                                <><Check size={20} /> Confirm & Dispatch Rider</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setKwik({ orderId: null, loading: false, quote: null, confirming: false, result: null, error: null })}
                                            className="w-full py-3 text-gray-500 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}

                                {/* Success state */}
                                {kwik.result && (
                                    <>
                                        <div className="text-center py-4">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle size={32} className="text-green-500" />
                                            </div>
                                            <p className="text-xl font-black text-gray-900">Rider Dispatched!</p>
                                            <p className="text-sm text-gray-500 font-medium mt-1">Order status updated to Rider Assigned</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-[24px] p-6 space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Rider</span>
                                                <span className="text-sm font-black text-gray-800">{kwik.result.riderName}</span>
                                            </div>
                                            {kwik.result.riderPhone && (
                                                <div className="flex justify-between">
                                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Rider Phone</span>
                                                    <span className="text-sm font-black text-gray-800">{kwik.result.riderPhone}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">ETA</span>
                                                <span className="text-sm font-black text-gray-800">{kwik.result.eta}</span>
                                            </div>
                                            {kwik.result.trackingUrl && (
                                                <a
                                                    href={kwik.result.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 w-full mt-2 py-3 bg-violet-100 text-violet-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-violet-200 transition-colors"
                                                >
                                                    <ExternalLink size={14} /> Open Kwik Tracker
                                                </a>
                                            )}
                                        </div>
                                        {/* Notify customer via WhatsApp */}
                                        {(() => {
                                            const order = orders.find(o => o.id === kwik.orderId);
                                            return order ? (
                                                <button
                                                    onClick={() => handleKwikNotifyCustomer(order, kwik.result)}
                                                    className="w-full py-5 bg-green-600 text-white rounded-3xl font-black text-sm uppercase tracking-[3px] shadow-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                                                >
                                                    <Smartphone size={20} /> WhatsApp Customer
                                                </button>
                                            ) : null;
                                        })()}
                                        <button
                                            onClick={() => setKwik({ orderId: null, loading: false, quote: null, confirming: false, result: null, error: null })}
                                            className="w-full py-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-700 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </>
                                )}

                                {/* Error retry */}
                                {kwik.error && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleKwikGetQuote(kwik.orderId)}
                                            className="flex-1 py-4 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                                        >
                                            Retry
                                        </button>
                                        <button
                                            onClick={() => setKwik({ orderId: null, loading: false, quote: null, confirming: false, result: null, error: null })}
                                            className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
