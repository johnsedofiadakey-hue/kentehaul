import React, { useState, useEffect } from 'react';
import {
    Package, Plus, ArrowRight, ScrollText, AlertTriangle, CheckCircle2,
    Boxes, Loader2, TrendingDown, TrendingUp
} from 'lucide-react';
import {
    collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast, Toast } from '../UIComponents';
import { SHOP_CATEGORIES } from '../../data/constants';

/**
 * Goods flow: INTAKE (logged here, off the shop) → READY TO PUBLISH (staged as a
 * draft product) → PUBLISHED (admin flips status to active in Products) → the
 * stock ledger records every unit sold or adjusted from there on.
 *
 * This tab owns the first two stages plus the read-only ledger. "Published" itself
 * happens in Products, where the full product-editing form already lives — this
 * tab only needs enough of that form to get a piece off the intake shelf and into
 * a draft product without admin having to re-type anything.
 */

const INITIAL_INTAKE_FORM = { weaverName: '', quantity: 1, unitCost: '', description: '', notes: '' };

export default function AdminInventory({ products = [] }) {
    const [subTab, setSubTab] = useState('intake'); // intake | publish | ledger
    const [toast, showToast, dismissToast] = useToast();

    const [intakeBatches, setIntakeBatches] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [loadingLedger, setLoadingLedger] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
            setIntakeBatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'stock_ledger'), orderBy('createdAt', 'desc'), limit(100)),
            (snap) => {
                setLedger(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoadingLedger(false);
            },
            () => setLoadingLedger(false)
        );
        return () => unsub();
    }, []);

    const pendingBatches = intakeBatches
        .filter(b => b.status !== 'linked')
        .sort((a, b) => (b.receivedAt?.seconds || 0) - (a.receivedAt?.seconds || 0));

    const lowStock = products.filter(p => (p.status ?? 'active') === 'active' && !p.isPreorder && (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) < 5);
    const outOfStock = products.filter(p => (p.status ?? 'active') === 'active' && !p.isPreorder && (p.stockQuantity ?? 0) <= 0);
    const draftCount = products.filter(p => p.status === 'draft').length;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <Toast toast={toast} onDone={dismissToast} />

            <div>
                <h2 className="text-3xl font-black text-gray-900">Inventory</h2>
                <p className="text-gray-400 font-bold text-sm mt-1">Goods received from weavers, staged before they reach the shop, and tracked once they're selling.</p>
            </div>

            {/* At-a-glance status strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting Publish</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{pendingBatches.length}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drafts (Not Live)</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{draftCount}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-amber-100 bg-amber-50/50 shadow-sm">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={11} /> Low Stock</p>
                    <p className="text-3xl font-black text-amber-700 mt-1">{lowStock.length}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-red-100 bg-red-50/50 shadow-sm">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Out of Stock</p>
                    <p className="text-3xl font-black text-red-700 mt-1">{outOfStock.length}</p>
                </div>
            </div>

            {/* Sub-nav */}
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
                {[
                    { id: 'intake', label: 'Intake', icon: Package },
                    { id: 'publish', label: 'Ready to Publish', icon: Boxes },
                    { id: 'ledger', label: 'Ledger', icon: ScrollText }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSubTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === t.id ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <t.icon size={14} /> {t.label}
                    </button>
                ))}
            </div>

            {subTab === 'intake' && <IntakeForm onLogged={() => showToast('Batch logged. Find it in Ready to Publish when you have photos and pricing.')} />}
            {subTab === 'publish' && (
                <PublishQueue
                    batches={pendingBatches}
                    onPublished={(name) => showToast(`${name} created as a draft. Add photos in Products, then flip it to Active.`)}
                    onError={(msg) => showToast(msg, 'error')}
                />
            )}
            {subTab === 'ledger' && <LedgerView entries={ledger} loading={loadingLedger} lowStock={lowStock} outOfStock={outOfStock} />}
        </div>
    );
}

function IntakeForm({ onLogged }) {
    const [form, setForm] = useState(INITIAL_INTAKE_FORM);
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.weaverName.trim() || !form.quantity) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'inventory'), {
                weaverName: form.weaverName.trim(),
                quantity: Number(form.quantity),
                unitCost: form.unitCost === '' ? null : Number(form.unitCost),
                description: form.description.trim(),
                notes: form.notes.trim(),
                status: 'received', // received | linked
                linkedProductId: null,
                receivedAt: serverTimestamp()
            });
            setForm(INITIAL_INTAKE_FORM);
            onLogged?.();
        } catch (err) {
            console.error('Intake log failed:', err);
        }
        setSaving(false);
    };

    return (
        <form onSubmit={submit} className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-gray-100 space-y-6 max-w-2xl">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Log goods as they arrive — before any photo, price, or listing exists.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Weaver / Source <span className="text-red-400">*</span></label>
                    <input required placeholder="e.g. Kofi Mensah, Bonwire" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={form.weaverName} onChange={e => setForm({ ...form, weaverName: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Quantity <span className="text-red-400">*</span></label>
                    <input required type="number" min="1" step="1" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Unit Cost (₵) — what you paid, not the sale price</label>
                <input type="number" min="0" step="0.01" placeholder="Optional — for your own margin tracking" className="w-full p-4 bg-gray-50 border rounded-2xl font-black" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })} />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                <textarea placeholder="Pattern, colors, cloth type — whatever helps you recognize it later" className="w-full p-5 bg-gray-50 border rounded-[30px] h-24 font-medium" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Notes</label>
                <input placeholder="Optional" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button type="submit" disabled={saving} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Log Batch
            </button>
        </form>
    );
}

function PublishQueue({ batches, onPublished, onError }) {
    const [openId, setOpenId] = useState(null);

    if (batches.length === 0) {
        return (
            <div className="bg-white p-12 rounded-[40px] border border-dashed border-gray-200 text-center">
                <Boxes size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 font-bold text-sm">Nothing waiting. Logged batches show up here until they become a product.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {batches.map(b => (
                <div key={b.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <button onClick={() => setOpenId(openId === b.id ? null : b.id)} className="w-full flex items-center justify-between gap-4 p-6 text-left">
                        <div>
                            <p className="font-black text-gray-900">{b.description || 'Untitled batch'}</p>
                            <p className="text-xs font-bold text-gray-400 mt-1">{b.weaverName} · Qty {b.quantity}{b.unitCost != null ? ` · ₵${b.unitCost}/unit cost` : ''}</p>
                        </div>
                        <ArrowRight size={18} className={`text-gray-300 transition-transform flex-shrink-0 ${openId === b.id ? 'rotate-90' : ''}`} />
                    </button>
                    {openId === b.id && (
                        <CreateProductFromBatch
                            batch={b}
                            onDone={(name) => { setOpenId(null); onPublished?.(name); }}
                            onError={onError}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function CreateProductFromBatch({ batch, onDone, onError }) {
    const [form, setForm] = useState({
        name: batch.description || '',
        price: '',
        category: '',
        publishNow: false
    });
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        const price = Number(form.price);
        if (!form.name.trim() || !Number.isFinite(price) || price <= 0 || !form.category) {
            onError?.('Name, category, and a sale price above 0 are required.');
            return;
        }
        setSaving(true);
        try {
            const productRef = await addDoc(collection(db, 'products'), {
                name: form.name.trim(),
                price,
                originalPrice: null,
                stockQuantity: Number(batch.quantity) || 0,
                sku: '',
                category: form.category,
                subcategory: '',
                description: batch.description || '',
                image: '',
                isPreorder: false,
                isFlashSale: false,
                isFeatured: false,
                // Staged by default — the client's whole point in asking for this
                // system was that goods shouldn't reach customers automatically.
                // publishNow is an explicit, deliberate opt-out of that staging.
                status: form.publishNow ? 'active' : 'draft',
                date: Date.now()
            });

            if (Number(batch.quantity) > 0) {
                await addDoc(collection(db, 'stock_ledger'), {
                    productId: productRef.id,
                    productName: form.name.trim(),
                    type: 'intake',
                    delta: Number(batch.quantity),
                    balanceAfter: Number(batch.quantity),
                    actor: 'admin',
                    createdAt: serverTimestamp()
                });
            }

            await updateDoc(doc(db, 'inventory', batch.id), {
                status: 'linked',
                linkedProductId: productRef.id
            });

            onDone?.(form.name.trim());
        } catch (err) {
            console.error('Publish from batch failed:', err);
            onError?.('Something went wrong creating the product.');
        }
        setSaving(false);
    };

    return (
        <form onSubmit={submit} className="border-t border-gray-100 p-6 space-y-4 bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Name <span className="text-red-400">*</span></label>
                    <input required className="w-full p-4 bg-white border rounded-2xl font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sale Price (₵) <span className="text-red-400">*</span></label>
                    <input required type="number" min="0.01" step="0.01" className="w-full p-4 bg-white border rounded-2xl font-black" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category <span className="text-red-400">*</span></label>
                <select required className="w-full p-4 bg-white border rounded-2xl font-bold appearance-none" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select Category</option>
                    {SHOP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <label className="flex items-center gap-3 p-4 bg-white border rounded-2xl cursor-pointer">
                <input type="checkbox" className="h-5 w-5" checked={form.publishNow} onChange={e => setForm({ ...form, publishNow: e.target.checked })} />
                <span className="text-xs font-bold text-gray-600">Publish immediately (skip draft — goes live on the shop right away)</span>
            </label>
            <p className="text-[10px] text-gray-400">Stock starts at {batch.quantity} from this batch. Add a photo afterward in Products — this piece stays a draft until you upload one and switch it to Active, unless you check the box above.</p>
            <button type="submit" disabled={saving} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {form.publishNow ? 'Create & Publish' : 'Create as Draft'}
            </button>
        </form>
    );
}

function LedgerView({ entries, loading, lowStock, outOfStock }) {
    const fmtTime = (ts) => {
        if (!ts?.seconds) return '—';
        return new Date(ts.seconds * 1000).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            {(lowStock.length > 0 || outOfStock.length > 0) && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Needs Attention</p>
                    <div className="flex flex-wrap gap-2">
                        {outOfStock.map(p => (
                            <span key={p.id} className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-black text-white">{p.name} — out of stock</span>
                        ))}
                        {lowStock.map(p => (
                            <span key={p.id} className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-100">{p.name} — {p.stockQuantity} left</span>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
                <h3 className="font-black text-xl mb-6 text-gray-900">Stock Movement</h3>
                {loading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-gray-300" size={24} /></div>
                ) : entries.length === 0 ? (
                    <p className="text-sm text-gray-400 font-bold py-8 text-center">No stock movement recorded yet — this fills in as sales, restocks, and adjustments happen.</p>
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
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{e.type || '—'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`flex items-center gap-1 font-black ${e.delta < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                {e.delta < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                                {e.delta > 0 ? `+${e.delta}` : e.delta}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 font-bold">{e.balanceAfter ?? '—'}</td>
                                        <td className="p-4 text-gray-400 font-mono text-xs">{e.orderId || '—'}</td>
                                        <td className="p-4 text-gray-400 text-xs">{fmtTime(e.createdAt)}</td>
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
