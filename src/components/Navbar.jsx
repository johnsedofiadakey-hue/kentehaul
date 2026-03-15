import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ShoppingBag, ChevronDown, Truck, ArrowRight, Star, Sparkles, Phone, MapPin, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SHOP_CATEGORIES } from '../data/constants';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar({
    siteContent,
    cart,
    setIsCartOpen,
    setIsTrackingOpen
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
    const [categories, setCategories] = useState(SHOP_CATEGORIES);
    const [hoveredCat, setHoveredCat] = useState(null);
    const [mobileShopExpanded, setMobileShopExpanded] = useState(false);
    const [mobileActiveCat, setMobileActiveCat] = useState(null);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const dropdownRef = useRef(null);
    const dropdownTimer = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "settings", "categories"), (snap) => {
            if (snap.exists() && snap.data().list?.length > 0) {
                setCategories(snap.data().list);
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => { 
        setMobileMenuOpen(false); 
        setSearchExpanded(false);
    }, [location.pathname]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchExpanded(false);
            setSearchQuery('');
        }
    };

    const closeMenus = () => {
        setMobileMenuOpen(false);
        setShopDropdownOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    const openDropdown = () => {
        clearTimeout(dropdownTimer.current);
        setShopDropdownOpen(true);
        if (!hoveredCat) setHoveredCat(categories[0]?.id || null);
    };

    const closeDropdown = () => {
        dropdownTimer.current = setTimeout(() => {
            setShopDropdownOpen(false);
        }, 300);
    };

    const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

    return (
        <>
            <nav
                className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-2xl py-2' : 'bg-white py-4'
                    } border-b border-gray-50`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="flex justify-between items-center h-16 md:h-18">

                        {/* Logo Area */}
                        <Link to="/" onClick={closeMenus} className="flex items-center gap-3 cursor-pointer group flex-shrink-0">
                            {siteContent.logo ? (
                                <img
                                    src={siteContent.logo}
                                    alt="Logo"
                                    className="h-14 md:h-20 w-auto object-contain transition-transform group-hover:scale-105 duration-500"
                                    style={{ mixBlendMode: 'multiply' }}
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-10 h-10 text-white flex items-center justify-center font-black text-xl rounded-2xl shadow-xl transform rotate-3"
                                        style={{ backgroundColor: siteContent.primaryColor }}
                                    >K</div>
                                    <span className="font-black text-xl md:text-2xl tracking-tighter" style={{ color: siteContent.primaryColor }}>
                                        KENTE<span className="font-light italic" style={{ color: siteContent.secondaryColor }}>HAUL</span>
                                    </span>
                                </div>
                            )}
                        </Link>

                        {/* Main Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-1">
                            {[
                                { name: 'Home', path: '/' },
                                { name: 'Our Story', path: '/heritage' },
                            ].map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-full font-black text-[13px] uppercase tracking-widest transition-all hover:bg-gray-50 ${isActive(link.path) ? 'text-gray-900 border-b-2 border-amber-500 rounded-none' : 'text-gray-500'
                                        }`}
                                    style={isActive(link.path) ? { color: siteContent.primaryColor, borderColor: siteContent.primaryColor } : {}}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {/* MEGA MENU TRIGGER */}
                            <div
                                className="relative group"
                                onMouseEnter={openDropdown}
                                onMouseLeave={closeDropdown}
                            >
                                <button
                                    onClick={() => navigate('/shop')}
                                    className={`shimmer-premium px-5 py-2 rounded-full font-black text-[13px] uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95 ${isActive('/shop') || shopDropdownOpen ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    Our Shop
                                    <ChevronDown size={14} className={`transition-transform duration-500 ${shopDropdownOpen ? 'rotate-180 text-amber-500' : ''}`} />
                                </button>

                                {/* MEGA MENU CONTENT */}
                                <AnimatePresence>
                                    {shopDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="fixed top-[110px] left-0 right-0 w-full bg-white shadow-[0_40px_100px_rgba(0,0,0,0.15)] border-t border-gray-50 overflow-hidden z-[100]"
                                        >
                                            <div className="max-w-7xl mx-auto flex h-[480px]">
                                                {/* Left Sidebar: Categories */}
                                                <div className="w-[300px] border-r border-gray-100 p-8 flex flex-col bg-gray-50/30">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6">{siteContent.navShopTitle || "Store Shop"}</p>
                                                    <div className="space-y-1 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                                        {categories.map(cat => (
                                                            <button
                                                                key={cat.id}
                                                                onMouseEnter={() => setHoveredCat(cat.id)}
                                                                onClick={() => { navigate(`/shop?category=${cat.id}`); closeMenus(); }}
                                                                className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all group ${hoveredCat === cat.id
                                                                    ? 'bg-white shadow-xl translate-x-3 scale-105'
                                                                    : 'hover:bg-white/50 text-gray-400'
                                                                    }`}
                                                            >
                                                                <span className={`font-black text-sm uppercase tracking-wider ${hoveredCat === cat.id ? 'text-gray-900' : ''}`}>
                                                                    {cat.name}
                                                                </span>
                                                                <ChevronDown size={14} className={`-rotate-90 transition-transform ${hoveredCat === cat.id ? 'text-amber-500 scale-125' : 'opacity-0'}`} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                                        <Link
                                                            to="/shop"
                                                            onClick={closeMenus}
                                                            className="flex items-center justify-center gap-2 w-full py-4 text-xs font-black uppercase tracking-[3px] text-white rounded-2xl shadow-lg transition-transform active:scale-95"
                                                            style={{ backgroundColor: siteContent.primaryColor }}
                                                        >
                                                            Shop All <ArrowRight size={14} />
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Middle Section: Subcategories */}
                                                <div className="flex-1 p-12 overflow-y-auto">
                                                    {hoveredCat && (() => {
                                                        const cat = categories.find(c => c.id === hoveredCat);
                                                        if (!cat) return null;
                                                        return (
                                                            <div className="animate-fade-in">
                                                                <h3 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">{cat.name}</h3>
                                                                <p className="text-gray-400 text-sm mb-10 font-bold max-w-md">{siteContent.navShopSubtitle || `Discover the finest ${cat.name} Kente patterns, curated with cultural precision and royal elegance.`}</p>

                                                                <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                                                                    {cat.subcategories.map(sub => (
                                                                        <button
                                                                            key={sub}
                                                                            onClick={() => { navigate(`/shop?category=${cat.id}&sub=${sub}`); closeMenus(); }}
                                                                            className="group text-left p-6 rounded-[32px] bg-gray-50 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-gray-100"
                                                                        >
                                                                            <div className="flex items-center gap-3 mb-2">
                                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm" style={{ color: siteContent.secondaryColor }}>
                                                                                    <Star size={12} fill="currentColor" />
                                                                                </div>
                                                                                <span className="font-black text-xs text-gray-400 uppercase tracking-widest opacity-60">Sub-category</span>
                                                                            </div>
                                                                            <p className="font-black text-lg text-gray-800 group-hover:text-amber-600 transition-colors uppercase leading-none">{sub}</p>
                                                                            <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase text-gray-300 group-hover:text-gray-900 duration-300">
                                                                                Explore <ArrowRight size={10} className="transform translate-x-0 group-hover:translate-x-1 duration-300" />
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                    {cat.subcategories.length === 0 && (
                                                                        <div className="col-span-full py-10 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
                                                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">Complete collection browse</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Right Sidebar: Featured Content (Static Visual) */}
                                                <div className="w-[320px] p-6 hidden xl:block">
                                                    <div className="h-full rounded-[40px] relative overflow-hidden group shadow-2xl">
                                                        <img
                                                            src={siteContent.heroImage || "https://images.unsplash.com/photo-1590666014404-5f50ba56008d?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=600"}
                                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                            alt="Featured"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/10 to-transparent flex flex-col justify-end p-8">
                                                            <span className="text-amber-400 text-[10px] font-black uppercase tracking-[4px] mb-2 block">Premium Pick</span>
                                                            <h4 className="text-white font-black text-2xl leading-tight mb-4 uppercase tracking-tighter">The Royal Queen Collection</h4>
                                                            <Link to="/shop" onClick={closeMenus} className="bg-white text-gray-900 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-amber-400 transition-colors duration-300">New Arrivals</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {[
                                { name: 'History', path: '/institute' },
                                { name: 'Help', path: '/contact' }
                            ].map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-full font-black text-[13px] uppercase tracking-widest transition-all hover:bg-gray-50 ${isActive(link.path) ? 'text-gray-900' : 'text-gray-500'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Actions (Cart, Tracking, Search) */}
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* SEARCH TRIGGER */}
                            <div className="hidden md:flex items-center relative">
                                <AnimatePresence>
                                    {searchExpanded && (
                                        <motion.form 
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: 280, opacity: 1 }}
                                            exit={{ width: 0, opacity: 0 }}
                                            onSubmit={handleSearch}
                                            className="overflow-hidden mr-2"
                                        >
                                            <input 
                                                autoFocus
                                                type="text"
                                                placeholder="Search by color, symbol, or type..."
                                                className="w-full px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
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
                                    <Search size={20} />
                                </button>
                            </div>

                            <button
                                onClick={() => setIsTrackingOpen(true)}
                                className="hidden md:flex flex-col items-center group"
                            >
                                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:-rotate-12 group-hover:scale-110 shadow-sm group-hover:shadow-md">
                                    <Truck size={20} className="group-hover:animate-pulse" />
                                </div>
                                <span className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest group-hover:text-amber-600 transition-colors">Track</span>
                            </button>

                            {/* CART BUTTON */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative flex flex-col items-center group pt-0.5"
                                style={{ color: siteContent.primaryColor }}
                            >
                                <div className="p-3 bg-gray-50 rounded-2xl group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] group-hover:-translate-y-1 transition-all relative group-hover:bg-white">
                                    <ShoppingBag size={22} className="group-hover:scale-110 group-hover:text-amber-600 transition-all" />
                                    {cartCount > 0 && (
                                        <motion.span
                                            key={cartCount}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] text-white text-[10px] font-black rounded-full flex items-center justify-center p-1 shadow-lg ring-4 ring-white"
                                            style={{ backgroundColor: siteContent.secondaryColor }}
                                        >
                                            {cartCount}
                                        </motion.span>
                                    )}
                                </div>
                                <span className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest group-hover:text-amber-600 transition-colors">Cart</span>
                            </button>

                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-3 bg-gray-50 rounded-2xl text-gray-900 active:scale-95 transition-all"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Slide-down Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                             transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                            className="lg:hidden fixed inset-x-0 top-[72px] bottom-0 z-[100] bg-white/40 backdrop-blur-3xl overflow-hidden border-t border-white/20 shadow-[-20px_0_80px_rgba(0,0,0,0.1)]"
                        >
                            <div className="h-full overflow-y-auto custom-scrollbar p-6 pt-10 space-y-2">
                                {/* MOBILE SEARCH */}
                                <form onSubmit={handleSearch} className="mb-6 relative">
                                    <input 
                                        type="text"
                                        placeholder="Search Kente pieces..."
                                        className="w-full pl-6 pr-14 py-5 bg-white shadow-xl rounded-[24px] font-black text-xs uppercase tracking-widest outline-none border border-transparent focus:border-amber-500 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center">
                                        <Search size={18} />
                                    </button>
                                </form>

                                {/* Refined Quick Actions */}
                                <div className="space-y-3 mb-6">
                                    <button
                                        onClick={() => setMobileShopExpanded(!mobileShopExpanded)}
                                        className={`w-full flex items-center justify-between p-5 rounded-[24px] transition-all bg-gray-900 text-white shadow-lg`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ShoppingBag size={20} />
                                            <span className="font-black text-xs uppercase tracking-widest">Shop Collections</span>
                                        </div>
                                        <ChevronDown size={18} className={`transition-transform duration-300 ${mobileShopExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {mobileShopExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-gray-50 rounded-[24px] border border-gray-100"
                                            >
                                                <div className="p-2 space-y-1">
                                                    {categories.map(cat => (
                                                        <div key={cat.id} className="space-y-1">
                                                            <button
                                                                onClick={() => setMobileActiveCat(mobileActiveCat === cat.id ? null : cat.id)}
                                                                className={`w-full flex items-center justify-between p-4 rounded-xl font-black text-xs uppercase tracking-wider ${mobileActiveCat === cat.id ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}
                                                            >
                                                                {cat.name}
                                                                <ChevronDown size={14} className={`transition-transform ${mobileActiveCat === cat.id ? 'rotate-180' : ''}`} />
                                                            </button>
                                                            
                                                            <AnimatePresence>
                                                                {mobileActiveCat === cat.id && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="pl-6 pb-2 space-y-1">
                                                                            <button
                                                                                onClick={() => { navigate(`/shop?category=${cat.id}`); closeMenus(); }}
                                                                                className="w-full text-left p-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900"
                                                                            >
                                                                                View All {cat.name}
                                                                            </button>
                                                                            {cat.subcategories.map(sub => (
                                                                                <button
                                                                                    key={sub}
                                                                                    onClick={() => { navigate(`/shop?category=${cat.id}&sub=${sub}`); closeMenus(); }}
                                                                                    className="w-full text-left p-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center gap-2"
                                                                                >
                                                                                    <div className="w-1 h-1 rounded-full bg-amber-400" /> {sub}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    ))}
                                                    <div className="pt-2">
                                                        <button
                                                            onClick={() => { navigate('/shop'); closeMenus(); }}
                                                            className="w-full p-4 bg-gray-200 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-[3px] flex items-center justify-center gap-2"
                                                        >
                                                            Browse Full Shop <ArrowRight size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onClick={() => { setIsTrackingOpen(true); closeMenus(); }}
                                        className="w-full flex items-center justify-between p-5 bg-gray-50 text-gray-900 rounded-[24px] active:scale-95 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Truck size={20} />
                                            <span className="font-black text-xs uppercase tracking-widest">Track order</span>
                                        </div>
                                        <ArrowRight size={18} className="opacity-20" />
                                    </button>
                                </div>

                                {/* Main Links */}
                                <div className="space-y-1">
                                    {[
                                        { name: 'Home', path: '/', desc: 'Start' },
                                        { name: 'Our Story', path: '/heritage', desc: 'The Legacy' },
                                        { name: 'Kente History', path: '/institute', desc: 'Symbols' },
                                        { name: 'Support', path: '/contact', desc: 'Help' }
                                    ].map((link) => (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            className={`flex flex-col py-3 px-6 rounded-xl transition-all ${isActive(link.path) ? 'bg-amber-50 border-l-4 border-amber-500' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className={`font-black text-base uppercase tracking-tight ${isActive(link.path) ? 'text-amber-600' : 'text-gray-900'}`}>{link.name}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{link.desc}</span>
                                        </Link>
                                    ))}
                                </div>

                                {/* Divider & Support */}
                                <div className="pt-6 border-t border-gray-100 mt-6 space-y-6 pb-10">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-amber-500 shadow-sm">
                                            <Phone size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Royal Support</p>
                                            <p className="font-black text-gray-900">{siteContent.contactPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-teal-500 shadow-sm">
                                            <MapPin size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                                            <p className="font-black text-gray-900">Accra, Ghana</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
}
