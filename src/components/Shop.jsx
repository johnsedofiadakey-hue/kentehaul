import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Smartphone, Eye, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SHOP_CATEGORIES } from '../data/constants';
import { LazyImage } from '../UIComponents';

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

  const selectedCatData = categories.find(c => c.id === activeCategory);

  // Filter + Sort Logic
  let filteredProducts = products.filter(p =>
    (!activeCategory || p.category === activeCategory) &&
    (!activeSubcategory || p.subcategory === activeSubcategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (sortBy === 'price-asc') filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  if (sortBy === 'newest') filteredProducts = [...filteredProducts].sort((a, b) => (b.date || 0) - (a.date || 0));
  if (sortBy === 'stock') filteredProducts = [...filteredProducts].sort((a, b) => b.stock - a.stock);

  const clearFilters = () => {
    setActiveCategory(null);
    setActiveSubcategory(null);
    setSearchQuery('');
    setSortBy('default');
  };

  const hasActiveFilters = activeCategory || activeSubcategory || searchQuery || sortBy !== 'default';

  return (
    <div className="max-w-7xl mx-auto py-6 md:py-12 px-4 sm:px-6 animate-fade-in min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: siteContent.primaryColor }}>
          {activeCategory ? categories.find(c => c.id === activeCategory)?.name : "All Collections"}
        </h1>
        <div className="h-1 w-16 mt-2 rounded-full" style={{ backgroundColor: siteContent.secondaryColor }}></div>
        <p className="text-gray-500 text-sm mt-2">{filteredProducts.length} items available</p>
      </div>

      {/* MOBILE: Filter Toggle Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm shadow-sm w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} />
            Filter & Search
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
          </div>
          <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* FILTER BAR — Desktop always visible, Mobile collapsible */}
      <div className={`mb-8 space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 md:py-3 border rounded-2xl bg-white focus:ring-2 outline-none text-base shadow-sm"
            style={{ '--tw-ring-color': siteContent.primaryColor + '40' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Pills — scrollable row on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => { setActiveCategory(null); setActiveSubcategory(null); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${!activeCategory ? 'text-white shadow-lg border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            style={!activeCategory ? { backgroundColor: siteContent.primaryColor } : {}}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(activeCategory === cat.id ? null : cat.id); setActiveSubcategory(null); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${activeCategory === cat.id ? 'text-white shadow-lg border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              style={activeCategory === cat.id ? { backgroundColor: siteContent.primaryColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategory Pills (if category selected and has subcategories) */}
        {selectedCatData?.subcategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pl-2">
            <button
              onClick={() => setActiveSubcategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${!activeSubcategory ? 'text-white border-transparent' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
              style={!activeSubcategory ? { backgroundColor: siteContent.secondaryColor } : {}}
            >
              All {selectedCatData.name}
            </button>
            {selectedCatData.subcategories.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${activeSubcategory === sub ? 'text-white border-transparent' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                style={activeSubcategory === sub ? { backgroundColor: siteContent.secondaryColor } : {}}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Sort + Clear row */}
        <div className="flex items-center justify-between gap-4">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold appearance-none shadow-sm focus:outline-none flex-1 md:flex-none md:w-48"
          >
            <option value="default">Sort: Default</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock">Most In Stock</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Product Grid — 2 cols on mobile, 3 on tablet, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map(p => (
          <div
            key={p.id}
            className="bg-white rounded-2xl md:rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-1 active:scale-98 transition duration-300 overflow-hidden border border-gray-100 group relative flex flex-col h-full"
          >
            {/* Image */}
            <div
              className="aspect-[4/5] bg-gray-50 relative overflow-hidden cursor-pointer"
              onClick={() => setSelectedProduct(p)}
            >
              {p.image ? (
                <LazyImage
                  src={p.image}
                  alt={p.name}
                  className={`w-full h-full object-cover transition duration-700 group-hover:scale-105 ${p.stock <= 0 ? 'grayscale opacity-50' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ShoppingBag size={32} />
                </div>
              )}

              {/* View overlay — hidden on mobile (tap is enough) */}
              <div className="hidden md:flex absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
                <div className="bg-white/90 backdrop-blur text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Eye size={16} /> View Details
                </div>
              </div>

              {/* Subcategory badge */}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-sm px-2 py-1 text-[10px] font-bold rounded-full uppercase" style={{ color: siteContent.primaryColor }}>
                {p.subcategory || categories.find(c => c.id === p.category)?.name || 'Classic'}
              </div>

              {/* Sold out */}
              {p.stock <= 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-xs transform -rotate-12 border-2 border-white">SOLD OUT</span>
                </div>
              )}

              {/* Low stock badge */}
              {p.stock > 0 && p.stock <= 3 && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 text-[10px] font-bold rounded-full">
                  Only {p.stock} left!
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 md:p-5 flex flex-col flex-grow">
              <div className="flex-grow mb-3">
                <h3
                  className="font-bold text-sm md:text-base leading-tight cursor-pointer"
                  onClick={() => setSelectedProduct(p)}
                >
                  {p.name}
                </h3>
                <p className="font-bold text-base md:text-xl mt-1" style={{ color: siteContent.secondaryColor }}>
                  ₵{p.price.toLocaleString()}
                </p>
              </div>

              {/* Action Buttons — bigger touch targets on mobile */}
              <div className="flex gap-2">
                <button
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className="flex-1 text-white py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 disabled:bg-gray-300 text-sm"
                  style={{ backgroundColor: p.stock > 0 ? siteContent.primaryColor : undefined }}
                >
                  <ShoppingBag size={15} />
                  <span className="hidden sm:inline">Add to </span>Cart
                </button>
                <button
                  onClick={() => handleSingleBuy(p)}
                  disabled={p.stock <= 0}
                  title="Buy via WhatsApp"
                  className="p-3 bg-green-500 disabled:bg-gray-300 text-white rounded-xl font-bold shadow-md hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center"
                >
                  <Smartphone size={17} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-dashed border-2 border-gray-200 mt-4">
          <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold">No items found.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-black transition-all">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
