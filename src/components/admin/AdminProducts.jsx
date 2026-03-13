import React, { useState, useEffect } from 'react';
import { Camera, MessageCircle, Edit, Trash2, CheckCircle, Loader2, Plus, X, Tag, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { ImageUpload } from '../UIComponents';
import { SHOP_CATEGORIES } from '../../data/constants';

export default function AdminProducts({
    products,
    gallery,
    feedbacks,
    siteContent
}) {
    const [loading, setLoading] = useState(false);

    // --- DYNAMIC CATEGORIES from Firestore (falls back to constants) ---
    const [categories, setCategories] = useState(SHOP_CATEGORIES);

    // --- STATE: PRODUCTS ---
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '', price: '', stock: 1, category: '', subcategory: '',
        description: '', longHistory: '', image: ''
    });

    // --- STATE: CATEGORY MANAGEMENT ---
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSubcategoryInput, setNewSubcategoryInput] = useState({});
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [catSuccess, setCatSuccess] = useState('');

    // --- STATE: GALLERY ---
    const [galleryImage, setGalleryImage] = useState('');

    // --- STATE: FEEDBACK ---
    const [feedbackForm, setFeedbackForm] = useState({
        name: '', text: '', rating: 5, image: ''
    });

    // Load categories from Firestore
    useEffect(() => {
        const unsubCats = onSnapshot(doc(db, "settings", "categories"), (snap) => {
            if (snap.exists() && snap.data().list?.length > 0) {
                setCategories(snap.data().list);
            }
        });
        return () => unsubCats();
    }, []);

    const saveCategoriesToFirestore = async (updatedCats) => {
        await setDoc(doc(db, "settings", "categories"), { list: updatedCats });
    };

    const addCategory = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        const exists = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) { alert("That category already exists."); return; }
        setCategoryLoading(true);
        const newId = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const updated = [...categories, { id: newId, name: trimmed, subcategories: [] }];
        setCategories(updated);
        await saveCategoriesToFirestore(updated);
        setNewCategoryName('');
        setCatSuccess(`Category "${trimmed}" added!`);
        setTimeout(() => setCatSuccess(''), 3000);
        setCategoryLoading(false);
    };

    const deleteCategory = async (catId) => {
        const cat = categories.find(c => c.id === catId);
        const usedBy = products.filter(p => p.category === catId).length;
        if (usedBy > 0) { alert(`Cannot delete "${cat.name}" — ${usedBy} product(s) use this. Reassign them first.`); return; }
        if (!window.confirm(`Delete category "${cat.name}"?`)) return;
        setCategoryLoading(true);
        const updated = categories.filter(c => c.id !== catId);
        setCategories(updated);
        await saveCategoriesToFirestore(updated);
        setCategoryLoading(false);
    };

    const addSubcategory = async (catId) => {
        const val = (newSubcategoryInput[catId] || '').trim();
        if (!val) return;
        const cat = categories.find(c => c.id === catId);
        if (cat.subcategories.map(s => s.toLowerCase()).includes(val.toLowerCase())) { alert("That subcategory already exists."); return; }
        setCategoryLoading(true);
        const updated = categories.map(c => c.id === catId ? { ...c, subcategories: [...c.subcategories, val] } : c);
        setCategories(updated);
        await saveCategoriesToFirestore(updated);
        setNewSubcategoryInput(prev => ({ ...prev, [catId]: '' }));
        setCatSuccess(`"${val}" added to ${cat.name}!`);
        setTimeout(() => setCatSuccess(''), 3000);
        setCategoryLoading(false);
    };

    const deleteSubcategory = async (catId, sub) => {
        const usedBy = products.filter(p => p.category === catId && p.subcategory === sub).length;
        if (usedBy > 0) { alert(`Cannot delete "${sub}" — ${usedBy} product(s) use it.`); return; }
        setCategoryLoading(true);
        const updated = categories.map(c => c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s !== sub) } : c);
        setCategories(updated);
        await saveCategoriesToFirestore(updated);
        setCategoryLoading(false);
    };

    const saveProduct = async (e) => {
        e.preventDefault();

        if (!productForm.image) {
            alert("Please upload a product image first.");
            return;
        }

        setLoading(true);
        try {
            const sanitizedProduct = {
                ...productForm,
                price: Number(productForm.price),
                stock: Number(productForm.stock),
                date: Date.now()
            };

            if (editingProduct) {
                await updateDoc(doc(db, "products", editingProduct.id), sanitizedProduct);
                setEditingProduct(null);
            } else {
                await addDoc(collection(db, "products"), sanitizedProduct);
            }

            setProductForm({ name: '', price: '', stock: 1, category: '', subcategory: '', description: '', longHistory: '', image: '' });
            alert("Inventory updated successfully!");
        } catch (error) {
            console.error("Product Save Error:", error);
            alert(`Failed to save product: ${error.message}`);
        }
        setLoading(false);
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("Delete this item permanently?")) return;
        try { await deleteDoc(doc(db, "products", id)); } catch (e) { alert("Could not delete product."); }
    };

    const startEditProduct = (p) => { setEditingProduct(p); setProductForm(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    const addGalleryImage = async () => {
        if (!galleryImage) return;
        setLoading(true);
        try { await addDoc(collection(db, "gallery"), { image: galleryImage, date: Date.now() }); setGalleryImage(''); } catch (e) { alert("Gallery error."); }
        setLoading(false);
    };

    const deleteGalleryImage = async (id) => {
        if (!window.confirm("Remove this image?")) return;
        try { await deleteDoc(doc(db, "gallery", id)); } catch (e) { alert("Error deleting image."); }
    };

    const addFeedback = async (e) => {
        e.preventDefault();
        setLoading(true);
        try { await addDoc(collection(db, "feedbacks"), { ...feedbackForm, date: Date.now() }); setFeedbackForm({ name: '', text: '', rating: 5, image: '' }); } catch (e) { alert("Feedback error."); }
        setLoading(false);
    };

    const deleteFeedback = async (id) => {
        if (!window.confirm("Remove this feedback?")) return;
        try { await deleteDoc(doc(db, "feedbacks", id)); } catch (e) { alert("Error deleting feedback."); }
    };

    const selectedCategory = categories.find(c => c.id === productForm.category);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 animate-fade-in-up">
            <div className="xl:col-span-1 space-y-8">
                {/* CATEGORY MANAGER */}
                <div className="bg-white rounded-[40px] shadow-xl border border-gray-50 overflow-hidden">
                    <button onClick={() => setShowCategoryManager(!showCategoryManager)} className="w-full p-8 flex items-center justify-between text-left">
                        <h3 className="font-black text-sm flex items-center gap-3 text-gray-800 uppercase tracking-widest">
                            <Tag size={20} className="text-purple-500" /> Category Manager
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-purple-100 text-purple-700 font-black px-3 py-1 rounded-full">{categories.length}</span>
                            {showCategoryManager ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                        </div>
                    </button>

                    {showCategoryManager && (
                        <div className="px-8 pb-8 space-y-6 border-t border-gray-50">
                            {catSuccess && (
                                <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-2xl text-sm font-bold mt-5">
                                    <CheckCircle size={16} /> {catSuccess}
                                </div>
                            )}
                            <div className="pt-5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Add New Category</label>
                                <div className="flex gap-2">
                                    <input placeholder="e.g. Accessories" className="flex-1 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold outline-none" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} />
                                    <button onClick={addCategory} disabled={!newCategoryName.trim() || categoryLoading} className="p-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 disabled:opacity-40">
                                        {categoryLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Manage Categories</label>
                                {categories.map(cat => (
                                    <div key={cat.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                                        <div className="flex items-center justify-between p-3 bg-gray-50">
                                            <button className="flex items-center gap-2 flex-1 text-left" onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}>
                                                {expandedCategory === cat.id ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                                                <span className="font-black text-sm text-gray-800">{cat.name}</span>
                                                <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">{cat.subcategories.length}</span>
                                            </button>
                                            <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {expandedCategory === cat.id && (
                                            <div className="p-3 space-y-2">
                                                {cat.subcategories.map(sub => (
                                                    <div key={sub} className="flex items-center justify-between bg-white border border-gray-100 p-2 rounded-xl">
                                                        <span className="text-sm font-bold text-gray-600 pl-2">{sub}</span>
                                                        <button onClick={() => deleteSubcategory(cat.id, sub)} className="p-1 text-red-400 hover:text-red-600 rounded-lg"><X size={12} /></button>
                                                    </div>
                                                ))}
                                                {cat.subcategories.length === 0 && <p className="text-xs text-gray-400 italic pl-2">No subcategories yet.</p>}
                                                <div className="flex gap-2 pt-1">
                                                    <input placeholder="Add subcategory..." className="flex-1 p-2 text-sm bg-gray-50 rounded-xl border border-gray-100 font-bold outline-none" value={newSubcategoryInput[cat.id] || ''} onChange={e => setNewSubcategoryInput(prev => ({ ...prev, [cat.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addSubcategory(cat.id)} />
                                                    <button onClick={() => addSubcategory(cat.id)} disabled={!(newSubcategoryInput[cat.id] || '').trim() || categoryLoading} className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-40">
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><AlertCircle size={12} /> Changes reflect instantly on the shop.</p>
                        </div>
                    )}
                </div>

                {/* Gallery */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-50">
                    <h3 className="font-black text-lg mb-6 flex items-center gap-3 text-gray-800 uppercase tracking-widest text-sm"><Camera size={20} className="text-blue-500" /> Brand Gallery</h3>
                    <div className="space-y-6">
                        <ImageUpload image={galleryImage} onUpload={setGalleryImage} label="Select Professional Photo" primaryColor={siteContent.primaryColor} />
                        <button onClick={addGalleryImage} disabled={!galleryImage || loading} className="w-full bg-gray-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Publish to Gallery"}
                        </button>
                        <div className="grid grid-cols-3 gap-3">
                            {gallery.slice(0, 9).map(g => (
                                <div key={g.id} className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm">
                                    <img src={g.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="gal" />
                                    <button onClick={() => deleteGalleryImage(g.id)} className="absolute inset-0 bg-red-600/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Feedback */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-50">
                    <h3 className="font-black text-lg mb-6 flex items-center gap-3 text-gray-800 uppercase tracking-widest text-sm"><MessageCircle size={20} className="text-teal-500" /> Client Stories</h3>
                    <form onSubmit={addFeedback} className="space-y-4">
                        <input required placeholder="Client Name" className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold" value={feedbackForm.name} onChange={e => setFeedbackForm({ ...feedbackForm, name: e.target.value })} />
                        <textarea required placeholder="Their testimonial..." className="w-full p-4 bg-gray-50 border-none rounded-2xl h-24 font-medium" value={feedbackForm.text} onChange={e => setFeedbackForm({ ...feedbackForm, text: e.target.value })} />
                        <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white py-4 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-teal-700 transition-all">Post Feedback</button>
                    </form>
                    <div className="mt-8 space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {feedbacks.map(f => (
                            <div key={f.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span className="font-black text-gray-700 truncate w-32">{f.name}</span>
                                <button onClick={() => deleteFeedback(f.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Form */}
            <div className="xl:col-span-2 space-y-10">
                <div className="bg-white p-10 md:p-12 rounded-[50px] shadow-2xl border border-gray-50">
                    <h3 className="font-black text-3xl mb-10 text-gray-900 tracking-tight">
                        {editingProduct ? 'Update Inventory Item' : 'Register New Asset'}
                    </h3>
                    <form onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <ImageUpload image={productForm.image} onUpload={img => setProductForm({ ...productForm, image: img })} label="High Resolution Product Image" primaryColor={siteContent.primaryColor} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product Title</label>
                            <input required placeholder="Enter name" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Price (₵)</label>
                                <input required placeholder="0.00" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Stock Qty</label>
                                <input required placeholder="Qty" type="number" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
                                <button type="button" onClick={() => setShowCategoryManager(true)} className="text-[10px] text-purple-600 font-black flex items-center gap-1 hover:underline">
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
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Subcategory</label>
                                {selectedCategory && (
                                    <button type="button" onClick={() => { setShowCategoryManager(true); setExpandedCategory(selectedCategory.id); }} className="text-[10px] text-purple-600 font-black flex items-center gap-1 hover:underline">
                                        <Plus size={10} /> Add Sub
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
                                    <button type="button" onClick={() => { setShowCategoryManager(true); setExpandedCategory(productForm.category); }} className="underline ml-1">Add one above.</button>
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                            <textarea placeholder="Tell your customers about this item..." className="w-full p-5 bg-gray-50 border rounded-[30px] h-32 font-medium" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                        </div>

                        <div className="md:col-span-2 flex flex-col md:flex-row gap-5 pt-4">
                            <button type="submit" disabled={loading} className="w-full md:flex-1 bg-gray-900 text-white py-5 rounded-[25px] font-black text-lg shadow-2xl hover:bg-black transition-all flex justify-center items-center gap-3">
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <><CheckCircle size={24} /> {editingProduct ? 'Sync Updates' : 'Add to Shop'}</>}
                            </button>
                            {editingProduct && (
                                <button type="button" onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: '', stock: 1, category: '', subcategory: '', description: '', longHistory: '', image: '' }); }} className="px-10 py-5 bg-white border border-gray-200 text-gray-400 rounded-[25px] font-black hover:text-gray-900 transition-all">Cancel</button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Inventory Table */}
                <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
                    <h3 className="font-black text-2xl mb-8 text-gray-900 flex items-center justify-between">
                        Master Stock List
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-[4px]">{products.length} Items</span>
                    </h3>
                    <div className="overflow-x-auto">
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
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${p.stock < 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>{p.stock} left</span>
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
        </div>
    );
}
