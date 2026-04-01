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
  Target,
  Smartphone,
  Monitor
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

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 flex flex-col justify-between hover:shadow-md transition-all font-sans">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-4 rounded-2xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-green-500 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                    <TrendingUp size={12} />
                    <span className="text-[10px] font-black">{trend}%</span>
                </div>
            )}
        </div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{title}</p>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{Number(value || 0).toLocaleString()}</p>
        </div>
    </div>
);

export default function AdminAnalytics({ products, orders }) {
    const [wishlists, setWishlists] = useState([]);
    const [activity, setActivity] = useState([]);
    const [stats, setStats] = useState({
        totalViews: 0,
        totalVisits: 0,
        totalHearts: 0,
        totalOrders: orders?.length || 0,
        potentialRevenue: 0,
        deviceStats: { 'iOS': 0, 'Android': 0, 'Desktop': 0 },
        trafficSources: [],
        mostViewed: [],
        mostHearted: [],
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [leaderboardTab, setLeaderboardTab] = useState('hearted'); 
    const [activeTab, setActiveTab] = useState('Hottest');

    useEffect(() => {
        let unsubActivity;
        let unsubWishlists;

        const setupListeners = () => {
            unsubActivity = onSnapshot(collection(db, "activity_log"), (snap) => {
                const activityList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setActivity(activityList);
                setWishlists(prevW => {
                    calculateBI(prevW, activityList);
                    return prevW;
                });
            });

            unsubWishlists = onSnapshot(collection(db, "wishlists"), (snap) => {
                const wishlistList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setWishlists(wishlistList);
                setActivity(prevA => {
                    calculateBI(wishlistList, prevA);
                    return prevA;
                });
                setLoading(false);
            });
        };

        setupListeners();
        return () => {
            if (unsubActivity) unsubActivity();
            if (unsubWishlists) unsubWishlists();
        };
    }, [products, orders]);

    const calculateBI = (wishlistData, activityData) => {
        const heartedCounts = {};
        const viewedCounts = {};
        const deviceCounts = { 'iOS': 0, 'Android': 0, 'Desktop': 0 };
        const referrerCounts = {};
        
        // Count Hearts (Current state from wishlists)
        let potentialRev = 0;
        wishlistData.forEach(wl => {
            (wl.itemIds || []).forEach(id => {
                heartedCounts[id] = (heartedCounts[id] || 0) + 1;
                const p = products.find(prod => prod.id === id);
                if (p) potentialRev += (p.price || 0);
            });
        });

        // Parse activity logs
        activityData.forEach(log => {
            if (log.type === 'view_item' && log.productId) {
                viewedCounts[log.productId] = (viewedCounts[log.productId] || 0) + 1;
            }
            if (log.type === 'site_visit') {
                if (log.device) deviceCounts[log.device] = (deviceCounts[log.device] || 0) + 1;
                const ref = log.referrer || 'Direct';
                const source = ref.includes('instagram.com') ? 'Instagram' 
                             : ref.includes('facebook.com') ? 'Facebook' 
                             : ref.includes('google.com') ? 'Google' 
                             : ref === 'Direct' ? 'Direct/Search' : 'Other';
                referrerCounts[source] = (referrerCounts[source] || 0) + 1;
            }
        });

        const sortedHearts = Object.entries(heartedCounts)
            .map(([id, count]) => {
                const product = products.find(p => p.id === id);
                return { id, count, name: product?.name || 'Unknown', price: product?.price, image: product?.image };
            })
            .sort((a, b) => b.count - a.count);

        const sortedViews = Object.entries(viewedCounts)
            .map(([id, count]) => {
                const product = products.find(p => p.id === id);
                return { id, count, name: product?.name || 'Unknown', price: product?.price, image: product?.image };
            })
            .sort((a, b) => b.count - a.count);

        // --- CALCULATE RISING (Last 7 Days) ---
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const risingCounts = {};
        activityData.forEach(log => {
            const logTime = log.timestamp?.toMillis() || 0;
            if (logTime > sevenDaysAgo && log.type === 'view_item' && log.productId) {
                risingCounts[log.productId] = (risingCounts[log.productId] || 0) + 1;
            }
        });
        const sortedRising = Object.entries(risingCounts)
             .map(([id, count]) => {
                const product = products.find(p => p.id === id);
                return { id, count, name: product?.name || 'Unknown', price: product?.price, image: product?.image };
             })
             .sort((a, b) => b.count - a.count);

        // --- CALCULATE POTENTIAL (High Hearts, No orders) ---
        const orderedProductIds = new Set();
        orders.forEach(o => {
            (o.items || []).forEach(item => {
                if (item.id) orderedProductIds.add(item.id);
            });
        });

        const sortedPotential = sortedHearts
            .filter(item => !orderedProductIds.has(item.id))
            .slice(0, 10);

        // --- CALC DAILY HISTORY ---
        const dailyLogs = {};
        activityData.forEach(log => {
            const dateStr = log.timestamp ? new Date(log.timestamp.toMillis()).toLocaleDateString() : 'Unknown';
            if (!dailyLogs[dateStr]) dailyLogs[dateStr] = { visits: 0, views: 0, hearts: 0, orders: 0 };
            if (log.type === 'site_visit') dailyLogs[dateStr].visits++;
            if (log.type === 'view_item') dailyLogs[dateStr].views++;
        });
        
        // Add orders to daily history
        orders.forEach(o => {
            const dateStr = o.date || 'Unknown';
            if (!dailyLogs[dateStr]) dailyLogs[dateStr] = { visits: 0, views: 0, hearts: 0, orders: 0 };
            dailyLogs[dateStr].orders++;
        });

        const historyList = Object.entries(dailyLogs)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        setStats(prev => ({
            ...prev,
            totalViews: activityData.filter(a => a.type === 'view_item').length,
            totalVisits: activityData.filter(a => a.type === 'site_visit').length,
            totalHearts: wishlistData.reduce((sum, wl) => sum + (wl.itemIds?.length || 0), 0),
            totalOrders: orders?.length || 0,
            potentialRevenue: potentialRev,
            deviceStats: deviceCounts,
            trafficSources: Object.entries(referrerCounts).map(([name, count]) => ({ name, count })),
            mostHearted: sortedHearts.slice(0, 10),
            mostViewed: sortedViews.slice(0, 10),
            mostRising: sortedRising.slice(0, 10),
            mostPotential: sortedPotential,
            history: historyList.slice(0, 30),
            recentActivity: wishlistData.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0)).slice(0, 10)
        }));
    };

    if (loading) return (
        <div className="flex flex-col h-[60vh] items-center justify-center space-y-4 animate-pulse">
            <div className="w-16 h-16 border-4 border-gray-100 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-[4px]">Aggregating Heritage Data...</p>
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
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === activeTab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Impressions" value={stats.totalViews} icon={Eye} color="bg-blue-500" trend={15} />
                <StatCard title="Active Desires" value={stats.totalHearts} icon={Heart} color="bg-red-500" trend={12} />
                <StatCard title="Confirmed Orders" value={stats.totalOrders} icon={ShoppingBag} color="bg-purple-500" />
                <StatCard title="Potential Revenue" value={`₵${stats.potentialRevenue.toLocaleString()}`} icon={BarChart3} color="bg-amber-500" />
            </div>

            {/* Market Insights & Visitor Intel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Conversion Funnel */}
                <div className="bg-white rounded-[50px] shadow-sm border border-gray-50 p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            <Target size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-gray-900 uppercase">Conversion Pipeline</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">From discovery to ownership</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-2">
                        {[
                            { label: 'Discovery', sub: 'Total Views', value: stats.totalViews, color: 'bg-blue-500', width: 'w-full' },
                            { label: 'Interest', sub: 'Added to Wishlist', value: stats.totalHearts, color: 'bg-red-500', width: 'w-[75%]' },
                            { label: 'Conversion', sub: 'Completed Orders', value: stats.totalOrders, color: 'bg-purple-500', width: 'w-[50%]' }
                        ].map((step, i) => (
                            <React.Fragment key={step.label}>
                                <div className="flex-1 w-full flex flex-col items-center">
                                    <div className={`${step.color} ${step.width} h-24 md:h-32 rounded-[32px] flex flex-col items-center justify-center text-white shadow-xl transform hover:scale-105 transition-transform cursor-default p-4 text-center`}>
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{step.label}</p>
                                        <p className="text-2xl md:text-3xl font-black">{step.value}</p>
                                        <p className="text-[10px] font-bold opacity-60 mt-1">{step.sub}</p>
                                    </div>
                                </div>
                                {i < 2 && (
                                    <div className="hidden md:flex items-center text-gray-200">
                                        <ChevronRight size={24} strokeWidth={3} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Visitor Intelligence */}
                <div className="bg-white rounded-[50px] shadow-sm border border-gray-50 p-8 md:p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-gray-900 uppercase">Visitor Intelligence</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Platform and device analytics</p>
                            </div>
                        </div>
                        <div className="text-right px-6 py-2 bg-gray-50 rounded-2xl">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Sessions</p>
                            <p className="text-2xl font-black text-gray-900">{stats.totalVisits}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Device Types */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Device Types</p>
                            <div className="space-y-3">
                                {[
                                    { label: 'iOS (iPhone/iPad)', count: stats.deviceStats['iOS'], color: 'bg-indigo-500', icon: Smartphone },
                                    { label: 'Android Phone', count: stats.deviceStats['Android'], color: 'bg-green-500', icon: Smartphone },
                                    { label: 'Desktop / PC', count: stats.deviceStats['Desktop'], color: 'bg-blue-500', icon: Monitor }
                                ].map(device => (
                                    <div key={device.label} className="group">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <device.icon size={12} className="text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-600">{device.label}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-900">{device.count}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(device.count / (stats.totalVisits || 1)) * 100}%` }}
                                                className={`h-full ${device.color}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Referrers */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Traffic Origins</p>
                            <div className="space-y-3 px-4 py-4 bg-gray-50 rounded-[32px]">
                                {stats.trafficSources.length > 0 ? stats.trafficSources.map(source => (
                                    <div key={source.name} className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-500 uppercase">{source.name}</span>
                                        <span className="text-[10px] font-black text-gray-900 bg-white px-2 py-1 rounded-lg border border-gray-100">{source.count}</span>
                                    </div>
                                )) : (
                                    <p className="text-[10px] font-bold text-gray-300 italic text-center py-4">Gathering data...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
                                    <h3 className="font-black text-xl text-gray-900 uppercase">
                                        {activeTab === 'Hottest' ? 'Product Power Ranking' : activeTab === 'Rising' ? '7-Day Rising Stars' : 'High Potential (No Orders)'}
                                    </h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                        {activeTab === 'Hottest' 
                                            ? (leaderboardTab === 'hearted' ? 'Ranking by customer hearts' : 'Ranking by total page views')
                                            : activeTab === 'Rising' ? 'Products gaining the most momentum this week'
                                            : 'Items people want (hearts) but haven\'t purchased yet'
                                        }
                                    </p>
                                </div>
                            </div>
                            {activeTab === 'Hottest' && (
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setLeaderboardTab('hearted')}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${leaderboardTab === 'hearted' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Most Desired
                                    </button>
                                    <button 
                                        onClick={() => setLeaderboardTab('viewed')}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${leaderboardTab === 'viewed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Most Viewed
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(
                                    activeTab === 'Hottest' 
                                        ? (leaderboardTab === 'hearted' ? stats.mostHearted : stats.mostViewed)
                                        : activeTab === 'Rising' ? stats.mostRising
                                        : stats.mostPotential
                                ).map((item, idx) => (
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
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-inner text-amber-900/10 flex items-center justify-center">
                                            {item.image ? (
                                                <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <ShoppingBag size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-gray-900 uppercase text-xs line-clamp-1">{item.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">₵{(Number(item.price) || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className={`flex items-center gap-1.5 font-black ${leaderboardTab === 'hearted' || activeTab === 'Potential' ? 'text-red-500' : 'text-blue-500'}`}>
                                                {leaderboardTab === 'hearted' || activeTab === 'Potential' ? <Heart size={14} fill="currentColor" /> : <Eye size={14} />}
                                                <span className="text-xl leading-none">{item.count}</span>
                                            </div>
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">
                                                {leaderboardTab === 'hearted' || activeTab === 'Potential' ? 'Hearts' : 'Views'}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            {(activeTab === 'Potential' && stats.mostPotential?.length === 0) && (
                                <div className="py-20 text-center">
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">No high-interest products found without orders.</p>
                                </div>
                            )}
                            {(activeTab === 'Hottest' && stats.mostHearted.length === 0) && (
                                <div className="py-20 text-center">
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">No interest data captured yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Historical Activity Register */}
                    <div className="bg-white rounded-[50px] shadow-sm border border-gray-50 overflow-hidden">
                        <div className="p-8 md:p-10 border-b border-gray-50 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-gray-900 uppercase">Growth Register</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Daily collection of visitor intelligence</p>
                            </div>
                        </div>
                        <div className="p-8 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] border-b border-gray-50">
                                        <th className="py-4 px-4 font-black">Date</th>
                                        <th className="py-4 px-4 text-center font-black">Unique Visits</th>
                                        <th className="py-4 px-4 text-center font-black">Product Views</th>
                                        <th className="py-4 px-4 text-center font-black">Sales/Orders</th>
                                        <th className="py-4 px-4 text-right font-black">Growth Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(stats.history || []).map((day, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-5 px-4">
                                                <span className="font-black text-gray-900 text-sm whitespace-nowrap">{day.date}</span>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <span className="font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">{day.visits}</span>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <span className="font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">{day.views}</span>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <span className="font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">{day.orders}</span>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5 text-green-500 font-extrabold text-[10px] uppercase tracking-widest">
                                                    <TrendingUp size={12} /> Positive
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(stats.history?.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <p className="text-gray-300 font-bold uppercase tracking-widest text-xs italic">Historical census in progress...</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
