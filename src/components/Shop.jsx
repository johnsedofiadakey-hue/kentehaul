import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingBag, Smartphone, Eye, ChevronDown, X, SlidersHorizontal, ArrowRight, Grid3X3, List, Filter, LayoutGrid } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SHOP_CATEGORIES } from '../data/constants';
import { LazyImage } from '../UIComponents';
import { motion, AnimatePresence } from 'framer-motion';

export default function Shop({
  products,
  currentCategory,
  searchQuery,
  setSearchQuery,
  addToCart,
  handleSingleBuy,
  setSelectedProduct,
  siteContent
}) {
  // Dynamic categories from Firestore
  const [categories, setCategories] = useState(SHOP_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(currentCategory || null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'large'

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "categories"), (snap) => {
      if (snap.exists() && snap.data().list?.length > 0) {
        setCategories(snap.data().list);
      }
    });
    return () => unsub();
  }, []);

  // Sync with external category prop
  useEffect(() => {
    if (currentCategory) setActiveCategory(currentCategory);
  }, [currentCategory]);

  const selectedCatData = useMemo(() => categories.find(c => c.id === activeCategory), [categories, activeCategory]);

  // Filter + Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(p =>
      (!activeCategory || p.category === activeCategory) &&
      (!activeSubcategory || p.subcategory === activeSubcategory) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else if (sortBy === 'newest') result = [...result].sort((a, b) => (b.date || 0) - (a.date || 0));
    else if (sortBy === 'stock') result = [...result].sort((a, b) => b.stock - a.stock);

    return result;
  }, [products, activeCategory, activeSubcategory, searchQuery, sortBy]);

  const clearFilters = () => {
    setActiveCategory(null);
    setActiveSubcategory(null);
    setSearchQuery('');
    setSortBy('default');
  };

  const hasActiveFilters = activeCategory || activeSubcategory || searchQuery || sortBy !== 'default';

  return (
    <div className="bg-white min-h-screen">
      {/* Dynamic Header Banner */}
      <div
        className="relative h-[30vh] md:h-[40vh] flex items-center justify-center overflow-hidden bg-gray-900"
      >
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={selectedCatData?.image || siteContent.heroImage || "https://images.unsplash.com/photo-1590666014404-5f50ba56008d?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=1200"}
            className="w-full h-full object-cover grayscale transition-transform duration-[5s] hover:scale-110"
            alt="Category Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/80"></div>
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-block py-1 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[4px] mb-4"
          >
            Collections / {activeCategory ? selectedCatData?.name : "All Products"}
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter"
          >
            {activeCategory ? selectedCatData?.name : "The Collection"}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2 }}
            className="h-1.5 w-24 bg-amber-500 mx-auto mt-6 rounded-full"
          ></motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">

        {/* ACTION BAR: Filters, Sorting, Search */}
        <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md py-4 mb-10 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">

          {/* Left: View Controls & Count */}
          <div className="flex items-center gap-6 order-2 md:order-1">
            <div className="hidden sm:flex items-center gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('large')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'large' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 size={18} />
              </button>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[2px] text-gray-400">
              <span className="text-gray-900">{filteredProducts.length}</span> Objects Found
            </p>
          </div>

          {/* Right: Sort & Search */}
          <div className="flex items-center gap-3 w-full md:w-auto order-1 md:order-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Search the archives..."
                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative group">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-gray-900 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-colors pr-12 w-full md:w-auto font-mono"
              >
                <option value="default">Sort: Recommended</option>
                <option value="newest">Latest Release</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-2xl border transition-all md:hidden ${showFilters ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-gray-100 text-gray-900'}`}
            >
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar Filters (Desktop) / Collapsible (Mobile) */}
          <div className={`w-full md:w-[260px] flex-shrink-0 space-y-10 ${showFilters ? 'block' : 'hidden md:block'}`}>

            {/* CATEGORIES SECTION */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[4px] text-gray-300 border-b border-gray-50 pb-2">Collections</h3>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setActiveCategory(null); setActiveSubcategory(null); }}
                  className={`text-left px-4 py-3 rounded-2xl text-sm font-black transition-all ${!activeCategory ? 'bg-gray-900 text-white shadow-xl translate-x-1' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  All Archives
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setActiveSubcategory(null); }}
                    className={`text-left px-4 py-3 rounded-2xl text-sm font-black transition-all ${activeCategory === cat.id ? 'bg-gray-900 text-white shadow-xl translate-x-1' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SUBCATEGORIES SECTION */}
            <AnimatePresence>
              {selectedCatData?.subcategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-[11px] font-black uppercase tracking-[4px] text-gray-300 border-b border-gray-50 pb-2">Style Variation</h3>
                  <div className="flex flex-wrap md:flex-col gap-2">
                    <button
                      onClick={() => setActiveSubcategory(null)}
                      className={`px-4 py-3 rounded-xl text-xs font-black transition-all border ${!activeSubcategory ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                    >
                      All {selectedCatData.name}
                    </button>
                    {selectedCatData.subcategories.map(sub => (
                      <button
                        key={sub}
                        onClick={() => setActiveSubcategory(sub)}
                        className={`px-4 py-3 rounded-xl text-xs font-black transition-all border ${activeSubcategory === sub ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CLEAR FILTERS */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors w-full px-4 group"
              >
                <X size={14} className="group-hover:rotate-90 transition-transform" /> Reset Selection
              </button>
            )}
          </div>

          {/* PRODUCT GRID */}
          <div className={`flex-1 grid gap-10 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            <AnimatePresence mode='popLayout'>
              {filteredProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.6, delay: (idx % 6) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col h-full bg-white relative"
                >
                  {/* Card Media Wrapper */}
                  <div
                    className="relative aspect-[4/5] rounded-[40px] overflow-hidden bg-gray-50 shadow-sm group-hover:shadow-[0_40px_100px_rgba(0,0,0,0.15)] transition-all duration-700 cursor-pointer"
                    onClick={() => setSelectedProduct(p)}
                  >
                    <div className="absolute inset-0 z-10 transition-opacity duration-700 opacity-0 group-hover:opacity-100 bg-amber-900/10"></div>

                    {p.image ? (
                      <LazyImage
                        src={p.image}
                        alt={p.name}
                        className={`w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-110 ${p.stock <= 0 ? 'grayscale opacity-50' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <ShoppingBag size={48} />
                      </div>
                    )}

                    {/* Hover Overlay Info */}
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-8 group-hover:translate-y-0">
                      <div className="bg-white/95 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 transform active:scale-95 transition-transform">
                        <Eye size={20} className="text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-900">Discover Artifact</span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-30 pointer-events-none">
                      {p.stock <= 0 ? (
                        <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl border border-white/20">Archived</span>
                      ) : p.stock <= 3 && (
                        <span className="bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl">Limited Reserve</span>
                      )}

                      {p.category && (
                        <span className="bg-white/95 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-xl text-gray-900">
                          {categories.find(c => c.id === p.category)?.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="pt-10 px-6 flex flex-col flex-1 pb-6">
                    <div className="flex-1 mb-8 text-center md:text-left">
                      <h3
                        className="font-black text-2xl text-gray-900 leading-none uppercase tracking-tighter mb-3 cursor-pointer group-hover:text-amber-600 transition-colors"
                        onClick={() => setSelectedProduct(p)}
                      >
                        {p.name}
                      </h3>
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                        <span className="h-0.5 w-8 bg-amber-500 rounded-full opacity-50"></span>
                        <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{p.subcategory || "Imperial Collection"}</span>
                      </div>
                      <p className="text-3xl font-light text-gray-900 tracking-tighter">
                        ₵{p.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.stock <= 0}
                        className="flex-1 h-16 rounded-[24px] font-black text-xs uppercase tracking-[3px] transition-all relative overflow-hidden group/btn disabled:bg-gray-50 disabled:text-gray-200 border-2 border-transparent hover:shadow-2xl active:scale-95"
                        style={{ backgroundColor: p.stock > 0 ? siteContent.primaryColor : undefined, color: p.stock > 0 ? 'white' : undefined }}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <ShoppingBag size={16} /> Commission Artifact
                        </span>
                        <div className="absolute inset-0 bg-black opacity-0 group-hover/btn:opacity-20 transition-opacity"></div>
                      </button>

                      <button
                        onClick={() => handleSingleBuy(p)}
                        disabled={p.stock <= 0}
                        className="w-16 h-16 rounded-[24px] bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all shadow-xl shadow-green-200 disabled:bg-gray-50 disabled:text-gray-200 active:scale-95"
                        title="Liaise via WhatsApp"
                      >
                        <Smartphone size={24} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* EMPTY STATE */}
            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-40 text-center"
              >
                <div className="w-40 h-40 bg-gray-50 rounded-[64px] flex items-center justify-center mx-auto mb-10 border border-gray-100 shadow-inner group">
                  <Search className="text-gray-200 group-hover:scale-110 group-hover:text-amber-500 transition-all duration-700" size={64} />
                </div>
                <h4 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">No Royal Correspondence</h4>
                <p className="text-gray-400 font-bold max-w-sm mx-auto mb-12">The archives are vast, but your current selection yielded no results. Please adjust your criteria.</p>
                <button
                  onClick={clearFilters}
                  className="bg-gray-900 text-white px-12 py-5 rounded-full text-xs font-black uppercase tracking-[4px] hover:bg-black transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95"
                >
                  Explore All Archives
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
