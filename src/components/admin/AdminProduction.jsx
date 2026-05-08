import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ShoppingBag, Calendar, ArrowRight, Wrench, Sliders, Info, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from '../../firebase';
import { PRODUCTION_STAGES } from '../../data/constants';

export default function AdminProduction({ orders, products, siteContent }) {
    const [productionOrders, setProductionOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [notifyingId, setNotifyingId] = useState(null);

    const notifyClient = async (order) => {
        if (notifyingId) return;
        setNotifyingId(order.id);

        const safetyTimer = setTimeout(() => {
            console.warn("[PRODUCTION] Notification safety timeout.");
            setNotifyingId(null);
        }, 15000);

        try {
            const { stageInfo, customer, id, completionDate } = order;
            const trackingUrl = `${window.location.origin}/track/${id}`;
            
            // 1. Prepare Placeholders
            const placeholders = {
                '[customerName]': customer?.name || 'Valued Client',
                '[orderId]': id,
                '[stage]': stageInfo.label,
                '[stageDescription]': stageInfo.progress === 100 ? "Your order is ready for delivery." : "We are carefully crafting your items.",
                '[completionDate]': completionDate.toLocaleDateString(),
                '[trackingUrl]': trackingUrl
            };

            const replaceAll = (text, mapping) => {
                let res = text || '';
                Object.entries(mapping).forEach(([k, v]) => {
                    res = res.split(k).join(v);
                });
                return res;
            };

            // 2. Trigger Email (if email exists)
            if (customer?.email) {
                try {
                    const subject = replaceAll(siteContent?.productionUpdateEmailSubject, placeholders);
                    const body = replaceAll(siteContent?.productionUpdateEmailBody, placeholders);
                    
                    await addDoc(collection(db, "mail"), {
                        to: customer.email,
                        message: {
                            subject: subject,
                            html: `<div style="font-family: sans-serif; white-space: pre-wrap; line-height: 1.6;">${body}</div>`
                        },
                        createdAt: serverTimestamp()
                    });
                } catch (e) {
                    console.warn("Email queuing failed:", e);
                }
            }

            // 3. Open WhatsApp
            const waMsg = replaceAll(siteContent?.productionUpdateWhatsAppMsg, placeholders);
            const waPhone = (customer?.phone || '').replace(/[^0-9]/g, '');
            if (waPhone) {
                window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`, '_blank');
            } else {
                alert("Customer phone number missing for WhatsApp.");
            }
        } catch (err) {
            console.error("Notify Client Error:", err);
            alert("Notification failed to trigger.");
        } finally {
            clearTimeout(safetyTimer);
            setNotifyingId(null);
        }
    };

    const updateProductionStatus = async (orderId, stageId) => {
        if (updatingId) return;
        setUpdatingId(orderId);

        const safetyTimer = setTimeout(() => {
            console.warn("[PRODUCTION] Update safety timeout.");
            setUpdatingId(null);
        }, 15000);

        try {
            const stage = PRODUCTION_STAGES.find(s => s.id === stageId);
            await updateDoc(doc(db, "orders", orderId), { 
                productionStage: stageId,
                status: stageId === 'finished' ? 'Ready for Delivery' : 'Under Production'
            });
        } catch (e) {
            console.error("Production Update Error:", e);
            alert("Could not update production stage.");
        } finally {
            clearTimeout(safetyTimer);
            setUpdatingId(null);
        }
    };

    const updateTargetDate = async (orderId, newDate) => {
        setUpdatingId(orderId);
        try {
            await updateDoc(doc(db, "orders", orderId), { 
                targetDate: newDate
            });
        } catch (e) {
            console.error("Schedule Update Error:", e);
            alert("Could not update schedule.");
        }
        setUpdatingId(null);
    };

    useEffect(() => {
        // Filter orders that have preorder items or explicit hasPreorder flag
        const filtered = (orders || []).filter(order => {
            const hasPreorderItems = order.items?.some(it => it.isPreorder);
            const isUnderProduction = ['Under Production', 'Preparing Order', 'Quality Check'].includes(order.status);
            return order.hasPreorder || hasPreorderItems || isUnderProduction;
        }).map(order => {
            // Calculate max lead time for this order
            const leadTimes = order.items?.map(it => it.preorderDays || 14) || [14];
            const maxLeadTime = order.maxLeadTime || Math.max(...leadTimes);
            
            // Calculate completion date: Prioritize manual targetDate
            let completionDate;
            if (order.targetDate) {
                completionDate = new Date(order.targetDate);
            } else {
                const orderDate = new Date(order.date);
                completionDate = new Date(orderDate);
                completionDate.setDate(orderDate.getDate() + maxLeadTime);
            }

            const daysLeft = Math.ceil((completionDate - new Date()) / (1000 * 60 * 60 * 24));
            
            const stageId = order.productionStage || 'placed';
            const stageInfo = PRODUCTION_STAGES.find(s => s.id === stageId) || PRODUCTION_STAGES[0];

            return {
                ...order,
                maxLeadTime,
                completionDate,
                daysLeft,
                isOverdue: daysLeft < 0,
                stageId,
                stageInfo
            };
        }).sort((a, b) => a.daysLeft - b.daysLeft);

        setProductionOrders(filtered);
        setLoading(false);
    }, [orders, products]);

    if (loading) return <div className="p-20 text-center"><div className="animate-spin text-4xl">⌛</div></div>;

    return (
        <div className="space-y-10 animate-fade-in-up">
            <header>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                    <Wrench className="text-amber-600" /> Weaving & Production Schedule
                </h2>
                <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-xs">Managing Production & Lead Times</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* METRICS */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-black">
                        {productionOrders.length}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Active Weaves</p>
                        <p className="text-2xl font-black text-gray-900">Pending Fulfillment</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center text-2xl font-black">
                        {productionOrders.filter(o => o.isOverdue).length}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">High Priority</p>
                        <p className="text-2xl font-black text-gray-900">Overdue Schedules</p>
                    </div>
                </div>

                 <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-green-50 text-green-600 flex items-center justify-center text-2xl font-black">
                        {productionOrders.filter(o => o.daysLeft > 0 && o.daysLeft <= 3).length}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Due Soon</p>
                        <p className="text-2xl font-black text-gray-900">Next 72 Hours</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-400 uppercase font-black text-[10px] tracking-widest border-b">
                            <tr>
                                <th className="p-8">Timeline</th>
                                <th className="p-8">Production Item</th>
                                <th className="p-8">Client</th>
                                <th className="p-8">Progress</th>
                                <th className="p-8 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {productionOrders.map(order => (
                                <tr key={order.id} className="group hover:bg-gray-50/80 transition-all">
                                    <td className="p-8">
                                        <div className="flex flex-col gap-2">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full w-fit ${order.isOverdue ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
                                                {order.isOverdue ? 'Delayed' : `Due in ${order.daysLeft}d`}
                                            </span>
                                            <div className="relative group/date">
                                                <input 
                                                    type="date"
                                                    value={order.targetDate || order.completionDate.toISOString().split('T')[0]}
                                                    onChange={(e) => updateTargetDate(order.id, e.target.value)}
                                                    className="text-[10px] font-bold text-gray-400 bg-transparent border-none outline-none cursor-pointer hover:text-gray-900 transition-colors"
                                                />
                                                <Calendar size={10} className="absolute -left-3.5 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover/date:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <div className="space-y-1">
                                            {order.items.filter(it => it.isPreorder).map((it, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                                        <img src={it.image} className="w-full h-full object-cover" />
                                                    </div>
                                                    <p className="font-black text-gray-800 text-sm">{it.name} <span className="text-gray-400 font-bold">(x{it.quantity})</span></p>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <div className="flex flex-col">
                                            <span className="font-black text-gray-900">{order.customer?.name}</span>
                                            <span className="text-xs text-gray-400 font-medium">#{order.id.toString().slice(-6)}</span>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <div className="w-full max-w-[150px]">
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${order.stageInfo.progress}%` }}
                                                    className={`h-full ${order.isOverdue ? 'bg-red-500' : 'bg-amber-500'}`}
                                                />
                                            </div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                                                {order.stageInfo.label} ({order.stageInfo.progress}%)
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-8 text-right">
                                        <div className="flex flex-col items-end gap-3">
                                            <div className="relative">
                                                <select
                                                    value={order.stageId}
                                                    onChange={(e) => updateProductionStatus(order.id, e.target.value)}
                                                    disabled={updatingId === order.id || notifyingId === order.id}
                                                    className={`appearance-none pl-4 pr-10 py-3 rounded-2xl text-[10px] font-black border border-gray-100 bg-gray-50 outline-none cursor-pointer hover:bg-gray-100 transition-all uppercase tracking-widest disabled:opacity-50 ${updatingId === order.id ? 'animate-pulse' : ''}`}
                                                >
                                                    {PRODUCTION_STAGES.map(s => (
                                                         <option key={s.id} value={s.id}>{s.label}</option>
                                                     ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    {updatingId === order.id ? <Loader2 size={12} className="animate-spin text-gray-400" /> : <Sliders size={12} className="text-gray-400" />}
                                                </div>
                                            </div>

                                            <button 
                                                className={`flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl transition-all hover:bg-blue-100 hover:-translate-y-0.5 active:translate-y-0 shadow-sm disabled:opacity-50`}
                                                onClick={() => notifyClient(order)}
                                                disabled={updatingId === order.id || notifyingId === order.id}
                                            >
                                                {notifyingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
                                                {notifyingId === order.id ? 'Notifying...' : 'Notify Client'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {productionOrders.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                                <Calendar size={48} />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-300 uppercase tracking-[4px]">No Active Production</p>
                                                <p className="text-xs text-gray-400 font-bold mt-2">All pre-orders are currently fulfilled.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
