import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Smartphone, BookOpen, Star, ChevronLeft, ChevronRight, Heart, Share2, Check, Minus, Plus, Truck, Shield, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductDetailModal({
    product,
    onClose,
    addToCart,
    onSingleBuy,
    siteContent,
    allProducts,
    onOpenProduct
}) {
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const [wished, setWished] = useState(false);

    // Reset state when product changes
    useEffect(() => {
        if (product) {
            setQuantity(1);
            setAddedToCart(false);
            setActiveTab('description');
        }
    }, [product?.id]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (product) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [product]);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2500);
    };

    const handleShare = async () => {
        const text = `Check out ${product.name} on KenteHaul! ₵${product.price}`;
        if (navigator.share) {
            try { await navigator.share({ title: product.name, text }); } catch (e) { }
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const stockLabel = product?.stock <= 0
        ? { text: 'Out of Stock', color: 'text-red-600 bg-red-50' }
        : product?.stock <= 3
            ? { text: `Only ${product.stock} left!`, color: 'text-orange-600 bg-orange-50' }
            : { text: `${product?.stock} in stock`, color: 'text-green-600 bg-green-50' };

    return (
        <AnimatePresence>
            {product && (
                <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal — bottom sheet on mobile, centered on desktop */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="relative z-10 w-full md:max-w-5xl bg-white md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh] md:max-h-[85vh]"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-30 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition"
                        >
                            <X size={20} />
                        </button>

                        {/* === LEFT: IMAGE === */}
                        <div className="w-full md:w-[45%] bg-gray-50 relative flex-shrink-0">
                            {/* Drag handle on mobile */}
                            <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full z-20" />

                            <div className="aspect-[4/3] md:aspect-auto md:h-full min-h-[240px] md:min-h-0 relative overflow-hidden">
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
                                {product.stock <= 0 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="bg-red-600 text-white px-6 py-3 rounded-full font-black text-lg -rotate-12 border-4 border-white shadow-2xl">
                                            SOLD OUT
                                        </span>
                                    </div>
                                )}

                                {/* Wishlist + Share floating buttons */}
                                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                    <button
                                        onClick={() => setWished(!wished)}
                                        className="p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Heart
                                            size={18}
                                            fill={wished ? '#ef4444' : 'none'}
                                            className={wished ? 'text-red-500' : 'text-gray-600'}
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

                        {/* === RIGHT: PRODUCT DETAILS === */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 md:p-8">

                                {/* Category breadcrumb */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                                        style={{ color: siteContent.primaryColor, backgroundColor: siteContent.primaryColor + '15' }}
                                    >
                                        {product.category}
                                    </span>
                                    {product.subcategory && (
                                        <>
                                            <span className="text-gray-300">/</span>
                                            <span
                                                className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                                                style={{ color: siteContent.secondaryColor, backgroundColor: siteContent.secondaryColor + '15' }}
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
                                <div className="flex items-center gap-4 mb-5">
                                    <span className="text-3xl font-black" style={{ color: siteContent.secondaryColor }}>
                                        ₵{product.price?.toLocaleString()}
                                    </span>
                                    <span className={`text-xs font-black px-3 py-1.5 rounded-full ${stockLabel.color}`}>
                                        {stockLabel.text}
                                    </span>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1 mb-5 border-b border-gray-100">
                                    {['description', product.longHistory && 'story', 'delivery', 'reviews'].filter(Boolean).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-current' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                            style={activeTab === tab ? { color: siteContent.primaryColor, borderColor: siteContent.primaryColor } : {}}
                                        >
                                            {tab === 'story' ? '📖 Story' : tab === 'description' ? 'Details' : tab === 'delivery' ? '🚚 Delivery' : '⭐ Reviews'}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab content */}
                                <div className="text-gray-600 text-sm leading-relaxed min-h-[120px]">
                                    {activeTab === 'description' && (
                                        <p>{product.description || 'No description available.'}</p>
                                    )}
                                    {activeTab === 'story' && product.longHistory && (
                                        <div className="p-4 rounded-2xl border-l-4" style={{ backgroundColor: siteContent.primaryColor + '08', borderColor: siteContent.secondaryColor }}>
                                            <div className="flex items-center gap-2 mb-2" style={{ color: siteContent.primaryColor }}>
                                                <BookOpen size={15} />
                                                <span className="font-black text-xs uppercase tracking-wider">Cultural Heritage</span>
                                            </div>
                                            <p className="italic">{product.longHistory}</p>
                                        </div>
                                    )}
                                    {activeTab === 'delivery' && (
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                                <Truck size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold text-gray-800 text-xs">Nationwide Delivery</p>
                                                    <p className="text-gray-500 text-xs">Accra same-day / regional 2–4 days / international 7–14 days</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                                <Shield size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold text-gray-800 text-xs">Authenticity Guaranteed</p>
                                                    <p className="text-gray-500 text-xs">Sourced directly from master weavers of Bonwire & Adanwomase</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                                <RefreshCw size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold text-gray-800 text-xs">Exchanges</p>
                                                    <p className="text-gray-500 text-xs">Contact us within 7 days for size or quality issues</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'reviews' && (
                                        <div className="space-y-4">
                                            {/* Review Prompt */}
                                            <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                <p className="font-bold text-gray-800 mb-2">Love this piece?</p>
                                                <p className="text-xs text-gray-500 mb-3">Share your experience with others.</p>
                                                <button
                                                    onClick={() => alert("Review submission is coming soon! You can also share your feedback via WhatsApp.")}
                                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-100 transition shadow-sm"
                                                    style={{ color: siteContent.primaryColor }}
                                                >
                                                    Write a Review
                                                </button>
                                            </div>

                                            {/* Mock Reviews for Visuals */}
                                            <div className="space-y-3 opacity-60">
                                                <div className="p-3 border-b border-gray-100">
                                                    <div className="flex text-amber-500 gap-0.5 mb-1"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
                                                    <p className="text-xs font-bold text-gray-800 mb-1">Absolutely Stunning!</p>
                                                    <p className="text-[10px] text-gray-500">Authentic quality, just as described. Perfect for my graduation.</p>
                                                </div>
                                                <div className="p-3">
                                                    <div className="flex text-amber-500 gap-0.5 mb-1"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
                                                    <p className="text-xs font-bold text-gray-800 mb-1">Exceeded Expectations</p>
                                                    <p className="text-[10px] text-gray-500">The colors are even more vibrant in person. Highly recommend.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Related Products */}
                            <div className="mt-8 pt-8 border-t border-gray-100 px-6 md:px-8">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 px-1">You Might Also Like</h3>
                                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                                    {(allProducts || [])
                                        .filter(p => p.id !== product.id && (p.category === product.category || p.subcategory === product.subcategory))
                                        .slice(0, 4)
                                        .map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => { onClose(); setTimeout(() => onOpenProduct(item), 300); }}
                                                className="min-w-[140px] w-[140px] group cursor-pointer"
                                            >
                                                <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden mb-2 relative">
                                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-900 truncate">{item.name}</p>
                                                <p className="text-[10px] font-black" style={{ color: siteContent.secondaryColor }}>₵{item.price.toLocaleString()}</p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* === STICKY FOOTER: QUANTITY + BUY BUTTONS === */}
                        <div className="border-t border-gray-100 p-5 md:p-6 bg-white safe-bottom">
                            {product.stock > 0 ? (
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
                                                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                                className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <span className="font-black text-xl ml-auto" style={{ color: siteContent.secondaryColor }}>
                                            ₵{(product.price * quantity).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Buy buttons */}
                                    <div className="flex gap-3">
                                        <motion.button
                                            onClick={handleAddToCart}
                                            whileTap={{ scale: 0.97 }}
                                            className="flex-1 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 text-sm transition-all"
                                            style={{ backgroundColor: addedToCart ? '#16a34a' : siteContent.primaryColor }}
                                        >
                                            {addedToCart ? (
                                                <><Check size={18} /> Added to Cart!</>
                                            ) : (
                                                <><ShoppingBag size={18} /> Add to Cart</>
                                            )}
                                        </motion.button>
                                        <motion.button
                                            onClick={() => onSingleBuy(product)}
                                            whileTap={{ scale: 0.97 }}
                                            className="px-5 bg-green-500 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-green-600 transition-all"
                                        >
                                            <Smartphone size={18} />
                                            <span className="hidden sm:inline">WhatsApp</span>
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
