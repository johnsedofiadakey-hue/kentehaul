import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle, Boxes, CheckCircle2, Clock, Eye, EyeOff,
    Loader2, Package, ScrollText, TrendingDown, TrendingUp
} from 'lucide-react';
import {
    collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast, Toast } from '../UIComponents';

const STATUS_OPTIONS = [
    { id: 'active', label: 'Live', hint: 'Visible on shop' },
    { id: 'draft', label: 'Hidden', hint: 'Not visible' },
    { id: 'archived', label: 'Archived', hint: 'Kept for records' }
];

const statusLabel = (status) => {
    if (status === 'draft') return 'Hidden';
    if (status === 'archived') return 'Archived';
    return 'Live';
};

const statusClasses = (status) => {
    if (status === 'draft') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'archived') return 'bg-gray-200 text-gray-600 border-gray-200';
    return 'bg-green-100 text-green-700 border-green-200';
};

export default function AdminInventory({ products = [] }) {
    const [toast, showToast, dismissToast] = useToast();
    const [ledger, setLedger] = useState([]);
    const [loadingLedger, setLoadingLedger] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const [form, setForm] = useState({ stockQuantity: '', status: 'active' });

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'stock_ledger'), orderBy('createdAt', 'desc'), limit(80)),
            (snap) => {
                setLedger(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoadingLedger(false);
            },
            () => setLoadingLedger(false)
        );
        return () => unsub();
    }, []);

    const sortedProducts = useMemo(() => {
        const order = { active: 0, draft: 1, archived: 2 };
        return [...products].sort((a, b) => {
            const statusSort = (order[a.status ?? 'active'] ?? 0) - (order[b.status ?? 'active'] ?? 0);
            if (statusSort !== 0) return statusSort;
            return String(a.name || '').localeCompare(String(b.name || ''));
        });
    }, [products]);

    const selectedProduct = sortedProducts.find(p => p.id === selectedId) || sortedProducts[0] || null;

    useEffect(() => {
        if (!selectedProduct) {
            setSelectedId('');
            setForm({ stockQuantity: '', status: 'active' });
            return;
        }
        if (selectedProduct.id !== selectedId) setSelectedId(selectedProduct.id);
        setForm({
            stockQuantity: String(selectedProduct.stockQuantity ?? selectedProduct.stock ?? 0),
            status: selectedProduct.status ?? 'active'
        });
    }, [selectedProduct?.id, selectedProduct?.stockQuantity, selectedProduct?.stock, selectedProduct?.status]);

    const liveCount = products.filter(p => (p.status ?? 'active') === 'active').length;
    const hiddenCount = products.filter(p => p.status === 'draft').length;
    const lowStock = products.filter(p => (p.status ?? 'active') === 'active' && !p.isPreorder && (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) < 5);
    const outOfStock = products.filter(p => (p.status ?? 'active') === 'active' && !p.isPreorder && (p.stockQuantity ?? 0) <= 0);

    const saveStock = async (e) => {
        e.preventDefault();
        if (!selectedProduct) {
            showToast('Add a product first in Products.', 'error');
            return;
        }

        const nextStock = Number(form.stockQuantity);
        if (!Number.isFinite(nextStock) || nextStock < 0) {
            showToast('Stock must be 0 or higher.', 'error');
            return;
        }

        const roundedStock = Math.floor(nextStock);
        const priorStock = selectedProduct.stockQuantity ?? selectedProduct.stock ?? 0;
        const delta = roundedStock - priorStock;

        setSaving(true);
        try {
            await updateDoc(doc(db, 'products', selectedProduct.id), {
                stockQuantity: roundedStock,
                status: form.status
            });

            if (delta !== 0) {
                await addDoc(collection(db, 'stock_ledger'), {
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    type: 'adjustment',
                    delta,
                    balanceAfter: roundedStock,
                    actor: 'admin',
                    createdAt: serverTimestamp()
                });
            }

            showToast(`${selectedProduct.name} updated.`);
        } catch (err) {
            console.error('Inventory update failed:', err);
            showToast('Could not update inventory.', 'error');
        }
        setSaving(false);
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <Toast toast={toast} onDone={dismissToast} />

            <div>
                <h2 className="text-3xl font-black text-gray-900">Inventory</h2>
                <p className="text-gray-400 font-bold text-sm mt-1">Fast stock and visibility control. Product photos, names, prices, and descriptions stay in Products.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Live Products" value={liveCount} icon={Eye} tone="green" />
                <StatCard label="Hidden Drafts" value={hiddenCount} icon={EyeOff} tone="amber" />
                <StatCard label="Low Stock" value={lowStock.length} icon={AlertTriangle} tone="red" />
                <StatCard label="All Products" value={products.length} icon={Boxes} tone="gray" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)] gap-6">
                <form onSubmit={saveStock} className="bg-white p-6 md:p-8 rounded-[36px] shadow-xl border border-gray-100 space-y-5">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Update</p>
                        <h3 className="font-black text-xl text-gray-900 mt-1">Change stock or visibility</h3>
                    </div>

                    {sortedProducts.length === 0 ? (
                        <div className="border border-dashed border-gray-200 rounded-3xl p-8 text-center">
                            <Package size={28} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-bold text-gray-400">No products yet. Add the product in Products first.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product</label>
                                <select
                                    value={selectedId}
                                    onChange={e => setSelectedId(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border rounded-2xl font-bold appearance-none"
                                >
                                    {sortedProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Stock Qty</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full p-4 bg-gray-50 border rounded-2xl font-black"
                                        value={form.stockQuantity}
                                        onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Visibility</label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border rounded-2xl font-bold appearance-none"
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt.id} value={opt.id}>{opt.label} - {opt.hint}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedProduct && (
                                <div className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 border border-gray-100">
                                    {selectedProduct.image ? (
                                        <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-[10px] font-black text-gray-300 border border-gray-100">No img</div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-black text-gray-900 truncate">{selectedProduct.name}</p>
                                        <p className="text-xs font-bold text-gray-400">Current: {selectedProduct.stockQuantity ?? selectedProduct.stock ?? 0} in stock - {statusLabel(selectedProduct.status)}</p>
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={saving} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save Inventory
                            </button>
                        </>
                    )}
                </form>

                <StockList products={sortedProducts} />
            </div>

            <LedgerView entries={ledger} loading={loadingLedger} lowStock={lowStock} outOfStock={outOfStock} />
        </div>
    );
}

function StatCard({ label, value, icon: Icon, tone }) {
    const tones = {
        green: 'border-green-100 bg-green-50/50 text-green-700',
        amber: 'border-amber-100 bg-amber-50/50 text-amber-700',
        red: 'border-red-100 bg-red-50/50 text-red-700',
        gray: 'border-gray-100 bg-white text-gray-900'
    };

    return (
        <div className={`p-5 rounded-3xl border shadow-sm ${tones[tone]}`}>
            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 opacity-80"><Icon size={12} /> {label}</p>
            <p className="text-3xl font-black mt-1">{value}</p>
        </div>
    );
}

function StockList({ products }) {
    if (products.length === 0) {
        return (
            <div className="bg-white p-10 rounded-[36px] shadow-xl border border-gray-100 text-center">
                <Boxes size={30} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-400">Products you add will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-[36px] shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-5 gap-4">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock List</p>
                    <h3 className="font-black text-xl text-gray-900 mt-1">Current products</h3>
                </div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-[3px]">{products.length} items</p>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {products.map(p => {
                    const stock = p.stockQuantity ?? p.stock ?? 0;
                    const status = p.status ?? 'active';
                    return (
                        <div key={p.id} className="flex items-center gap-4 p-4 rounded-3xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            {p.image ? (
                                <img src={p.image} alt={p.name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-gray-100" />
                            ) : (
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-[10px] font-black">No img</div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-gray-900 truncate">{p.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">₵{p.price || 0} - {stock} in stock</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase flex-shrink-0 ${statusClasses(status)}`}>
                                {statusLabel(status)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LedgerView({ entries, loading, lowStock, outOfStock }) {
    const fmtTime = (ts) => {
        if (!ts?.seconds) return '-';
        return new Date(ts.seconds * 1000).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            {(lowStock.length > 0 || outOfStock.length > 0) && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Needs Attention</p>
                    <div className="flex flex-wrap gap-2">
                        {outOfStock.map(p => (
                            <span key={p.id} className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-black text-white">{p.name} - out of stock</span>
                        ))}
                        {lowStock.map(p => (
                            <span key={p.id} className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-100">{p.name} - {p.stockQuantity} left</span>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white p-6 md:p-8 rounded-[36px] shadow-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between mb-6 gap-4">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ledger</p>
                        <h3 className="font-black text-xl text-gray-900 mt-1">Recent stock movement</h3>
                    </div>
                    <ScrollText size={22} className="text-gray-300" />
                </div>
                {loading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-gray-300" size={24} /></div>
                ) : entries.length === 0 ? (
                    <p className="text-sm text-gray-400 font-bold py-8 text-center">No stock movement recorded yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-400 uppercase font-black text-[10px] tracking-widest">
                                <tr><th className="p-4">Product</th><th className="p-4">Type</th><th className="p-4">Change</th><th className="p-4">Balance</th><th className="p-4">Order</th><th className="p-4">When</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {entries.map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-black text-gray-800">{e.productName || e.productId}</td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{e.type || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`flex items-center gap-1 font-black ${e.delta < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                {e.delta < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                                {e.delta > 0 ? `+${e.delta}` : e.delta}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 font-bold">{e.balanceAfter ?? '-'}</td>
                                        <td className="p-4 text-gray-400 font-mono text-xs">{e.orderId || '-'}</td>
                                        <td className="p-4 text-gray-400 text-xs whitespace-nowrap"><Clock size={11} className="inline mr-1" />{fmtTime(e.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
