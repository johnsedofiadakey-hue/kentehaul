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
    const isHome = location.pathname === '/';
    const floating = isHome && !scrolled;

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
    const navLinks = [
        { label: 'Shop', to: '/shop' },
        { label: 'Heritage', to: '/heritage' },
        { label: 'Institute', to: '/institute' },
        { label: 'Contact', to: '/contact' },
    ];

    return (
        <nav className={`${isHome ? 'fixed left-0 right-0' : 'sticky'} top-0 z-50 border-b transition-all duration-500 ${
            floating
                ? 'border-transparent bg-transparent py-4 text-[#fff8ed]'
                : 'border-[#211b17]/10 bg-[#f8f1e6]/95 py-2 text-[#211b17] shadow-[0_18px_60px_rgba(33,27,23,0.08)] backdrop-blur-xl'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
                        {siteContent?.logo ? (
                            <img
                                src={siteContent.logo}
                                alt="KenteHaul"
                                className="h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-105 md:h-14"
                                style={{ filter: floating ? 'drop-shadow(0 8px 22px rgba(0,0,0,0.32))' : 'none' }}
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div
                                    className="flex h-10 w-10 items-center justify-center border text-xl font-black shadow-xl transition-transform group-hover:-rotate-2"
                                    style={{
                                        backgroundColor: floating ? 'rgba(248,241,230,0.12)' : primary,
                                        borderColor: floating ? 'rgba(248,241,230,0.28)' : primary,
                                        color: 'white'
                                    }}
                                >
                                    K
                                </div>
                                <span className="kh-display text-2xl font-semibold md:text-3xl" style={{ color: floating ? '#fff8ed' : '#211b17' }}>
                                    Kente<span className="italic" style={{ color: floating ? '#d9b05d' : secondary }}>Haul</span>
                                </span>
                            </div>
                        )}
                    </Link>

                    <div className="hidden items-center gap-8 lg:flex">
                        {navLinks.map(link => {
                            const active = location.pathname === link.to;
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`text-[10px] font-black uppercase tracking-[0.24em] transition ${
                                        active
                                            ? floating ? 'text-[#d9b05d]' : 'text-[#a24f32]'
                                            : floating ? 'text-[#fff8ed]/80 hover:text-[#fff8ed]' : 'text-[#5f554d] hover:text-[#211b17]'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

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
                                            className="w-full border border-[#211b17]/10 bg-[#fffaf1] px-4 py-2.5 text-xs font-bold text-[#211b17] outline-none focus:ring-2 focus:ring-[#b88a2b]/30"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </motion.form>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={() => setSearchExpanded(!searchExpanded)}
                                aria-label={searchExpanded ? 'Close search' : 'Open search'}
                                className={`p-3 transition-all ${
                                    searchExpanded
                                        ? 'bg-[#b88a2b] text-[#211b17] shadow-lg'
                                        : floating ? 'bg-[#f8f1e6]/10 text-[#fff8ed] hover:bg-[#f8f1e6]/20' : 'bg-[#fffaf1] text-[#5f554d] hover:bg-[#efe2cf]'
                                }`}
                            >
                                {searchExpanded ? <X size={18} /> : <Search size={18} />}
                            </button>
                        </div>

                        {/* Track — hidden on mobile (in bottom nav) */}
                        <button
                            onClick={() => setIsTrackingOpen(true)}
                            className="hidden md:flex flex-col items-center group"
                            aria-label="Track order"
                        >
                            <div className={`p-3 transition-all group-hover:-translate-y-0.5 ${
                                floating ? 'bg-[#f8f1e6]/10 text-[#fff8ed] group-hover:bg-[#f8f1e6]/20' : 'bg-[#fffaf1] text-[#5f554d] group-hover:bg-[#211b17] group-hover:text-[#fff8ed]'
                            }`}>
                                <Truck size={18} />
                            </div>
                            <span className={`mt-1 hidden text-[9px] font-black uppercase tracking-widest transition-colors lg:block ${floating ? 'text-[#fff8ed]/60 group-hover:text-[#fff8ed]' : 'text-[#5f554d] group-hover:text-[#a24f32]'}`}>Track</span>
                        </button>

                        {/* Wishlist */}
                        <button
                            onClick={() => setIsWishlistOpen(true)}
                            className="relative flex flex-col items-center group pt-0.5"
                            aria-label="Open saved items"
                        >
                            <div className={`relative p-3 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg ${
                                floating ? 'bg-[#f8f1e6]/10 text-[#fff8ed] group-hover:bg-[#f8f1e6]/20' : 'bg-[#fffaf1] text-[#5f554d] group-hover:bg-white'
                            }`}>
                                <Heart size={18} className={`transition-all ${wishlistCount > 0 ? 'text-red-500 fill-red-500' : floating ? 'text-[#fff8ed] group-hover:text-red-200' : 'text-[#5f554d] group-hover:text-red-500'}`} />
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
                            <span className={`mt-1 hidden text-[9px] font-black uppercase tracking-widest md:block ${floating ? 'text-[#fff8ed]/60' : 'text-[#5f554d]'}`}>Saved</span>
                        </button>

                        {/* Cart */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex flex-col items-center group pt-0.5"
                            style={{ color: floating ? '#fff8ed' : primary }}
                            aria-label="Open cart"
                        >
                            <div className={`relative p-3 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg ${
                                floating ? 'bg-[#f8f1e6]/10 group-hover:bg-[#f8f1e6]/20' : 'bg-[#fffaf1] group-hover:bg-white'
                            }`}>
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
                            <span className={`mt-1 hidden text-[9px] font-black uppercase tracking-widest md:block ${floating ? 'text-[#fff8ed]/60' : 'text-[#5f554d]'}`}>Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
