import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Heart, 
  Eye, 
  ShoppingBag, 
  Activity, 
  Clock, 
  ChevronRight, 
  Users, 
  ArrowUpRight,
  Target
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAnalytics({ products, orders }) {
    const [wishlists, setWishlists] = useState([]);
    const [stats, setStats] = useState({
        totalViews: 0,
        totalHearts: 0,
        totalOrders: orders?.length || 0,
        conversionRate: 0,
        mostViewed: [],
        mostHearted: [],
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all'); // '24h', '7d', '30d', 'all'

    useEffect(() => {
        // Listen to activity log and wishlists
        const unsubWishlists = onSnapshot(collection(db, "wishlists"), (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWishlists(list);
            calculateBI(list);
            setLoading(false);
        });

        return () => unsubWishlists();
    }, [products, orders, timeRange]);

    const calculateBI = (wishlistData) => {
        const heartedCounts = {};
        const viewedCounts = {}; // This would come from a separate 'activity_log' or 'product_views' collection
        
        // Count Hearts (Current state from wishlists)
        wishlistData.forEach(wl => {
            (wl.itemIds || []).forEach(id => {
                heartedCounts[id] = (heartedCounts[id] || 0) + 1;
            });
        });

        const sortedHearts = Object.entries(heartedCounts)
            .map(([id, count]) => {
                const product = products.find(p => p.id === id);
                return { id, count, name: product?.name || 'Unknown', price: product?.price, image: product?.image };
            })
            .sort((a, b) => b.count - a.count);

        // Calculate Stats
        const totalHearts = wishlistData.reduce((sum, wl) => sum + (wl.itemIds?.length || 0), 0);
        
        setStats(prev => ({
            ...prev,
            totalHearts,
            totalOrders: orders?.length || 0,
            mostHearted: sortedHearts.slice(0, 10),
            recentActivity: wishlistData.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0)).slice(0, 10)
        }));
    };

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-2xl ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-green-500 font-black text-xs bg-green-50 px-3 py-1 rounded-full">
                        <ArrowUpRight size={14} /> {trend}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-1">{title}</p>
                <p className="text-3xl font-black text-gray-900">{value}</p>
            </div>
        </div>
    );

    if (loading) return (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Aggregating Heritage Data...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in-up pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Market Intelligence</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[4px] mt-2 flex items-center gap-2">
                        <Target size={14} className="text-amber-500" /> Deciphering Customer Desires
                    </p>
                </div>
                <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl">
                    {['Hottest', 'Rising', 'Potential'].map(tab => (
                        <button key={tab} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'Hottest' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Desires" value={stats.totalHearts} icon={Heart} color="bg-red-500" trend={12} />
                <StatCard title="Total Shoppers" value={wishlists.length} icon={Users} color="bg-blue-500" trend={8} />
                <StatCard title="Sales Volume" value={orders.length} icon={ShoppingBag} color="bg-purple-500" />
                <StatCard title="Interests Logged" value={wishlists.reduce((s,w) => s + (w.itemIds?.length || 0), 0)} icon={BarChart3} color="bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Most Hearted (Leaderboard) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-[50px] shadow-sm border border-gray-50 overflow-hidden">
                        <div className="p-8 md:p-10 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900 uppercase">Most Desired Heritage</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ranking by customer hearts</p>
                                </div>
                            </div>
                            <button className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all">
                                <ChevronRight className="text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stats.mostHearted.map((item, idx) => (
                                    <motion.div 
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-[28px] transition-all group border border-transparent hover:border-gray-100"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-lg">
                                            #{idx + 1}
                                        </div>
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-inner">
                                            <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-gray-900 uppercase text-xs line-clamp-1">{item.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">₵{item.price?.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 text-red-500 font-black">
                                                <Heart size={14} fill="currentColor" />
                                                <span className="text-xl leading-none">{item.count}</span>
                                            </div>
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">Hearts</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            {stats.mostHearted.length === 0 && (
                                <div className="py-20 text-center">
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">No interest data captured yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Real-time Activity Feed */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[50px] shadow-2xl p-8 md:p-10 text-white h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[80px] rounded-full" />
                        <div className="flex items-center gap-3 mb-10">
                            <Activity className="text-amber-500 animate-pulse" />
                            <h3 className="font-black text-xl uppercase tracking-widest">Global Pulse</h3>
                        </div>
                        
                        <div className="space-y-8 relative after:absolute after:left-[19px] after:top-2 after:bottom-0 after:w-[1px] after:bg-gray-800">
                            {stats.recentActivity.map((wl, idx) => (
                                <motion.div 
                                    key={wl.id} 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="relative pl-12"
                                >
                                    <div className="absolute left-3.5 top-1.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-gray-900 z-10" />
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">{wl.updatedAt ? new Date(wl.updatedAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</p>
                                            <span className="text-[8px] font-black text-amber-500/80 px-2 py-0.5 border border-amber-500/30 rounded-full bg-amber-500/5">WISHLIST SYNC</span>
                                        </div>
                                        <div className="p-5 bg-white/5 rounded-[28px] border border-white/5 hover:bg-white/10 transition-colors">
                                            <p className="text-[11px] font-bold text-gray-300 leading-relaxed">
                                                Shopper <span className="text-white font-black">...{wl.id.slice(-6).toUpperCase()}</span> refined their interest list. 
                                                Added <span className="text-amber-500 font-black">{wl.itemIds?.length || 0} pieces</span> to their potential haul.
                                            </p>
                                            <div className="flex -space-x-2 mt-4 overflow-hidden">
                                                {(wl.items || []).slice(0, 4).map((item, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-900 overflow-hidden bg-gray-800 shadow-xl">
                                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                {(wl.items || []).length > 4 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-[8px] font-black text-amber-500">
                                                        +{wl.items.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
