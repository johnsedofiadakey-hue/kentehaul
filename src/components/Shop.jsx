import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, Smartphone, Eye, ChevronDown, X, ArrowRight, Grid3X3, Filter, LayoutGrid, Heart, Share2 } from 'lucide-react';
import { SHOP_CATEGORIES } from '../data/constants';
import { LazyImage } from './UIComponents';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from './SEO';

export default function Shop({
  products,
  categories: categoriesProp,
  currentCategory,
  searchQuery,
  setSearchQuery,
  addToCart,
  handleSingleBuy,
  setSelectedProduct,
  siteContent,
  wishlist = [],
  toggleWishlist
}) {
  // Categories come from App.jsx's shared listener — no per-mount Firestore read needed
  const categories = (categoriesProp && categoriesProp.length > 0) ? categoriesProp : SHOP_CATEGORIES;
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || currentCategory || null);
  const [activeSubcategory, setActiveSubcategory] = useState(searchParams.get('sub') || null);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'large'

  // Sync with external category prop or URL params
  useEffect(() => {
    const cat = searchParams.get('category');
    const sub = searchParams.get('sub');
    const search = searchParams.get('search');
    if (cat) setActiveCategory(cat);
    if (sub) setActiveSubcategory(sub);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  const updateCategory = (id) => {
    setActiveCategory(id);
    setActiveSubcategory(null);
    setSearchParams(prev => {
      if (id) prev.set('category', id);
      else prev.delete('category');
      prev.delete('sub');
      return prev;
    });
  };

  const updateSubcategory = (sub) => {
    setActiveSubcategory(sub);
    setSearchParams(prev => {
      if (sub) prev.set('sub', sub);
      else prev.delete('sub');
      return prev;
    });
  };

  const selectedCatData = useMemo(() => categories.find(c => c.id === activeCategory), [categories, activeCategory]);

  // Filter + Sort Logic
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = products.filter(p => {
      const cat = categories.find(c => c.id === p.category);
      const matchesSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.longHistory || '').toLowerCase().includes(query) ||
        (p.color || '').toLowerCase().includes(query) ||
        (p.symbolism || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query) ||
        (cat?.name || '').toLowerCase().includes(query) ||
        (p.subcategory || '').toLowerCase().includes(query);

      return (activeCategory === 'sales' ? (p.isFlashSale || (p.originalPrice > p.price)) : (!activeCategory || p.category === activeCategory)) &&
        (!activeSubcategory || p.subcategory === activeSubcategory) &&
        matchesSearch;
    });

    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else if (sortBy === 'newest') result = [...result].sort((a, b) => (b.date || 0) - (a.date || 0));
    else if (sortBy === 'stock') result = [...result].sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0));

    return result;
  }, [products, categories, activeCategory, activeSubcategory, searchQuery, sortBy]);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const clearFilters = () => {
    setActiveCategory(null);
    setActiveSubcategory(null);
    setSearchQuery('');
    setSortBy('default');
  };

  const handleShare = async (e, p) => {
    e.stopPropagation();
    if (!p || !p.id) return;
    const url = `${window.location.origin}/shop?product=${p.id}`;
    const text = `Check out ${p.name || 'this piece'} on KenteHaul! ₵${(p.price || 0).toLocaleString()}`;
    if (navigator.share) {
      try { await navigator.share({ title: p.name, text, url }); }
      catch (err) { console.warn("Share failed", err); }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        alert("Link copied to clipboard!");
      } catch (err) { console.error("Copy failed", err); }
    }
  };

  const hasActiveFilters = activeCategory || activeSubcategory || searchQuery || sortBy !== 'default';

  const suggestedProducts = useMemo(() => {
    // If we have an active category, suggest products from OTHER categories
    // If not, just suggest some random top products
    const pool = activeCategory 
      ? products.filter(p => p.category !== activeCategory && p.stockQuantity > 0)
      : products.filter(p => p.stockQuantity > 0);
    
    return pool.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [products, activeCategory]);

  const activeCategoryLabel = activeCategory === 'sales'
    ? (siteContent?.flashSaleTitle || 'Sale')
    : activeCategory
      ? selectedCatData?.name
      : 'Shop All';

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#211b17]">
      <SEO 
        title="Shop Authentic Kente Cloth | KenteHaul Collection"
        description="Browse our exclusive collection of hand-woven Ghanaian Kente cloth. Authentic designs for every royal occasion."
        ogTitle="Royal Kente Collection | Shop KenteHaul"
        ogDescription="Exclusive hand-woven Ghanaian Kente. Authentic, vibrant, and royal."
        canonicalPath="/shop"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "KenteHaul Royal Collection",
          "description": "Authentic hand-woven Ghanaian Kente cloth collection.",
          "url": typeof window !== 'undefined' ? window.location.origin + "/shop" : "",
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": products.slice(0, 10).map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": typeof window !== 'undefined' ? window.location.origin + "/shop" : "",
              "name": p.name,
              "image": p.image,
              "offers": {
                "@type": "Offer",
                "price": p.price,
                "priceCurrency": "GHS",
                "availability": (p.stockQuantity > 0 || p.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
              }
            }))
          }
        }}
      />
      {/* Dynamic Header Banner */}
      <div className="relative flex min-h-[46vh] items-end overflow-hidden bg-[#211b17] px-5 pb-12 pt-28 text-[#fff8ed] sm:px-8 lg:px-10">
        <div className="absolute inset-0 z-0">
          <img
            src={selectedCatData?.image || siteContent?.heroImage || "https://images.unsplash.com/photo-1590666014404-5f50ba56008d?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=1200"}
            className="h-full w-full object-cover opacity-70"
            alt="KenteHaul collection banner"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(33,27,23,0.88),rgba(33,27,23,0.48)_55%,rgba(33,27,23,0.18)),linear-gradient(0deg,rgba(33,27,23,0.84),rgba(33,27,23,0)_52%)]"></div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-5 text-[11px] font-black uppercase tracking-[0.32em] text-[#d9b05d]"
          >
            Collections / {activeCategoryLabel}
          </motion.div>
          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="kh-display max-w-4xl text-6xl font-semibold leading-[0.9] md:text-8xl"
          >
            {activeCategoryLabel}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mt-6 max-w-2xl text-base leading-7 text-[#f8f1e6]/75 md:text-lg"
          >
            A focused edit of Ghanaian cloth, smocks, sashes, and ceremony-ready pieces, presented with space for texture, pattern, and meaning.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 md:py-10 px-4 sm:px-6">

        {/* ACTION BAR: Filters, Sorting, Search */}
        <div className="sticky top-[72px] md:top-20 z-40 mb-6 flex flex-col items-center justify-between gap-3 border-b border-[#211b17]/10 bg-[#f8f1e6]/95 px-2 py-4 backdrop-blur-md md:mb-10 md:flex-row">

          {/* Left: View Controls & Count */}
          <div className="flex items-center gap-6 order-2 md:order-1">
            <div className="hidden items-center gap-1 border border-[#211b17]/10 bg-[#fffaf1] p-1 sm:flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-[#211b17] text-[#fff8ed]' : 'text-[#5f554d] hover:text-[#211b17]'}`}
                aria-label="Compact grid"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('large')}
                className={`p-2 transition-all ${viewMode === 'large' ? 'bg-[#211b17] text-[#fff8ed]' : 'text-[#5f554d] hover:text-[#211b17]'}`}
                aria-label="Editorial grid"
              >
                <Grid3X3 size={18} />
              </button>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#5f554d]">
              <span className="text-[#211b17]">{filteredProducts.length}</span> Pieces Found
            </p>
          </div>

          {/* Right: Sort & Search */}
          <div className="flex items-center gap-3 w-full md:w-auto order-1 md:order-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b88a2b]" size={16} />
              <input
                type="text"
                placeholder="Search the archive..."
                className="w-full border border-[#211b17]/10 bg-[#fffaf1] py-3 pl-12 pr-4 text-sm font-bold text-[#211b17] outline-none transition-all focus:ring-2 focus:ring-[#b88a2b]/30"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative group">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full cursor-pointer appearance-none bg-[#211b17] px-6 py-3 pr-12 text-[11px] font-black uppercase tracking-[0.18em] text-[#fff8ed] transition-colors hover:bg-[#3a2b22] md:w-auto"
              >
                <option value="default">Sort: Recommended</option>
                <option value="newest">Latest Release</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#fff8ed]/50 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
              className={`border p-3 transition-all md:hidden ${showFilters ? 'border-[#b88a2b] bg-[#b88a2b] text-[#211b17]' : 'border-[#211b17]/10 bg-[#fffaf1] text-[#211b17]'}`}
            >
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* MAIN SHOP SECTION */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

            {/* MOBILE FILTERS TOGGLE - Floating or Sticky */}
            {/* MOBILE CATEGORY SCROLL */}
            <div className="lg:hidden -mx-4 px-4 mb-6 overflow-x-auto scrollbar-hide flex gap-2 pb-2">
              <button
                onClick={() => updateCategory(null)}
                className={`flex-shrink-0 border px-6 py-3 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${!activeCategory ? 'border-[#211b17] bg-[#211b17] text-[#fff8ed]' : 'border-[#211b17]/10 bg-[#fffaf1] text-[#5f554d]'}`}
              >
                All Archives
              </button>
              {siteContent?.flashSaleEnabled && (
                <button
                  onClick={() => updateCategory('sales')}
                  className={`flex-shrink-0 border px-6 py-3 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${activeCategory === 'sales' ? 'border-[#a24f32] bg-[#a24f32] text-white' : 'border-[#211b17]/10 bg-[#fffaf1] text-[#5f554d]'}`}
                >
                  {siteContent?.flashSaleTitle || "Flash Sale"}
                </button>
              )}
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => updateCategory(cat.id)}
                  className={`flex-shrink-0 border px-6 py-3 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${activeCategory === cat.id ? 'border-[#211b17] bg-[#211b17] text-[#fff8ed]' : 'border-[#211b17]/10 bg-[#fffaf1] text-[#5f554d]'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="lg:hidden sticky top-20 z-30 mb-8">
              <div className="flex items-center justify-between border border-[#211b17]/10 bg-[#fffaf1]/90 px-4 py-3 shadow-sm backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] leading-none text-[#a24f32]">Discovery</span>
                  <span className="text-sm font-black uppercase tracking-[0.08em] text-[#211b17]">Filters & View</span>
                </div>
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="bg-[#211b17] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#fff8ed] shadow-md transition-all active:scale-95"
                >
                  Refine
                </button>
              </div>
            </div>
            {/* Sidebar Filters (Desktop) / Collapsible (Mobile) */}
            <div className={`w-full md:w-[260px] flex-shrink-0 space-y-10 ${showFilters ? 'block' : 'hidden md:block'}`}>

              {/* CATEGORIES SECTION */}
              <div className="space-y-4">
                <h3 className="border-b border-[#211b17]/10 pb-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#a24f32]">Collections</h3>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => updateCategory(null)}
                    className={`px-4 py-3 text-left text-sm font-black transition-all ${!activeCategory ? 'translate-x-1 bg-[#211b17] text-[#fff8ed] shadow-xl' : 'text-[#5f554d] hover:bg-[#fffaf1]'}`}
                  >
                    All Archives
                  </button>
                {siteContent?.flashSaleEnabled && (
                  <button
                    onClick={() => updateCategory('sales')}
                    className={`px-4 py-3 text-left text-sm font-black transition-all ${activeCategory === 'sales' ? 'translate-x-1 bg-[#a24f32] text-white shadow-xl' : 'text-[#5f554d] hover:bg-[#fffaf1]'}`}
                  >
                    {siteContent?.flashSaleTitle || "Flash Sale"}
                  </button>
                )}
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => updateCategory(cat.id)}
                      className={`px-4 py-3 text-left text-sm font-black transition-all ${activeCategory === cat.id ? 'translate-x-1 bg-[#211b17] text-[#fff8ed] shadow-xl' : 'text-[#5f554d] hover:bg-[#fffaf1]'}`}
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
                    <h3 className="border-b border-[#211b17]/10 pb-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#a24f32]">Style Variation</h3>
                    <div className="flex flex-wrap md:flex-col gap-2">
                      <button
                        onClick={() => updateSubcategory(null)}
                        className={`border px-4 py-3 text-xs font-black transition-all ${!activeSubcategory ? 'border-[#b88a2b] bg-[#b88a2b]/10 text-[#7a5416]' : 'border-[#211b17]/10 text-[#5f554d] hover:border-[#b88a2b]/50'}`}
                      >
                        All {selectedCatData.name}
                      </button>
                      {selectedCatData.subcategories.map(sub => (
                        <button
                          key={sub}
                          onClick={() => updateSubcategory(sub)}
                          className={`border px-4 py-3 text-xs font-black transition-all ${activeSubcategory === sub ? 'border-[#b88a2b] bg-[#b88a2b]/10 text-[#7a5416]' : 'border-[#211b17]/10 text-[#5f554d] hover:border-[#b88a2b]/50'}`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MOBILE FILTERS DRAWER */}
              <AnimatePresence>
                {isMobileFiltersOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="fixed right-0 top-0 z-[101] h-full w-[85%] max-w-sm overflow-y-auto bg-[#f8f1e6] p-8 shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-10">
                        <h2 className="kh-display text-3xl font-semibold text-[#211b17]">Filters</h2>
                        <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 text-[#5f554d] transition-colors hover:bg-[#fffaf1]" aria-label="Close filters">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="space-y-12">
                        {/* Categories Mobile */}
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-[#a24f32]">Collections</h3>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => { setActiveCategory(null); setActiveSubcategory(null); setIsMobileFiltersOpen(false); }}
                              className={`px-5 py-4 text-left text-sm font-bold transition-all ${!activeCategory ? 'bg-[#211b17] text-[#fff8ed]' : 'bg-[#fffaf1] text-[#5f554d]'}`}
                            >
                              All Archives
                            </button>
                            {siteContent?.flashSaleEnabled && (
                              <button
                                onClick={() => { setActiveCategory('sales'); setActiveSubcategory(null); setIsMobileFiltersOpen(false); }}
                                className={`px-5 py-4 text-left text-sm font-bold transition-all ${activeCategory === 'sales' ? 'bg-[#a24f32] text-white' : 'bg-[#fffaf1] text-[#5f554d]'}`}
                              >
                                {siteContent?.flashSaleTitle || "Flash Sale"}
                              </button>
                            )}
                            {categories.map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => { setActiveCategory(cat.id); setActiveSubcategory(null); setIsMobileFiltersOpen(false); }}
                                className={`px-5 py-4 text-left text-sm font-bold transition-all ${activeCategory === cat.id ? 'bg-[#211b17] text-[#fff8ed]' : 'bg-[#fffaf1] text-[#5f554d]'}`}
                              >
                                {cat.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Subcategories Mobile */}
                        {selectedCatData?.subcategories.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-[#a24f32]">Style</h3>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => { setActiveSubcategory(null); setIsMobileFiltersOpen(false); }}
                                className={`px-5 py-4 text-left text-sm font-bold transition-all ${!activeSubcategory ? 'bg-[#b88a2b] text-[#211b17]' : 'bg-[#fffaf1] text-[#5f554d]'}`}
                              >
                                All Styles
                              </button>
                              {selectedCatData.subcategories.map(sub => (
                                <button
                                  key={sub}
                                  onClick={() => { setActiveSubcategory(sub); setIsMobileFiltersOpen(false); }}
                                  className={`px-5 py-4 text-left text-sm font-bold transition-all ${activeSubcategory === sub ? 'bg-[#b88a2b] text-[#211b17]' : 'bg-[#fffaf1] text-[#5f554d]'}`}
                                >
                                  {sub}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => { clearFilters(); setIsMobileFiltersOpen(false); }}
                          className="w-full border border-red-200 py-4 text-xs font-black uppercase tracking-[0.22em] text-red-600 transition-colors hover:bg-red-50"
                        >
                          Reset Selection
                        </button>
                      </div>
                    </motion.div>
                  </>
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
            <div className={`flex-1 grid gap-3 sm:gap-8 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {/* Skeleton loading — shown while products haven't loaded yet */}
              {products.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col animate-pulse">
                  <div className="aspect-[4/5] bg-[#efe2cf] shimmer" />
                  <div className="pt-4 px-2 space-y-2">
                    <div className="h-2.5 bg-[#efe2cf] w-1/3 shimmer" />
                    <div className="h-4 bg-[#efe2cf] w-3/4 shimmer" />
                    <div className="h-4 bg-[#efe2cf] w-1/2 shimmer" />
                    <div className="h-10 bg-[#efe2cf] mt-4 shimmer" />
                  </div>
                </div>
              ))}
              <AnimatePresence mode='popLayout'>
                {filteredProducts.map((p, idx) => {
                  const isSaved = p.id && (wishlist || []).some(item => item.id === p.id);
                  const categoryName = categories.find(c => c.id === p.category)?.name;
                  const price = siteContent?.flashSaleEnabled ? p.price : (p.originalPrice || p.price);

                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96, y: 32 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.3 } }}
                      transition={{
                        duration: 0.7,
                        delay: (idx % 6) * 0.04,
                        ease: [0.22, 1, 0.36, 1],
                        layout: { duration: 0.45 }
                      }}
                      className="group relative flex h-full flex-col border border-[#211b17]/10 bg-[#fffaf1]"
                    >
                      <div
                        className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-[#efe2cf] transition-all duration-700 group-hover:shadow-[0_30px_90px_rgba(33,27,23,0.18)]"
                        onClick={() => setSelectedProduct(p)}
                      >
                        <div className="absolute inset-0 z-10 bg-[#a24f32]/0 transition-colors duration-700 group-hover:bg-[#a24f32]/10"></div>

                        {p.image ? (
                          <LazyImage
                            src={p.image}
                            alt={p.name}
                            className={`h-full w-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-105 ${p.stockQuantity <= 0 ? 'grayscale opacity-50' : ''}`}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center kh-woven-grid text-[#b88a2b]">
                            <ShoppingBag size={48} />
                          </div>
                        )}

                        <div className="absolute inset-x-3 bottom-3 z-20 flex translate-y-3 flex-col gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                          {p.stockQuantity > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                              className="flex w-full items-center justify-center gap-2 bg-[#fffaf1]/95 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#211b17] shadow-2xl backdrop-blur-md transition hover:bg-white active:scale-95"
                            >
                              <ShoppingBag size={14} className="text-[#b88a2b]" />
                              Quick Add
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}
                            className="flex w-full items-center justify-center gap-2 bg-[#211b17]/80 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#fff8ed] backdrop-blur-md transition hover:bg-[#211b17] active:scale-95"
                          >
                            <Eye size={14} />
                            View Details
                          </button>
                        </div>

                        <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 flex flex-row flex-wrap gap-2">
                          {p.stockQuantity <= 0 ? (
                            <span className="border border-white/30 bg-red-700/80 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md md:text-[10px]">Sold Out</span>
                          ) : p.stockQuantity <= 3 && (
                            <span className="border border-white/30 bg-[#b88a2b]/90 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#211b17] backdrop-blur-md md:text-[10px]">Low Stock</span>
                          )}
                          {siteContent?.flashSaleEnabled && (p.isFlashSale || (p.originalPrice > p.price)) && (
                            <span className="border border-white/30 bg-[#a24f32]/90 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md md:text-[10px]">
                              {siteContent?.flashSaleTitle || "Sale"}
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleWishlist && toggleWishlist(p); }}
                            className="bg-[#fffaf1]/90 p-2 text-[#5f554d] shadow-lg backdrop-blur-md transition hover:scale-110 hover:text-red-500 active:scale-95"
                            aria-label="Save item"
                          >
                            <Heart
                              size={16}
                              fill={isSaved ? '#ef4444' : 'none'}
                              className={isSaved ? 'text-red-500' : ''}
                            />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShare(e, p); }}
                            className="bg-[#fffaf1]/90 p-2 text-[#5f554d] shadow-lg backdrop-blur-md transition hover:scale-110 hover:text-[#243f2c] active:scale-95"
                            aria-label="Share item"
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col px-3 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5">
                        <div className="mb-4 flex-1 text-left md:mb-6">
                          {p.category && (
                            <div className="mb-2">
                              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#a24f32] md:text-[10px]">
                                {categoryName || p.category}
                              </span>
                            </div>
                          )}
                          <h3
                            className="kh-display mb-2 cursor-pointer text-2xl font-semibold leading-none text-[#211b17] transition-colors group-hover:text-[#a24f32] md:text-3xl"
                            onClick={() => setSelectedProduct(p)}
                          >
                            {p.name}
                          </h3>
                          <div className="mb-3 flex items-center gap-2">
                            <span className="h-[1px] w-7 bg-[#b88a2b] opacity-60"></span>
                            <span className="line-clamp-1 text-[8px] font-bold uppercase tracking-[0.22em] text-[#5f554d] md:text-[10px]">{p.subcategory || "Traditional Heritage"}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-lg font-semibold text-[#211b17] md:text-2xl">
                              ₵{Number(price || 0).toLocaleString()}
                            </p>
                            {siteContent?.flashSaleEnabled && (p.originalPrice > p.price) && (
                              <p className="text-sm font-light text-[#8f8276] line-through md:text-base">
                                ₵{p.originalPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 md:gap-3">
                          <button
                            onClick={() => addToCart(p)}
                            disabled={p.stockQuantity <= 0}
                            className="kh-thread flex h-11 flex-1 items-center justify-center gap-2 overflow-hidden bg-[#211b17] px-3 text-[8px] font-black uppercase tracking-[0.18em] text-[#fff8ed] transition hover:-translate-y-0.5 hover:bg-[#3a2b22] active:scale-95 disabled:bg-[#d8c9b7] disabled:text-[#8a7a68] md:h-14 md:text-[10px]"
                          >
                            <ShoppingBag size={13} />
                            Buy Now
                          </button>

                          <button
                            onClick={() => handleSingleBuy(p)}
                            disabled={p.stockQuantity <= 0}
                            className="flex h-11 w-11 items-center justify-center bg-[#243f2c] text-[#fff8ed] shadow-lg shadow-[#243f2c]/15 transition hover:-translate-y-0.5 hover:bg-[#315b3d] active:scale-95 disabled:bg-[#d8c9b7] disabled:text-[#8a7a68] md:h-14 md:w-14"
                            title="Buy via WhatsApp"
                          >
                            <Smartphone size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* EMPTY STATE */}
              {filteredProducts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full py-40 text-center"
                >
                  <div className="mx-auto mb-10 flex h-32 w-32 items-center justify-center border border-[#211b17]/10 bg-[#fffaf1] shadow-inner group">
                    <Search className="text-[#b88a2b] transition-all duration-700 group-hover:scale-110" size={48} />
                  </div>
                  <h4 className="kh-display mb-4 text-4xl font-semibold text-[#211b17]">No pieces found</h4>
                  <p className="mx-auto mb-12 max-w-sm font-medium leading-7 text-[#5f554d]">Try a wider collection, a different style, or a simpler search term.</p>
                  <button
                    onClick={clearFilters}
                    className="bg-[#211b17] px-12 py-5 text-xs font-black uppercase tracking-[0.24em] text-[#fff8ed] shadow-[0_20px_40px_rgba(33,27,23,0.12)] transition-all hover:bg-[#3a2b22] active:scale-95"
                  >
                    Explore All Archives
                  </button>
                </motion.div>
              )}
            </div>
          </div>          {/* SUGGESTED COLLECTIONS (Discover More) */}
          {suggestedProducts.length > 0 && (
            <div className="mt-32 border-t border-[#211b17]/10 pt-20">
              <div className="text-center mb-16">
                <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-[#a24f32]">Discover More</h3>
                <h2 className="kh-display text-5xl font-semibold leading-none text-[#211b17]">More from the archive</h2>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedProducts.map(p => (
                  <div 
                    key={p.id} 
                    className="group cursor-pointer"
                    onClick={() => setSelectedProduct(p)}
                  >
                    <div className="relative mb-6 aspect-[4/5] overflow-hidden bg-[#efe2cf]">
                      <img 
                        src={p.image} 
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={p.name} 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <h4 className="kh-display mb-1 text-2xl font-semibold leading-none text-[#211b17]">{p.name}</h4>
                    <p className="text-xs font-black text-[#a24f32]">₵{p.price?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
