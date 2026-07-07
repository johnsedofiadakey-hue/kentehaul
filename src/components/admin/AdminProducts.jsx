import React, { useState, useEffect } from 'react';
import { Edit, Trash2, CheckCircle, Loader2, Tag, AlertCircle, Clock, Star } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from '../../firebase';
import { ImageUpload, useToast, Toast } from '../UIComponents';
import { SHOP_CATEGORIES, FEATURED_PRODUCTS_LIMIT } from '../../data/constants';
import CategoryManagerModal from './CategoryManagerModal';

const INITIAL_PRODUCT_FORM = {
    name: '', price: '', originalPrice: '', stockQuantity: 1, sku: '', category: '', subcategory: '',
    description: '', image: '', isPreorder: false, preorderDays: 14, isFlashSale: false, isFeatured: false
};

export default function AdminProducts({
    products,
    siteContent
}) {
    const [loading, setLoading] = useState(false);
    const [toast, showToast, dismissToast] = useToast();

    // --- DYNAMIC CATEGORIES from Firestore (falls back to constants) ---
    const [categories, setCategories] = useState(SHOP_CATEGORIES);

    // --- STATE: PRODUCTS ---
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState(INITIAL_PRODUCT_FORM);

    // --- STATE: CATEGORY MANAGER MODAL ---
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryModalExpanded, setCategoryModalExpanded] = useState(null);

    const openCategoryModal = (expandCategoryId = null) => {
        setCategoryModalExpanded(expandCategoryId);
        setIsCategoryModalOpen(true);
    };

    // Load categories from Firestore
    useEffect(() => {
        const unsubCats = onSnapshot(doc(db, "settings", "categories"), (snap) => {
            if (snap.exists() && snap.data().list?.length > 0) {
                setCategories(snap.data().list);
            }
        });
        return () => unsubCats();
    }, []);

    const saveProduct = async (e) => {
        e.preventDefault();

        if (!productForm.image) {
            showToast("Please upload a product image first.", "error");
            return;
        }

        const price = Number(productForm.price);
        const originalPrice = productForm.originalPrice === '' ? null : Number(productForm.originalPrice);

        if (!Number.isFinite(price) || price <= 0) {
            showToast("Sale Price must be a valid number greater than 0.", "error");
            return;
        }
        if (productForm.originalPrice !== '' && (!Number.isFinite(originalPrice) || originalPrice < 0)) {
            showToast("Original Price must be a valid number.", "error");
            return;
        }

        // Products sharing a generic name (e.g. "PREORDER") are impossible to tell apart
        // in wishlists, order history, or WhatsApp chats. Nudge toward a unique name.
        const trimmedName = productForm.name.trim();
        const isDuplicateName = products.some(p =>
            p.id !== editingProduct?.id && p.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicateName) {
            const proceed = window.confirm(
                `Another product is already named "${trimmedName}". Customers won't be able to tell them apart in their wishlist or order history.\n\nConsider adding a distinguishing detail (color, style, SKU) to the name.\n\nSave anyway?`
            );
            if (!proceed) return;
        }

        // Only the first FEATURED_PRODUCTS_LIMIT featured products actually show on the homepage —
        // warn rather than silently letting one drop off unexplained.
        if (productForm.isFeatured) {
            const featuredCount = products.filter(p => p.isFeatured && p.id !== editingProduct?.id).length;
            if (featuredCount >= FEATURED_PRODUCTS_LIMIT) {
                const proceed = window.confirm(
                    `${featuredCount} products are already featured, which is the max shown on the homepage (${FEATURED_PRODUCTS_LIMIT}). This one won't display until you un-feature another.\n\nSave anyway?`
                );
                if (!proceed) return;
            }
        }

        setLoading(true);
        try {
            const sanitizedProduct = {
                ...productForm,
                name: trimmedName,
                price,
                originalPrice,
                stockQuantity: Number(productForm.stockQuantity),
                date: Date.now()
            };

            if (editingProduct) {
                await updateDoc(doc(db, "products", editingProduct.id), sanitizedProduct);
                setEditingProduct(null);
            } else {
                await addDoc(collection(db, "products"), sanitizedProduct);
            }

            setProductForm(INITIAL_PRODUCT_FORM);
            showToast(editingProduct ? "Product updated!" : "Added to shop!");
        } catch (error) {
            console.error("Product Save Error:", error);
            showToast(`Failed to save product: ${error.message}`, "error");
        }
        setLoading(false);
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("Delete this item permanently?")) return;
        try {
            await deleteDoc(doc(db, "products", id));
            showToast("Product deleted.");
        } catch (e) { showToast("Could not delete product.", "error"); }
    };

    const startEditProduct = (p) => {
        setEditingProduct(p);
        setProductForm({
            ...INITIAL_PRODUCT_FORM,
            ...p,
            price: p.price ?? '',
            originalPrice: p.originalPrice ?? '',
            stockQuantity: p.stockQuantity ?? p.stock ?? 0,
            isPreorder: p.isPreorder ?? false,
            preorderDays: p.preorderDays ?? 14,
            isFlashSale: p.isFlashSale ?? false,
            isFeatured: p.isFeatured ?? false
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingProduct(null);
        setProductForm(INITIAL_PRODUCT_FORM);
    };

    const selectedCategory = categories.find(c => c.id === productForm.category);

    return (
        <div className="space-y-10 animate-fade-in-up">
            <Toast toast={toast} onDone={dismissToast} />

            <CategoryManagerModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                categories={categories}
                setCategories={setCategories}
                products={products}
                initialExpandedCategory={categoryModalExpanded}
                showToast={showToast}
            />

            {/* Product Form */}
            <div className="bg-white p-6 sm:p-10 md:p-12 rounded-[50px] shadow-2xl border border-gray-50">
                <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
                    <h3 className="font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
                        {editingProduct ? 'Update Inventory Item' : 'Register New Asset'}
                    </h3>
                    <button
                        type="button"
                        onClick={() => openCategoryModal(null)}
                        className="flex items-center gap-2 text-xs font-black text-purple-600 bg-purple-50 px-4 py-2.5 rounded-2xl hover:bg-purple-100 transition-all"
                    >
                        <Tag size={14} /> Category Manager
                        <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">{categories.length}</span>
                    </button>
                </div>
                <form onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                        <ImageUpload image={productForm.image} onUpload={img => setProductForm({ ...productForm, image: img })} label="High Resolution Product Image" primaryColor={siteContent?.primaryColor} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product Title <span className="text-red-400">*</span></label>
                        <input required placeholder="Enter name" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Original Price (₵)</label>
                            <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={productForm.originalPrice} onChange={e => setProductForm({ ...productForm, originalPrice: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sale Price (₵) <span className="text-red-400">*</span></label>
                            <input required type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Stock Qty <span className="text-red-400">*</span></label>
                            <input required placeholder="Qty" type="number" min="0" step="1" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={productForm.stockQuantity} onChange={e => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-rose-50/50 p-6 rounded-[30px] border border-rose-100/50 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, isFlashSale: !productForm.isFlashSale })}
                            className={`w-14 h-8 rounded-full transition-all relative flex-shrink-0 ${productForm.isFlashSale ? 'bg-rose-500' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${productForm.isFlashSale ? 'left-7' : 'left-1'}`} />
                        </button>
                        <div>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Include in Flash Sale</p>
                            <p className="text-[10px] text-gray-500 font-bold">This item will appear in the sales section on the home page. Only takes effect while the site-wide Flash Sale is turned on in Settings.</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-amber-50/50 p-6 rounded-[30px] border border-amber-100/50 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, isFeatured: !productForm.isFeatured })}
                            className={`w-14 h-8 rounded-full transition-all relative flex-shrink-0 ${productForm.isFeatured ? 'bg-amber-500' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${productForm.isFeatured ? 'left-7' : 'left-1'}`} />
                        </button>
                        <div>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Star size={12} className="text-amber-500" /> Feature on Homepage
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold">
                                Shows in the "Featured Pieces" section right below the hero. Only the first {FEATURED_PRODUCTS_LIMIT} featured products show — currently {products.filter(p => p.isFeatured && p.id !== editingProduct?.id).length + (productForm.isFeatured ? 1 : 0)} of {FEATURED_PRODUCTS_LIMIT} used.
                                {' '}Turn it off in Settings to hide the whole section, or leave nothing featured to show the newest items automatically.
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-amber-50/50 p-6 rounded-[30px] border border-amber-100/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setProductForm({ ...productForm, isPreorder: !productForm.isPreorder })}
                                className={`w-14 h-8 rounded-full transition-all relative flex-shrink-0 ${productForm.isPreorder ? 'bg-amber-500' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${productForm.isPreorder ? 'left-7' : 'left-1'}`} />
                            </button>
                            <div>
                                <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Pre-Order Item</p>
                                <p className="text-[10px] text-gray-500 font-bold">Item will have a weaving lead time.</p>
                            </div>
                        </div>
                        {productForm.isPreorder && (
                            <div className="space-y-2 animate-fade-in">
                                <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} /> Weaving Time (Days)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 14"
                                    className="w-full p-3 bg-white border border-amber-200 rounded-xl font-black text-sm outline-none"
                                    value={productForm.preorderDays}
                                    onChange={e => setProductForm({ ...productForm, preorderDays: Number(e.target.value) })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product SKU</label>
                        <input placeholder="e.g. KNT-001" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category <span className="text-red-400">*</span></label>
                            <button type="button" onClick={() => openCategoryModal(null)} className="text-[10px] text-purple-600 font-black flex items-center gap-1 hover:underline">
                                <Tag size={10} /> Manage Categories
                            </button>
                        </div>
                        <select required className="w-full p-4 bg-gray-50 border rounded-2xl font-bold appearance-none" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value, subcategory: '' })}>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Subcategory <span className="text-gray-300 normal-case">(optional)</span></label>
                            {selectedCategory && (
                                <button type="button" onClick={() => openCategoryModal(selectedCategory.id)} className="text-[10px] text-purple-600 font-black flex items-center gap-1 hover:underline">
                                    Add Sub
                                </button>
                            )}
                        </div>
                        <select className="w-full p-4 bg-gray-50 border rounded-2xl font-bold appearance-none" value={productForm.subcategory} onChange={e => setProductForm({ ...productForm, subcategory: e.target.value })} disabled={!productForm.category}>
                            <option value="">{!productForm.category ? 'Select a category first' : 'Select Subcategory (optional)'}</option>
                            {selectedCategory?.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {productForm.category && selectedCategory?.subcategories.length === 0 && (
                            <p className="text-xs text-amber-600 font-bold flex items-center gap-1">
                                <AlertCircle size={12} /> No subcategories.
                                <button type="button" onClick={() => openCategoryModal(productForm.category)} className="underline ml-1">Add one above.</button>
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Short Description <span className="text-gray-300 normal-case">(optional)</span></label>
                        <textarea placeholder="Quick overview for product details..." className="w-full p-5 bg-gray-50 border rounded-[30px] h-24 font-medium" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                    </div>

                    <div className="md:col-span-2 flex flex-col md:flex-row gap-5 pt-4">
                        <button type="submit" disabled={loading} className="w-full md:flex-1 bg-gray-900 text-white py-5 rounded-[25px] font-black text-lg shadow-2xl hover:bg-black transition-all flex justify-center items-center gap-3 disabled:opacity-60">
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <><CheckCircle size={24} /> {editingProduct ? 'Sync Updates' : 'Add to Shop'}</>}
                        </button>
                        {editingProduct && (
                            <button type="button" onClick={cancelEdit} className="px-10 py-5 bg-white border border-gray-200 text-gray-400 rounded-[25px] font-black hover:text-gray-900 transition-all">Cancel</button>
                        )}
                    </div>
                </form>
            </div>

            {/* Inventory Table */}
            <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
                <h3 className="font-black text-2xl mb-8 text-gray-900 flex items-center justify-between">
                    Master Stock List
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-[4px]">{products.length} Items</span>
                </h3>

                {/* Mobile: stacked cards (a 5-column table doesn't work on a phone screen) */}
                <div className="md:hidden space-y-4">
                    {products.map(p => (
                        <div key={p.id} className="border border-gray-100 rounded-3xl p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-black text-gray-800">{p.name}</p>
                                    <p className="text-xs font-black text-gray-500">{categories.find(c => c.id === p.category)?.name || p.category || '—'}{p.subcategory ? ` · ${p.subcategory}` : ''}</p>
                                </div>
                                <p className="font-black text-gray-600 whitespace-nowrap">₵{p.price}</p>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-col gap-1">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit ${p.stockQuantity <= 0 && !p.isPreorder ? 'bg-black text-white' : p.stockQuantity < 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                        {p.isPreorder ? `Pre-Order (${p.preorderDays || 14}d)` : p.stockQuantity <= 0 ? 'Out of Stock' : `${p.stockQuantity} left`}
                                    </span>
                                    {p.sku && <span className="text-[10px] font-bold text-gray-400">SKU: {p.sku}</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => startEditProduct(p)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 shadow-sm"><Edit size={16} /></button>
                                    <button onClick={() => deleteProduct(p.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 shadow-sm"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop / tablet: full table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-400 uppercase font-black text-[10px] tracking-widest">
                            <tr><th className="p-5">Product</th><th className="p-5">Category</th><th className="p-5">Stock</th><th className="p-5">Price</th><th className="p-5 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-5 font-black text-gray-800">{p.name}</td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-black text-gray-700">{categories.find(c => c.id === p.category)?.name || p.category || '—'}</span>
                                            {p.subcategory && <span className="text-[10px] text-gray-400">{p.subcategory}</span>}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase w-fit ${p.stockQuantity <= 0 && !p.isPreorder ? 'bg-black text-white' : p.stockQuantity < 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                {p.isPreorder ? `Pre-Order (${p.preorderDays || 14}d)` : p.stockQuantity <= 0 ? 'Out of Stock' : `${p.stockQuantity} left`}
                                            </span>
                                            {p.sku && <span className="text-[10px] font-bold text-gray-400">SKU: {p.sku}</span>}
                                        </div>
                                    </td>
                                    <td className="p-5 font-black text-gray-600">₵{p.price}</td>
                                    <td className="p-5 text-right flex justify-end gap-3">
                                        <button onClick={() => startEditProduct(p)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 shadow-sm"><Edit size={18} /></button>
                                        <button onClick={() => deleteProduct(p.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 shadow-sm"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
