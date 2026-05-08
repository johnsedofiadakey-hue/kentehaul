import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { setDoc, updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';

export default function InvoiceCreator({
    isOpen,
    onClose,
    editingOrder,
    initialCustomer,
    customers
}) {
    const [loading, setLoading] = useState(false);
    const [customOrderForm, setCustomOrderForm] = useState({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        shippingFee: 0,
        items: [{ name: '', price: '', quantity: 1 }]
    });

    // Helper: Generate ID
    const generateId = () => `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    // Reset or Populate form when modal opens/changes
    useEffect(() => {
        if (isOpen) {
            if (editingOrder) {
                setCustomOrderForm({
                    customerName: editingOrder.customer.name,
                    customerPhone: editingOrder.customer.phone,
                    customerAddress: editingOrder.customer.address || '',
                    shippingFee: editingOrder.shippingFee || 0,
                    items: editingOrder.items
                });
            } else if (initialCustomer) {
                setCustomOrderForm({
                    customerName: initialCustomer.name,
                    customerPhone: initialCustomer.phone,
                    customerAddress: initialCustomer.address || '',
                    shippingFee: 0,
                    items: [{ name: '', price: '', quantity: 1 }]
                });
            } else {
                setCustomOrderForm({
                    customerName: '',
                    customerPhone: '',
                    customerAddress: '',
                    shippingFee: 0,
                    items: [{ name: '', price: '', quantity: 1 }]
                });
            }
        }
    }, [isOpen, editingOrder, initialCustomer]);

    if (!isOpen) return null;

    // --- HANDLERS ---

    const addLineItem = () => {
        setCustomOrderForm({
            ...customOrderForm,
            items: [...customOrderForm.items, { name: '', price: '', quantity: 1 }]
        });
    };

    const updateLineItem = (index, field, value) => {
        const updatedItems = [...customOrderForm.items];
        updatedItems[index][field] = value;
        setCustomOrderForm({ ...customOrderForm, items: updatedItems });
    };

    const removeLineItem = (index) => {
        const updatedItems = customOrderForm.items.filter((_, i) => i !== index);
        setCustomOrderForm({ ...customOrderForm, items: updatedItems });
    };

    const saveCustomOrder = async (e) => {
        e.preventDefault();
        setLoading(true);

        const orderId = editingOrder ? editingOrder.id : generateId();
        // Calculate totals
        const itemSubtotal = customOrderForm.items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
        const shipping = Number(customOrderForm.shippingFee) || 0;
        const totalAmount = itemSubtotal + shipping;

        const finalOrderObject = {
            id: orderId,
            date: editingOrder ? editingOrder.date : new Date().toLocaleDateString(),
            items: customOrderForm.items.map(i => ({
                ...i,
                price: Number(i.price),
                quantity: Number(i.quantity)
            })),
            subtotal: itemSubtotal,
            shippingFee: shipping,
            total: totalAmount,
            status: editingOrder ? editingOrder.status : 'Pending',
            method: editingOrder ? editingOrder.method : 'Manual Invoice',
            customer: {
                name: customOrderForm.customerName,
                phone: customOrderForm.customerPhone,
                address: customOrderForm.customerAddress || 'Local Client',
                email: ''
            }
        };

        try {
            // 1. Save order to the Cloud database
            await setDoc(doc(db, "orders", orderId), finalOrderObject);

            // 2. Link this order to the Customer's history automatically
            const cleanPhone = customOrderForm.customerPhone.replace(/[^0-9]/g, '');
            const clientRecord = customers.find(c => c.id === cleanPhone);

            if (clientRecord && !editingOrder) {
                // Only add to Lifetime Value if this is a NEW invoice
                await updateDoc(doc(db, "customers", cleanPhone), {
                    totalSpent: (clientRecord.totalSpent || 0) + totalAmount,
                    orderIds: [orderId, ...(clientRecord.orderIds || [])],
                    lastOrderDate: new Date().toLocaleDateString()
                });
            }

            alert(editingOrder ? "Invoice updated!" : "Invoice created!");
            onClose();
        } catch (err) {
            console.error("POS Error:", err);
            alert("Error generating invoice.");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-3xl p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                <div className="bg-gray-50 p-6 flex justify-between items-center border-b shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-blue-600" /> {editingOrder ? "Update Bill" : "Create New Bill"}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm hover:text-red-500 transition"><X size={24} /></button>
                </div>

                <form onSubmit={saveCustomOrder} className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Step 1: Customer Details */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-sm text-blue-600 uppercase tracking-widest">1. Customer Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/30 p-6 rounded-3xl border border-blue-50">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400">Customer Name</label>
                                <input required className="w-full p-3 bg-white border border-gray-200 rounded-xl" value={customOrderForm.customerName} onChange={e => setCustomOrderForm({ ...customOrderForm, customerName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400">Phone Number</label>
                                <input required className="w-full p-3 bg-white border border-gray-200 rounded-xl" value={customOrderForm.customerPhone} onChange={e => setCustomOrderForm({ ...customOrderForm, customerPhone: e.target.value })} />
                            </div>
                            <div className="md:col-span-1 space-y-1">
                                <label className="text-xs font-bold text-gray-400">Delivery Address</label>
                                <input className="w-full p-3 bg-white border border-gray-200 rounded-xl" value={customOrderForm.customerAddress} onChange={e => setCustomOrderForm({ ...customOrderForm, customerAddress: e.target.value })} />
                            </div>
                            <div className="md:col-span-1 space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-400">Shipping / Logistics Fee (₵)</label>
                                <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl text-right font-black" value={customOrderForm.shippingFee} onChange={e => setCustomOrderForm({ ...customOrderForm, shippingFee: Number(e.target.value) })} />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Line Items */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-sm text-blue-600 uppercase tracking-widest">2. Items Ordered</h4>
                            <button type="button" onClick={addLineItem} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-black flex items-center gap-1 transition">
                                <Plus size={14} /> Add Row
                            </button>
                        </div>

                        <div className="space-y-3">
                            {customOrderForm.items.map((item, idx) => (
                                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200 animate-fade-in">
                                    <div className="flex-[3] min-w-[200px]">
                                        <input required placeholder="Description (e.g. 6 Yards Kente)" className="w-full p-3 border rounded-xl text-sm" value={item.name} onChange={e => updateLineItem(idx, 'name', e.target.value)} />
                                    </div>
                                    <div className="w-20">
                                        <input required type="number" placeholder="Qty" className="w-full p-3 border rounded-xl text-sm text-center" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)} />
                                    </div>
                                    <div className="w-32">
                                        <input required type="number" placeholder="Price" className="w-full p-3 border rounded-xl text-sm" value={item.price} onChange={e => updateLineItem(idx, 'price', e.target.value)} />
                                    </div>
                                    <div className="w-10">
                                        {customOrderForm.items.length > 1 && (
                                            <button type="button" onClick={() => removeLineItem(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={20} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Calculation Display */}
                    <div className="bg-gray-950 p-8 rounded-[35px] flex flex-col md:flex-row justify-between items-start md:items-center text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full group-hover:bg-blue-600/20 transition-all" />
                        <div className="space-y-1 relative z-10">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[3px]">Financial Summary</p>
                            <div className="flex gap-4 text-xs font-bold text-gray-500">
                                <span>Sub: ₵{customOrderForm.items.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0).toLocaleString()}</span>
                                <span>Shipping: ₵{customOrderForm.shippingFee.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 text-right relative z-10">
                            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Total Amount Due</p>
                            <div className="text-5xl font-black tracking-tighter">
                                ₵{(customOrderForm.items.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0) + Number(customOrderForm.shippingFee)).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={24} /> Save & Print Invoice</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
