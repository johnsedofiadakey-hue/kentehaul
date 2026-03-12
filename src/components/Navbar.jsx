import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ShoppingBag, ChevronDown, Truck, ArrowRight } from 'lucide-react';
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
    const dropdownRef = useRef(null);
    const dropdownTimer = useRef(null);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "settings", "categories"), (snap) => {
            if (snap.exists() && snap.data().list?.length > 0) {
                setCategories(snap.data().list);
            }
        });
        return () => unsub();
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

    const closeMenus = () => {
        setMobileMenuOpen(false);
        setShopDropdownOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    const openDropdown = () => {
        clearTimeout(dropdownTimer.current);
        setShopDropdownOpen(true);
        setHoveredCat(categories[0]?.id || null);
    };

    const closeDropdown = () => {
        dropdownTimer.current = setTimeout(() => {
            setShopDropdownOpen(false);
            setHoveredCat(null);
        }, 150);
    };

    const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

    return (
        <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-18 md:h-20 items-center">

                    {/* Logo */}
                    <Link to="/" onClick={closeMenus} className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                        {siteContent.logo ? (
                            <img src={siteContent.logo} alt="Logo" className="h-14 md:h-16 w-auto object-contain" />
                        ) : (
                            <>
                                <div
                                    className="w-9 h-9 md:w-10 md:h-10 text-white flex items-center justify-center font-bold text-lg rounded-xl shadow-lg group-hover:rotate-6 transition"
                                    style={{ backgroundColor: siteContent.primaryColor }}
                                >K</div>
                                <span className="font-extrabold text-xl md:text-2xl tracking-tight" style={{ color: siteContent.primaryColor }}>
                                    Kente<span style={{ color: siteContent.secondaryColor }}>Haul</span>
                                </span>
                            </>
                        )}
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
                        <Link to="/" className="font-bold transition hover:opacity-80 text-sm" style={{ color: isActive('/') ? siteContent.primaryColor : '#6b7280' }}>Home</Link>
                        <Link to="/heritage" className="font-bold transition hover:opacity-80 text-sm" style={{ color: isActive('/heritage') ? siteContent.primaryColor : '#6b7280' }}>Heritage</Link>

                        {/* RICH SHOP DROPDOWN */}
                        <div
                            ref={dropdownRef}
                            className="relative"
                            onMouseEnter={openDropdown}
                            onMouseLeave={closeDropdown}
                        >
                            <Link
                                to="/shop"
                                className="flex items-center gap-1 font-bold transition hover:opacity-80 text-sm"
                                style={{ color: isActive('/shop') ? siteContent.primaryColor : '#6b7280' }}
                            >
                                Shop <ChevronDown size={14} className={`transition-transform duration-200 ${shopDropdownOpen ? 'rotate-180' : ''}`} />
                            </Link>

                            <AnimatePresence>
                                {shopDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        onMouseEnter={() => clearTimeout(dropdownTimer.current)}
                                        onMouseLeave={closeDropdown}
                                        className="absolute top-full left-1/2 -translate-x-1/2 w-[520px] bg-white shadow-2xl rounded-3xl mt-3 border border-gray-100 overflow-hidden"
                                    >
                                        <div className="flex">
                                            {/* LEFT: Category list */}
                                            <div className="w-48 border-r border-gray-50 py-4">
                                                <p className="px-5 pb-3 text-[9px] font-black text-gray-300 uppercase tracking-[4px]">Collections</p>
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        onMouseEnter={() => setHoveredCat(cat.id)}
                                                        onClick={() => {
                                                            navigate('/shop');
                                                            closeMenus();
                                                        }}
                                                        className={`w-full text-left px-5 py-3 flex items-center justify-between transition-all text-sm font-bold rounded-none ${hoveredCat === cat.id ? 'text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                                        style={hoveredCat === cat.id ? { backgroundColor: siteContent.primaryColor, color: 'white' } : {}}
                                                    >
                                                        {cat.name}
                                                        <ChevronDown size={12} className="-rotate-90" />
                                                    </button>
                                                ))}
                                                <div className="px-4 pt-3 mt-2 border-t border-gray-50">
                                                    <Link
                                                        to="/shop"
                                                        onClick={closeMenus}
                                                        className="flex items-center gap-1.5 text-xs font-black py-2 transition-all"
                                                        style={{ color: siteContent.secondaryColor }}
                                                    >
                                                        View All <ArrowRight size={12} />
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* RIGHT: Subcategories panel */}
                                            <div className="flex-1 py-4 px-5">
                                                {hoveredCat && (() => {
                                                    const cat = categories.find(c => c.id === hoveredCat);
                                                    return cat ? (
                                                        <>
                                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[4px] mb-4">
                                                                {cat.name} Styles
                                                            </p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {cat.subcategories.map(sub => (
                                                                    <button
                                                                        key={sub}
                                                                        onClick={() => { navigate('/shop'); closeMenus(); }}
                                                                        className="text-left p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all group"
                                                                    >
                                                                        <p className="font-bold text-sm text-gray-800 group-hover:text-gray-900">{sub}</p>
                                                                        <p className="text-[10px] text-gray-400 mt-0.5">{cat.name}</p>
                                                                    </button>
                                                                ))}
                                                                {cat.subcategories.length === 0 && (
                                                                    <p className="text-sm text-gray-400 italic col-span-2">All items in this collection</p>
                                                                )}
                                                            </div>
                                                            {/* Bottom CTA */}
                                                            <div
                                                                className="mt-4 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:opacity-90 transition-all"
                                                                style={{ backgroundColor: siteContent.primaryColor + '12' }}
                                                                onClick={() => { navigate('/shop'); closeMenus(); }}
                                                            >
                                                                <div>
                                                                    <p className="font-black text-xs" style={{ color: siteContent.primaryColor }}>Browse All {cat.name}</p>
                                                                    <p className="text-[10px] text-gray-400">See full collection</p>
                                                                </div>
                                                                <ArrowRight size={16} style={{ color: siteContent.primaryColor }} />
                                                            </div>
                                                        </>
                                                    ) : null;
                                                })()}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <Link to="/institute" className="font-bold transition hover:opacity-80 text-sm" style={{ color: isActive('/institute') ? siteContent.primaryColor : '#6b7280' }}>Institute</Link>
                        <Link to="/contact" className="font-bold transition hover:opacity-80 text-sm" style={{ color: isActive('/contact') ? siteContent.primaryColor : '#6b7280' }}>Contact</Link>

                        <button
                            onClick={() => setIsTrackingOpen(true)}
                            className="px-4 py-2 rounded-full font-bold text-xs bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5"
                        >
                            <Truck size={14} /> Track
                        </button>

                        {/* Cart Button */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 rounded-full transition hover:bg-gray-100 active:scale-95"
                            style={{ color: siteContent.primaryColor }}
                        >
                            <ShoppingBag size={22} />
                            {cartCount > 0 && (
                                <motion.span
                                    key={cartCount}
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-0.5 -right-0.5 w-5 h-5 text-white text-[10px] font-black rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: siteContent.secondaryColor }}
                                >
                                    {cartCount}
                                </motion.span>
                            )}
                        </button>
                    </div>

                    {/* Mobile Right: Cart + Hamburger */}
                    <div className="md:hidden flex items-center gap-2">
                        <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 active:scale-90 transition" style={{ color: siteContent.primaryColor }}>
                            <ShoppingBag size={24} />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 text-white text-[9px] font-black rounded-full flex items-center justify-center" style={{ backgroundColor: siteContent.secondaryColor }}>
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2.5 rounded-2xl active:scale-90 transition"
                            style={{ color: siteContent.primaryColor, backgroundColor: siteContent.primaryColor + '10' }}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl"
                    >
                        <div className="px-5 py-6 space-y-1">
                            <Link to="/" onClick={closeMenus} className="flex items-center justify-between w-full py-3.5 px-4 rounded-2xl font-bold text-base hover:bg-gray-50 active:bg-gray-100 transition-all" style={{ color: isActive('/') ? siteContent.primaryColor : '#374151' }}>
                                Home
                            </Link>
                            <Link to="/heritage" onClick={closeMenus} className="flex items-center justify-between w-full py-3.5 px-4 rounded-2xl font-bold text-base hover:bg-gray-50 active:bg-gray-100 transition-all" style={{ color: isActive('/heritage') ? siteContent.primaryColor : '#374151' }}>
                                Heritage
                            </Link>

                            {/* Mobile: Shop with expandable categories */}
                            <div>
                                <Link to="/shop" onClick={closeMenus} className="flex items-center justify-between w-full py-3.5 px-4 rounded-2xl font-bold text-base hover:bg-gray-50 transition-all" style={{ color: siteContent.primaryColor }}>
                                    Shop All Collections <ArrowRight size={16} />
                                </Link>
                                <div className="mt-1 ml-4 space-y-1 pb-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => { navigate('/shop'); closeMenus(); }}
                                            className="w-full text-left py-2.5 px-4 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-all flex items-center justify-between"
                                        >
                                            {cat.name}
                                            {cat.subcategories.length > 0 && (
                                                <span className="text-[10px] text-gray-300">{cat.subcategories.length} styles</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Link to="/institute" onClick={closeMenus} className="flex items-center justify-between w-full py-3.5 px-4 rounded-2xl font-bold text-base hover:bg-gray-50 active:bg-gray-100 transition-all" style={{ color: '#374151' }}>
                                Institute
                            </Link>
                            <Link to="/contact" onClick={closeMenus} className="flex items-center justify-between w-full py-3.5 px-4 rounded-2xl font-bold text-base hover:bg-gray-50 active:bg-gray-100 transition-all" style={{ color: '#374151' }}>
                                Contact
                            </Link>
                            <button
                                onClick={() => { setIsTrackingOpen(true); closeMenus(); }}
                                className="flex items-center gap-3 w-full py-3.5 px-4 rounded-2xl font-bold text-base text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-all"
                            >
                                <Truck size={18} /> Track My Order
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
