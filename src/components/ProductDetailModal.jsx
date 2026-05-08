import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Smartphone, BookOpen, Star, ChevronLeft, ChevronRight, Heart, Share2, Check, Minus, Plus, Truck, Shield, RefreshCw, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from './SEO';

export default function ProductDetailModal({
    product,
    onClose,
    addToCart,
    onSingleBuy,
    siteContent,
    allProducts,
    onOpenProduct,
    wishlist = [],
    toggleWishlist
}) {
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [activeTab, setActiveTab] = useState('description');

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [userReview, setUserReview] = useState({ rating: 5, comment: '', name: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when product changes
    useEffect(() => {
        if (product) {
            setQuantity(1);
            setAddedToCart(false);
            setActiveTab('description');
            setUserReview({ rating: 5, comment: '', name: '' });
        }
    }, [product?.id]);

    // Fetch Reviews
    useEffect(() => {
        if (!product?.id) return;
        const q = query(
            collection(db, "reviews"),
            where("productId", "==", product.id),
            where("status", "==", "approved"),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
            setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Review Listener Error:", error);
            // Fallback for missing index: manual filter
            const qBasic = query(collection(db, "reviews"), where("productId", "==", product.id));
            onSnapshot(qBasic, (s) => {
                const list = s.docs.map(d => ({ id: d.id, ...d.data() }))
                    .filter(rev => rev.status === 'approved')
                    .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                setReviews(list);
            });
        });
        return () => unsub();
    }, [product?.id]);

    // Prevent body scroll when modal is open
    // useEffect(() => {
    //     if (product) {
    //         document.body.style.overflow = 'hidden';
    //     } else {
    //         document.body.style.overflow = '';
    //     }
    //     return () => { document.body.style.overflow = ''; };
    // }, [product]);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleAddToCart = () => {
        const availableStock = product.stockQuantity ?? product.stock ?? 0;
        const finalQuantity = Math.min(quantity, availableStock);
        for (let i = 0; i < finalQuantity; i++) addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2500);
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/shop?product=${product.id}`;
        const shareText = `Check out ${product.name} on KenteHaul! ₵${product.price?.toLocaleString()}`;
        
        if (navigator.share) {
            try { 
                await navigator.share({ 
                    title: product.name, 
                    text: shareText,
                    url: shareUrl
                }); 
            } catch (e) { 
                console.warn("Sharing failed:", e);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareText}\n\nView here: ${shareUrl}`);
                alert("Link and description copied to clipboard!");
            } catch (err) {
                console.error("Clipboard copy failed:", err);
            }
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!userReview.comment || !userReview.name) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "reviews"), {
                productId: product.id,
                rating: userReview.rating,
                comment: userReview.comment,
                customerName: userReview.name,
                status: 'pending', // Moderation system
                createdAt: serverTimestamp()
            });
            setUserReview({ rating: 5, comment: '', name: '' });
            alert("Review submitted! It will appear on the site once approved by our team.");
        } catch (err) {
            console.error("Error submitting review:", err);
            alert("Could not submit review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const stockVal = product?.stockQuantity ?? product?.stock ?? 0;
    const stockLabel = stockVal <= 0
        ? { text: 'Out of Stock', color: 'text-red-600 bg-red-50' }
        : stockVal <= 3
            ? { text: `Only ${stockVal} left!`, color: 'text-orange-600 bg-orange-50' }
            : { text: `${stockVal} in stock`, color: 'text-green-600 bg-green-50' };

    return (
        <AnimatePresence>
            {product && product.id && (
                <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none"
                    />

                    {/* SEO for Social Sharing */}
                    <SEO 
                        title={product.name}
                        description={product.description?.slice(0, 160)}
                        ogImage={product.image?.startsWith('http') ? product.image : `${window.location.origin}${product.image}`}
                        ogTitle={`${product.name} - ₵${product.price?.toLocaleString()} | KenteHaul`}
                        ogDescription={product.description?.slice(0, 120) || `Hand-woven authentic ${product.category} from Ghana.`}
                        canonicalPath={`/shop?product=${product.id}`}
                        jsonLd={{
                            "@context": "https://schema.org",
                            "@type": "Product",
                            "name": product.name,
                            "image": product.image,
                            "description": product.description,
                            "sku": product.id,
                            "offers": {
                                "@type": "Offer",
                                "price": product.price,
                                "priceCurrency": "GHS",
                                "availability": (product.stockQuantity > 0 || product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                                "url": typeof window !== 'undefined' ? window.location.href : ""
                            }
                        }}
                    />

                    {/* Modal — bottom sheet on mobile, centered on desktop */}
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-4xl h-[92vh] md:h-[85vh] bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-30 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-full md:w-1/2 bg-gray-50 relative flex-shrink-0">
                            {/* Drag handle on mobile */}
                            <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full z-20" />

                            <div className="aspect-[3/2] md:aspect-auto md:h-full min-h-[220px] md:min-h-0 relative overflow-hidden">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                        <ShoppingBag size={80} />
                                    </div>
                                )}

                                {/* Sold out overlay */}
                                {(product.stockQuantity ?? product.stock) <= 0 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="bg-red-600 text-white px-6 py-3 rounded-full font-black text-lg -rotate-12 border-4 border-white shadow-2xl">
                                            SOLD OUT
                                        </span>
                                    </div>
                                )}

                                {/* Wishlist + Share floating buttons */}
                                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                    <button
                                        onClick={() => toggleWishlist(product)}
                                        className="p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Heart
                                            size={18}
                                            fill={(product?.id && wishlist.some(p => p.id === product.id)) ? '#ef4444' : 'none'}
                                            className={(product?.id && wishlist.some(p => p.id === product.id)) ? 'text-red-500' : 'text-gray-600'}
                                        />
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Share2 size={18} className="text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 md:w-1/2 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 md:p-8">

                                {/* Category breadcrumb */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                                        style={{ color: siteContent?.primaryColor || '#4c1d95', backgroundColor: (siteContent?.primaryColor || '#4c1d95') + '10' }}
                                    >
                                        {product.category}
                                    </span>
                                    {product.subcategory && (
                                        <>
                                            <span className="text-gray-300">/</span>
                                            <span
                                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                                                style={{ color: siteContent?.secondaryColor || '#f97316', backgroundColor: (siteContent?.secondaryColor || '#f97316') + '10' }}
                                            >
                                                {product.subcategory}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Product name */}
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-2">
                                    {product.name}
                                </h2>

                                {/* Price + stock */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-2xl md:text-3xl font-black" style={{ color: siteContent?.secondaryColor || '#f97316' }}>
                                        ₵{product.price?.toLocaleString()}
                                    </span>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${stockLabel.color}`}>
                                        {stockLabel.text}
                                    </span>
                                </div>

                                {/* Continuous Content Sections */}
                                <div className="space-y-10 pb-20">
                                    {/* 1. DESCRIPTION */}
                                    <section>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Product Description</h3>
                                        <p className="text-gray-600 text-[13px] md:text-sm leading-relaxed">
                                            {product.description || 'No description available for this authentic piece.'}
                                        </p>
                                    </section>

                                    {/* 2. HERITAGE STORY (If active) */}
                                    {product.longHistory && (
                                        <section className="p-5 rounded-2xl border border-amber-100 relative overflow-hidden" style={{ backgroundColor: (siteContent?.primaryColor || '#4c1d95') + '05' }}>
                                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                <BookOpen size={80} />
                                            </div>
                                            <div className="flex items-center gap-2 mb-3" style={{ color: siteContent?.primaryColor || '#4c1d95' }}>
                                                <BookOpen size={16} />
                                                <h3 className="font-black text-[10px] uppercase tracking-widest">Cultural Heritage</h3>
                                            </div>
                                            <p className="text-gray-700 text-[13px] leading-relaxed italic">
                                                {product.longHistory}
                                            </p>
                                        </section>
                                    )}

                                    {/* 3. SERVICE & DELIVERY */}
                                    <section>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Service & Delivery</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                                <Truck size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold text-gray-800 text-[11px]">Nationwide Shipping</p>
                                                    <p className="text-gray-500 text-[10px]">Accra same-day / regional 2–4 days</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                                <Shield size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold text-gray-800 text-[11px]">Authenticity</p>
                                                    <p className="text-gray-500 text-[10px]">Handcrafted in Bonwire & Adanwomase</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 4. REVIEWS (Dynamic) */}
                                    <section>
                                        <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-2">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Feedback</h3>
                                            <div className="flex items-center gap-1.5 text-amber-500">
                                                <Star size={10} fill="currentColor" />
                                                <span className="text-[10px] font-black">
                                                    {reviews.length > 0
                                                        ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
                                                        : "5.0"}
                                                </span>
                                                <span className="text-[9px] text-gray-400">({reviews.length})</span>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Review Form */}
                                            <form onSubmit={submitReview} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setUserReview(prev => ({ ...prev, rating: star }))}
                                                            className={`p-1 transition-all ${userReview.rating >= star ? 'text-amber-400 scale-110' : 'text-gray-300'}`}
                                                        >
                                                            <Star size={18} fill={userReview.rating >= star ? 'currentColor' : 'none'} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Your Name"
                                                    required
                                                    value={userReview.name}
                                                    onChange={e => setUserReview(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500/30"
                                                />
                                                <textarea
                                                    placeholder="Share your experience with this royal piece..."
                                                    required
                                                    value={userReview.comment}
                                                    onChange={e => setUserReview(prev => ({ ...prev, comment: e.target.value }))}
                                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500/30 min-h-[80px] resize-none"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {isSubmitting ? "Submitting..." : <><Send size={12} /> Submit Review</>}
                                                </button>
                                            </form>

                                            {/* Reviews List */}
                                            <div className="space-y-5">
                                                {reviews.map(rev => (
                                                    <div key={rev.id} className="border-b border-gray-50 pb-4 last:border-0">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <p className="text-[11px] font-black text-gray-900 uppercase">{rev.customerName}</p>
                                                            <div className="flex text-amber-500 gap-0.5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} size={8} fill={i < rev.rating ? 'currentColor' : 'none'} className={i < rev.rating ? '' : 'text-gray-200'} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 leading-relaxed">{rev.comment}</p>
                                                    </div>
                                                ))}
                                                {reviews.length === 0 && (
                                                    <p className="text-[10px] text-gray-400 italic text-center py-4">Be the first to rate this piece.</p>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    {/* 5. RELATED PRODUCTS */}
                                    <section className="pt-6 border-t border-gray-50">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Explore Similar</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2">
                                            {(allProducts || [])
                                                .filter(p => p.id !== product.id && (p.category === product.category || p.subcategory === product.subcategory))
                                                .slice(0, 4)
                                                .map(item => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => { onClose(); setTimeout(() => onOpenProduct(item), 300); }}
                                                        className="min-w-[120px] w-[120px] group cursor-pointer"
                                                    >
                                                        <div className="aspect-square rounded-2xl bg-gray-50 overflow-hidden mb-2 relative">
                                                            <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                                                        </div>
                                                        <p className="text-[9px] font-black text-gray-900 truncate uppercase mt-1 tracking-tight">{item.name}</p>
                                                        <p className="text-[9px] font-black text-amber-600">₵{item.price.toLocaleString()}</p>
                                                    </div>
                                                ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* === STICKY FOOTER: QUANTITY + BUY BUTTONS === */}
                        <div className="md:absolute md:bottom-0 md:right-0 md:w-1/2 border-t border-gray-100 p-4 md:p-6 bg-white/90 backdrop-blur-md safe-bottom z-30">
                            { (product.stockQuantity ?? product.stock) > 0 ? (
                                <>
                                    {/* Quantity selector */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Qty</span>
                                        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1">
                                            <button
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center font-black text-lg">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(q => Math.min(product.stockQuantity ?? product.stock ?? 999, q + 1))}
                                                className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <span className="font-black text-xl ml-auto" style={{ color: siteContent?.secondaryColor }}>
                                            ₵{(product.price * quantity).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Buy buttons */}
                                    <div className="flex gap-2">
                                        <motion.button
                                            onClick={handleAddToCart}
                                            whileTap={{ scale: 0.95 }}
                                            className="shimmer-premium flex-[2] py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-white flex items-center justify-center gap-3 text-sm transition-all shadow-[0_15px_30px_rgba(0,0,0,0.1)] active:scale-95 transform hover:-translate-y-1"
                                            style={{ backgroundColor: addedToCart ? '#16a34a' : siteContent?.primaryColor }}
                                        >
                                            {addedToCart ? (
                                                <><Check size={20} className="animate-bounce" /> Added!</>
                                            ) : (
                                                <><ShoppingBag size={20} /> Add to Cart</>
                                            )}
                                        </motion.button>
                                        <motion.button
                                            onClick={() => onSingleBuy(product)}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-1 bg-green-500 text-white rounded-2xl md:rounded-3xl font-black text-[10px] md:text-sm flex flex-col items-center justify-center gap-1 hover:bg-green-600 transition-all shadow-lg active:scale-95"
                                        >
                                            <Smartphone size={18} />
                                            <span>WhatsApp</span>
                                        </motion.button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-2">
                                    <p className="text-red-500 font-bold mb-3">Currently out of stock</p>
                                    <button
                                        onClick={() => onSingleBuy(product)}
                                        className="w-full py-4 rounded-2xl font-black text-white bg-green-500 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Smartphone size={18} /> Ask on WhatsApp
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
