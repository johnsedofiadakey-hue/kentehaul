import React, { useState, useEffect } from 'react';
import { Heart, Activity, TrendingUp, Clock, User, ShoppingBag } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';

export default function AdminWishlists({ products }) {
    const [wishlists, setWishlists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        totalWishlists: 0,
        mostDesired: [],
        recentActivity: []
    });

    useEffect(() => {
        const q = query(collection(db, "wishlists"), orderBy("updatedAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWishlists(list);
            calculateAnalytics(list);
            setLoading(false);
        });
        return () => unsub();
    }, [products]);

    const calculateAnalytics = (data) => {
        const itemCounts = {};
        data.forEach(wl => {
            (wl.itemIds || []).forEach(id => {
                itemCounts[id] = (itemCounts[id] || 0) + 1;
            });
        });

        const sorted = Object.entries(itemCounts)
            .map(([id, count]) => {
                const product = products.find(p => p.id === id);
                return { id, count, name: product?.name || 'Unknown Product', price: product?.price, image: product?.image };
            })
            .sort((a, b) => b.count - a.count);

        setAnalytics({
            totalActiveWishlists: data.length,
            mostDesired: sorted.slice(0, 10),
            recentActivity: data.slice(0, 15)
        });
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">CUSTOMER INTERESTS</h1>
                    <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mt-1">Real-time Wishlist Intelligence</p>
                </div>
                <div className="bg-amber-50 px-6 py-4 rounded-[24px] border border-amber-100 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                        <Heart size={24} fill="currentColor" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Active Wishlists</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{analytics.totalActiveWishlists}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Most Desired Products */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <TrendingUp className="text-amber-500" />
                            <h2 className="font-black text-xl uppercase tracking-tight">Most Desired Heritage</h2>
                        </div>
                        <div className="space-y-4">
                            {analytics.mostDesired.map((item, idx) => (
                                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-3xl transition-all group">
                                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                        <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-gray-900 uppercase text-sm line-clamp-1">{item.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400">₵{item.price?.toLocaleString()} • ID: {item.id.slice(0,8)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-gray-900">{item.count}</p>
                                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Hearts</p>
                                    </div>
                                </div>
                            ))}
                            {analytics.mostDesired.length === 0 && (
                                <p className="text-center py-10 text-gray-400 italic">No wishlist data yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <Activity className="text-blue-500" />
                            <h2 className="font-black text-xl uppercase tracking-tight">Recent Saves</h2>
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-6 before:top-4 before:bottom-0 before:w-0.5 before:bg-gray-50">
                            {analytics.recentActivity.map((wl) => (
                                <div key={wl.id} className="relative pl-12">
                                    <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white z-10" />
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={10} /> {new Date(wl.updatedAt?.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <div className="mt-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-[11px] font-bold text-gray-600">
                                                Client <span className="text-gray-900">...{wl.id.slice(-6)}</span> saved <span className="text-gray-900 font-black">{wl.itemIds?.length || 0} items</span>
                                            </p>
                                            <div className="flex -space-x-2 mt-3 overflow-hidden">
                                                {(wl.items || []).slice(0, 5).map((item, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm">
                                                        <img src={item.image} alt="" className="w-full h-full object-cover" title={item.name} />
                                                    </div>
                                                ))}
                                                {(wl.items || []).length > 5 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-400">
                                                        +{(wl.items || []).length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
