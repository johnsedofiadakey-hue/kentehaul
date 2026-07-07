import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Tag, X, ChevronDown, ChevronRight, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

export default function CategoryManagerModal({
    isOpen,
    onClose,
    categories,
    setCategories,
    products,
    initialExpandedCategory,
    showToast
}) {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSubcategoryInput, setNewSubcategoryInput] = useState({});
    const [expandedCategory, setExpandedCategory] = useState(initialExpandedCategory || null);
    const [categoryLoading, setCategoryLoading] = useState(false);

    useEffect(() => {
        if (isOpen) setExpandedCategory(initialExpandedCategory || null);
    }, [isOpen, initialExpandedCategory]);

    const saveCategoriesToFirestore = async (updatedCats) => {
        await setDoc(doc(db, "settings", "categories"), { list: updatedCats });
    };

    const addCategory = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        const exists = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) { showToast("That category already exists.", "error"); return; }
        setCategoryLoading(true);
        const newId = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const updated = [...categories, { id: newId, name: trimmed, subcategories: [] }];
        setCategories(updated);
        await saveCategoriesToFirestore(updated);
        setNewCategoryName('');
        showToast(`Category "${trimmed}" added!`);
        setCategoryLoading(false);
    };

    const deleteCategory = async (catId) => {
        const cat = categories.find(c => c.id === catId);
        const usedBy = products.filter(p => p.category === catId).length;
        if (usedBy > 0) { showToast(`Cannot delete "${cat.name}" — ${usedBy} product(s) use this. Reassign them first.`, "error"); return; }
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
        if (cat.subcategories.map(s => s.toLowerCase()).includes(val.toLowerCase())) { showToast("That subcategory already exists.", "error"); return; }
        setCategoryLoading(true);
        const updated = categories.map(c => c.id === catId ? { ...c, subcategories: [...c.subcategories, val] } : c);
        setCategories(updated);
        await saveCategoriesToFirestore(updated);
        setNewSubcategoryInput(prev => ({ ...prev, [catId]: '' }));
        showToast(`"${val}" added to ${cat.name}!`);
        setCategoryLoading(false);
    };

    const deleteSubcategory = async (catId, sub) => {
        const usedBy = products.filter(p => p.category === catId && p.subcategory === sub).length;
        if (usedBy > 0) { showToast(`Cannot delete "${sub}" — ${usedBy} product(s) use it.`, "error"); return; }
        setCategoryLoading(true);
        const updated = categories.map(c => c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s !== sub) } : c);
        setCategories(updated);
        await saveCategoriesToFirestore(updated);
        setCategoryLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-8"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-lg flex items-center gap-3 text-gray-800 uppercase tracking-widest">
                        <Tag size={20} className="text-purple-500" /> Category Manager
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
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
            </div>
        </div>
    );
}
