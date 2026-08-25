import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function StickyCartBar({ cart, cartTotal, siteContent, setIsCartOpen }) {
    const cartCount = cart.reduce((a, b) => a + b.quantity, 0);
    const primary = siteContent?.primaryColor || '#5b0143';
    const secondary = siteContent?.secondaryColor || '#f97316';

    return (
        <AnimatePresence>
            {cartCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 md:left-auto md:translate-x-0 md:right-6 w-[calc(100%-2rem)] md:w-auto"
                >
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4 px-5 py-4 rounded-[22px] shadow-2xl text-white transition-all active:scale-95 hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
                        style={{ backgroundColor: primary }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ShoppingBag size={20} />
                                <span
                                    className="absolute -top-2 -right-2 w-5 h-5 text-[9px] font-black rounded-full flex items-center justify-center shadow"
                                    style={{ backgroundColor: secondary }}
                                >
                                    {cartCount}
                                </span>
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Your Bag</p>
                                <p className="text-sm font-black leading-none">₵{cartTotal.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-black uppercase tracking-widest opacity-80 ml-4">
                            Checkout <ArrowRight size={14} />
                        </div>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
