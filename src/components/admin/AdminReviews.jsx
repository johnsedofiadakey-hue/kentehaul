import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Star, Trash2, Search, Filter, MessageSquare, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminReviews({ products }) {
    const [reviews, setReviews] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleApprove = async (id) => {
        try {
            await updateDoc(doc(db, "reviews", id), { status: 'approved' });
        } catch (err) {
            console.error("Error approving review:", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this review? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "reviews", id));
            } catch (err) {
                console.error("Error deleting review:", err);
            }
        }
    };

    const getProductName = (id) => {
        return products.find(p => p.id === id)?.name || "Unknown Product";
    };

    const filteredReviews = reviews.filter(rev =>
        rev.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rev.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getProductName(rev.productId).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Customer Reviews</h2>
                    <p className="text-gray-400 font-bold text-sm tracking-widest uppercase">Admin Moderated Feedback</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search reviews..."
                        className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Accessing Scrolls...</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence mode='popLayout'>
                        {filteredReviews.map((rev) => (
                            <motion.div
                                key={rev.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-white p-6 rounded-[24px] border shadow-sm hover:shadow-md transition-all group ${rev.status === 'approved' ? 'border-gray-100' : 'border-amber-200 bg-amber-50/10'}`}
                            >
                                <div className="flex flex-col md:flex-row gap-6 md:items-start">
                                    {/* Left: Product Info */}
                                    <div className="md:w-48 flex-shrink-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package size={14} className="text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</span>
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm line-clamp-2">{getProductName(rev.productId)}</p>

                                        {rev.status !== 'approved' && (
                                            <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-tighter rounded-full border border-amber-200">
                                                <Star size={10} className="animate-pulse" /> Pending Approval
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle: Content */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-black text-blue-500 text-xs shadow-inner">
                                                    {rev.customerName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-sm">{rev.customerName}</p>
                                                    <div className="flex text-amber-400 gap-0.5 mt-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={10} fill={i < rev.rating ? 'currentColor' : 'none'} className={i < rev.rating ? '' : 'text-gray-100'} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-300 italic">
                                                {rev.createdAt?.toDate().toLocaleDateString() || "Recently"}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-50 relative">
                                            <MessageSquare className="absolute -top-2 -left-2 text-gray-100" size={20} />
                                            <p className="text-sm text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex md:flex-col justify-end gap-2">
                                        {rev.status !== 'approved' && (
                                            <button
                                                onClick={() => handleApprove(rev.id)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-lg shadow-green-200"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(rev.id)}
                                            className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all transform active:scale-95"
                                            title="Delete Review"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredReviews.length === 0 && (
                        <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No correspondence matching your search</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
