import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Search, Heart, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar({
    siteContent,
    cart,
    wishlistCount,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsTrackingOpen,
}) {
    const [scrolled, setScrolled] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setSearchExpanded(false);
        setSearchQuery('');
    }, [location.pathname]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchExpanded(false);
            setSearchQuery('');
        }
    };

    const cartCount = cart.reduce((a, b) => a + b.quantity, 0);
    const primary = siteContent?.primaryColor || '#5b0143';
    const secondary = siteContent?.secondaryColor || '#f97316';

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-500 ${
            scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg py-1' : 'bg-white py-2'
        } border-b border-gray-50`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
                        {siteContent?.logo ? (
                            <img
                                src={siteContent.logo}
                                alt="KenteHaul"
                                className="h-14 md:h-18 w-auto object-contain transition-transform group-hover:scale-105 duration-500"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 text-white flex items-center justify-center font-black text-xl rounded-2xl shadow-xl transform rotate-3" style={{ backgroundColor: primary }}>K</div>
                                <span className="font-black text-xl md:text-2xl tracking-tighter" style={{ color: primary }}>
                                    KENTE<span className="font-light italic" style={{ color: secondary }}>HAUL</span>
                                </span>
                            </div>
                        )}
                    </Link>

                    {/* Right actions */}
                    <div className="flex items-center gap-1 sm:gap-2">

                        {/* Search — expands on desktop, icon only on mobile */}
                        <div className="flex items-center relative">
                            <AnimatePresence>
                                {searchExpanded && (
                                    <motion.form
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 240, opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        onSubmit={handleSearch}
                                        className="overflow-hidden mr-2"
                                    >
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Search pieces..."
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </motion.form>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={() => setSearchExpanded(!searchExpanded)}
                                className={`p-3 rounded-2xl transition-all ${searchExpanded ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
                                {searchExpanded ? <X size={18} /> : <Search size={18} />}
                            </button>
                        </div>

                        {/* Track — hidden on mobile (in bottom nav) */}
                        <button
                            onClick={() => setIsTrackingOpen(true)}
                            className="hidden md:flex flex-col items-center group"
                        >
                            <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all group-hover:scale-110 shadow-sm">
                                <Truck size={18} />
                            </div>
                            <span className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest group-hover:text-amber-600 transition-colors">Track</span>
                        </button>

                        {/* Wishlist */}
                        <button
                            onClick={() => setIsWishlistOpen(true)}
                            className="relative flex flex-col items-center group pt-0.5"
                        >
                            <div className="p-3 bg-gray-50 rounded-2xl group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all relative group-hover:bg-white">
                                <Heart size={18} className={`transition-all ${wishlistCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-500 group-hover:text-red-500'}`} />
                                {wishlistCount > 0 && (
                                    <motion.span
                                        key={wishlistCount}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg ring-2 ring-white"
                                    >
                                        {wishlistCount}
                                    </motion.span>
                                )}
                            </div>
                            <span className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest hidden md:block">Saved</span>
                        </button>

                        {/* Cart */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex flex-col items-center group pt-0.5"
                            style={{ color: primary }}
                        >
                            <div className="p-3 bg-gray-50 rounded-2xl group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all relative group-hover:bg-white">
                                <ShoppingBag size={18} className="group-hover:scale-110 transition-all" />
                                {cartCount > 0 && (
                                    <motion.span
                                        key={cartCount}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg ring-2 ring-white"
                                        style={{ backgroundColor: secondary }}
                                    >
                                        {cartCount}
                                    </motion.span>
                                )}
                            </div>
                            <span className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest hidden md:block">Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
