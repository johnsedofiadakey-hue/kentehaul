import React, { useState, useEffect, useRef } from 'react';
import { Home, ShoppingBag, Truck, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav({ cart, setIsCartOpen, setIsTrackingOpen, siteContent }) {
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);
    const location = useLocation();

    const cartCount = cart.reduce((a, b) => a + b.quantity, 0);
    const primary = siteContent?.primaryColor || '#5b0143';
    const secondary = siteContent?.secondaryColor || '#f97316';

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            if (current < 60) { setVisible(true); return; }
            setVisible(current < lastScrollY.current);
            lastScrollY.current = current;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path) => location.pathname === path;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="bottom-nav"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
                >
                    {/* Safe area + blur glass */}
                    <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-2xl">
                        <div className="flex items-center justify-around px-2 pb-safe">
                            {/* Home */}
                            <Link to="/" className="flex-1">
                                <TabItem
                                    icon={<Home size={22} />}
                                    label="Home"
                                    active={isActive('/')}
                                    primary={primary}
                                />
                            </Link>

                            {/* Shop */}
                            <Link to="/shop" className="flex-1">
                                <TabItem
                                    icon={<Store size={22} />}
                                    label="Shop"
                                    active={isActive('/shop')}
                                    primary={primary}
                                />
                            </Link>

                            {/* Cart — center pill */}
                            <button
                                className="flex-1 relative"
                                onClick={() => setIsCartOpen(true)}
                            >
                                <div className="flex flex-col items-center py-3 relative">
                                    <div
                                        className="p-3.5 rounded-2xl shadow-lg relative"
                                        style={{ backgroundColor: primary }}
                                    >
                                        <ShoppingBag size={22} className="text-white" />
                                        {cartCount > 0 && (
                                            <motion.span
                                                key={cartCount}
                                                initial={{ scale: 0.5 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow ring-2 ring-white"
                                                style={{ backgroundColor: secondary }}
                                            >
                                                {cartCount}
                                            </motion.span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest mt-1" style={{ color: primary }}>Cart</span>
                                </div>
                            </button>

                            {/* Track */}
                            <button
                                className="flex-1"
                                onClick={() => setIsTrackingOpen(true)}
                            >
                                <TabItem
                                    icon={<Truck size={22} />}
                                    label="Track"
                                    active={false}
                                    primary={primary}
                                />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function TabItem({ icon, label, active, primary }) {
    return (
        <div className="flex flex-col items-center py-3 gap-0.5 transition-all">
            <div className={`transition-all duration-200 ${active ? 'scale-110' : ''}`} style={{ color: active ? primary : '#9ca3af' }}>
                {icon}
            </div>
            <span
                className="text-[9px] font-black uppercase tracking-widest transition-colors"
                style={{ color: active ? primary : '#9ca3af' }}
            >
                {label}
            </span>
        </div>
    );
}
