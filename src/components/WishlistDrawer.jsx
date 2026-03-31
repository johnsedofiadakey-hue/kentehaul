import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WishlistDrawer({ isOpen, onClose, wishlist, toggleWishlist, addToCart, siteContent }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[610] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                    <Heart size={20} fill="currentColor" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-none">Your Favorites</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Saved Heritage Pieces</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {wishlist.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                    <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center">
                                        <Heart size={40} className="text-gray-300" />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 uppercase text-xs tracking-widest">Your wishlist is empty</p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 max-w-[200px]">Save the royal fabrics that speak to your soul.</p>
                                    </div>
                                    <button 
                                        onClick={onClose}
                                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                    >
                                        Explore Shop
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {wishlist.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group flex gap-4 p-3 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-500"
                                        >
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-white border border-gray-100">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            </div>
                                            <div className="flex-grow flex flex-col justify-between py-1">
                                                <div>
                                                    <h3 className="font-black text-sm text-gray-900 line-clamp-1">{product.name}</h3>
                                                    <p className="text-lg font-black mt-0.5" style={{ color: siteContent.secondaryColor }}>₵{product.price.toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => { addToCart(product); toggleWishlist(product); }}
                                                        className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <ShoppingBag size={12} /> Add
                                                    </button>
                                                    <button
                                                        onClick={() => toggleWishlist(product)}
                                                        className="p-2 border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {wishlist.length > 0 && (
                            <div className="p-6 border-t border-gray-50 bg-white space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wishlist Value</span>
                                    <span className="font-black text-xl text-gray-900">₵{wishlist.reduce((sum, item) => sum + item.price, 0).toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={onClose}
                                        className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[3px] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        Keep Exploring <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
