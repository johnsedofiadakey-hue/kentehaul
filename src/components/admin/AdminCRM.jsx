import React, { useState } from 'react';
import {
    Search, UserCheck, UserPlus, X, Loader2, Edit, Trash2,
    Users, Settings, Calendar, Plus, History, ShoppingBag,
    CreditCard, FileText, ShieldCheck, ShieldAlert, Key
} from 'lucide-react';
import { updateDoc, setDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';

export default function AdminCRM({
    customers,
    orders,
    onCreateInvoice
}) {
    // --- STATE ---
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);

    // Modal & Form State
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [customerForm, setCustomerForm] = useState({
        name: '', email: '', phone: '', address: ''
    });

    // --- FILTERING ---
    const filteredClientsList = (customers || []).filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );

    const clientPortalHistory = selectedCustomerHistory ? orders.filter(o =>
        (selectedCustomerHistory.orderIds || []).includes(o.id) ||
        o.customer?.phone === selectedCustomerHistory.phone
    ) : [];

    // --- ACTIONS ---
    const openAddCustomer = () => {
        setEditingCustomer(null);
        setCustomerForm({ name: '', email: '', phone: '', address: '' });
        setIsCustomerModalOpen(true);
    };

    const openEditCustomer = (e, customer) => {
        if (e) e.stopPropagation();
        setEditingCustomer(customer);
        setCustomerForm({
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || ''
        });
        setIsCustomerModalOpen(true);
    };

    const saveCustomer = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const id = editingCustomer ? editingCustomer.id : (customerForm.phone.replace(/[^0-9]/g, '') || `client-${Date.now()}`);

            const clientProfileData = {
                name: customerForm.name,
                email: customerForm.email,
                phone: customerForm.phone,
                address: customerForm.address,
                totalSpent: editingCustomer ? (editingCustomer.totalSpent || 0) : 0,
                orderIds: editingCustomer ? (editingCustomer.orderIds || []) : [],
                joinedDate: editingCustomer ? editingCustomer.joinedDate : new Date().toLocaleDateString(),
                lastOrderDate: editingCustomer ? editingCustomer.lastOrderDate : "Never"
            };

            if (editingCustomer) {
                await updateDoc(doc(db, "customers", id), clientProfileData);
                if (selectedCustomerHistory && selectedCustomerHistory.id === id) {
                    setSelectedCustomerHistory({ ...selectedCustomerHistory, ...clientProfileData });
                }
            } else {
                await setDoc(doc(db, "customers", id), clientProfileData);
            }

            setCustomerForm({ name: '', email: '', phone: '', address: '' });
            setIsCustomerModalOpen(false);
            setEditingCustomer(null);
            alert("Client profile saved successfully!");
        } catch (err) {
            console.error("CRM Error:", err);
            alert("System could not save client. Check your network.");
        }
        setLoading(false);
    };

    const deleteCustomer = async (e, id) => {
        if (e) e.stopPropagation();
        if (!window.confirm("Are you sure you want to remove this client? All history will be hidden.")) return;

        try {
            await deleteDoc(doc(db, "customers", id));
            if (selectedCustomerHistory?.id === id) setSelectedCustomerHistory(null);
        } catch (err) {
            alert("Error deleting record.");
        }
    };

    const resetCustomerPassword = async (customer) => {
        if (!window.confirm(`Are you sure you want to reset the password for ${customer.name}? This will temporarily lock the account until they set a new one.`)) return;
        
        try {
            await updateDoc(doc(db, "customers", customer.id), {
                passwordHash: null // Resetting to null forces them to contact support or re-register (or we can add a manual set logic)
            });
            alert("Password hash cleared. Account is now in 'Guest' mode.");
            if (selectedCustomerHistory?.id === customer.id) {
                setSelectedCustomerHistory({ ...selectedCustomerHistory, passwordHash: null });
            }
        } catch (err) {
            alert("Failed to reset password.");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Client Relationship Manager</h2>
                    <p className="text-gray-500 font-medium mt-1">Manage, Track, and Invoice your verified client database.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button
                        onClick={openAddCustomer}
                        className="bg-gray-900 text-white px-8 py-4 rounded-[22px] font-black flex items-center gap-3 shadow-2xl hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all text-sm uppercase tracking-widest"
                    >
                        <UserPlus size={20} /> Add Client
                    </button>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="relative max-w-2xl">
                <Search className="absolute left-5 top-5 text-gray-400" size={20} />
                <input
                    placeholder="Search by client name, phone or location..."
                    className="pl-14 p-5 border border-gray-200 rounded-[25px] w-full bg-white shadow-sm focus:shadow-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                />
            </div>

            {/* CLIENT TABLE */}
            <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-gray-50/50 text-gray-400 font-black uppercase tracking-[2px] border-b text-[10px]">
                            <tr>
                                <th className="p-8">Identification</th>
                                <th className="p-8">Contact Information</th>
                                <th className="p-8 text-center">Engagement</th>
                                <th className="p-8 text-right">Lifetime Spend</th>
                                <th className="p-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClientsList.length === 0 ? (
                                <tr><td colSpan="5" className="p-20 text-center text-gray-300 font-black uppercase tracking-widest italic">No matching clients found.</td></tr>
                            ) : (
                                filteredClientsList.map(client => (
                                    <tr key={client.id} className="hover:bg-gray-50/80 transition-all cursor-pointer group" onClick={() => setSelectedCustomerHistory(client)}>
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${client.passwordHash ? 'bg-indigo-600 text-white shadow-lg' : 'bg-blue-50 text-blue-600'}`}>
                                                    {client.passwordHash ? <ShieldCheck size={20} /> : client.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{client.name}</p>
                                                        {client.passwordHash && <span className="bg-indigo-100 text-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Royal Member</span>}
                                                    </div>
                                                    <p className="text-gray-400 font-bold text-xs uppercase tracking-tighter">{client.address || 'Local'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <p className="font-black text-gray-700">{client.phone}</p>
                                            <p className="text-gray-400 font-medium text-xs lowercase">{client.email || 'no-email@store.com'}</p>
                                        </td>
                                        <td className="p-8 text-center">
                                            <span className="bg-gray-900 text-white px-4 py-1 rounded-full font-black text-[10px] shadow-sm">
                                                {client.orderIds?.length || 0} INVOICES
                                            </span>
                                        </td>
                                        <td className="p-8 text-right">
                                            <span className="font-black text-xl text-green-600">₵{client.totalSpent?.toLocaleString()}</span>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={(e) => openEditCustomer(e, client)} className="p-3 bg-white border border-gray-100 shadow-sm rounded-2xl hover:text-blue-600 hover:border-blue-200 transition-all">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={(e) => deleteCustomer(e, client.id)} className="p-3 bg-white border border-gray-100 shadow-sm rounded-2xl hover:text-red-600 hover:border-red-200 transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ADD/EDIT CUSTOMER MODAL --- */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                {editingCustomer ? <UserCheck className="text-blue-600" /> : <UserPlus className="text-green-600" />}
                                {editingCustomer ? "Edit Client" : "Register Client"}
                            </h3>
                            <button onClick={() => setIsCustomerModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><X size={20} /></button>
                        </div>

                        <form onSubmit={saveCustomer} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Client Name</label>
                                <input required placeholder="e.g. John Doe" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                                    <input required placeholder="024 XXX XXXX" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                                    <input placeholder="Optional" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Physical Address</label>
                                <textarea placeholder="e.g. House No. 12, Accra" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl h-24 focus:ring-2 focus:ring-blue-500 outline-none transition" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} />
                            </div>

                            <div className="pt-4">
                                <button disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-black transform active:scale-95 transition-all">
                                    {loading ? <Loader2 className="animate-spin mx-auto" /> : (editingCustomer ? "Update Profile" : "Create Client Account")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- CUSTOMER PORTAL OVERLAY (Detailed View) --- */}
            {selectedCustomerHistory && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all animate-fade-in">
                    <div className="bg-white w-full max-w-5xl rounded-[40px] p-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                        {/* High Profile Header */}
                        <div className="bg-gray-900 text-white p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-500/20">
                                    {selectedCustomerHistory.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-3xl font-black tracking-tight">{selectedCustomerHistory.name}</h3>
                                        <button onClick={(e) => openEditCustomer(e, selectedCustomerHistory)} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors">
                                            <Edit size={18} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-5 mt-3 text-gray-400 font-medium">
                                        <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"><Users size={16} className="text-blue-400" /> {selectedCustomerHistory.phone}</span>
                                        <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"><Settings size={16} className="text-blue-400" /> {selectedCustomerHistory.address || 'Standard Member'}</span>
                                        <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"><Calendar size={16} className="text-blue-400" /> Since {selectedCustomerHistory.joinedDate}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCustomerHistory(null)} className="p-3 bg-white/5 hover:bg-red-500 transition-all rounded-full"><X size={28} /></button>
                        </div>

                        {/* ACCOUNT SECURITY STATUS BAR */}
                        <div className={`px-10 py-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest ${selectedCustomerHistory.passwordHash ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
                            <div className="flex items-center gap-3">
                                {selectedCustomerHistory.passwordHash ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                {selectedCustomerHistory.passwordHash ? "Verified Royal Member Account" : "Guest Purchase Profile (Insecure)"}
                            </div>
                            {selectedCustomerHistory.passwordHash && (
                                <button 
                                    onClick={() => resetCustomerPassword(selectedCustomerHistory)}
                                    className="bg-white/20 px-4 py-1.5 rounded-lg hover:bg-white text-indigo-600 transition-all flex items-center gap-2"
                                >
                                    <Key size={12} /> Reset Credentials
                                </button>
                            )}
                        </div>

                        {/* Client Metrics Section */}
                        <div className="p-8 border-b bg-gray-50 flex flex-col md:flex-row gap-6 shrink-0">
                            <div className="flex-1 bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm transition hover:shadow-md">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-[2px] mb-2">Total Value</p>
                                <p className="text-4xl font-black text-green-600">₵{selectedCustomerHistory.totalSpent?.toLocaleString()}</p>
                            </div>
                            <div className="flex-1 bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm transition hover:shadow-md">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-[2px] mb-2">Order Frequency</p>
                                <p className="text-4xl font-black text-gray-800">{selectedCustomerHistory.orderIds?.length || 0} <span className="text-sm text-gray-400 font-medium">Official Orders</span></p>
                            </div>
                            <button onClick={() => onCreateInvoice(selectedCustomerHistory)} className="bg-blue-600 text-white px-10 rounded-[30px] font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all flex flex-col items-center justify-center min-w-[200px]">
                                <Plus size={24} className="mb-2" />
                                Create New Invoice
                            </button>
                        </div>

                        {/* Purchase History Grid */}
                        <div className="flex-1 overflow-y-auto p-10 bg-white space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm flex items-center gap-2">
                                    <History size={18} className="text-blue-500" /> Transaction History
                                </h4>
                            </div>

                            {clientPortalHistory.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-400 font-bold">This client has no transaction records yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {clientPortalHistory.map(order => (
                                        <div key={order.id} className="border border-gray-100 p-6 rounded-[30px] flex flex-col justify-between hover:bg-gray-50/80 transition-all group border-l-[6px] border-l-blue-500 shadow-sm hover:shadow-md">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-gray-900 text-lg">#{order.id}</span>
                                                        <span className="text-xs text-gray-400 font-bold">{order.date}</span>
                                                    </div>
                                                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm ${['Paid', 'Delivered'].includes(order.status) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <div className="mt-4 flex gap-2 flex-wrap">
                                                    {order.items.slice(0, 3).map((it, idx) => (
                                                        <span key={idx} className="text-[10px] bg-white border px-2 py-1 rounded-lg text-gray-500 font-bold">
                                                            {it.name} (x{it.quantity})
                                                        </span>
                                                    ))}
                                                    {order.items.length > 3 && <span className="text-[10px] text-gray-400">+{order.items.length - 3} more</span>}
                                                </div>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                                                <span className="font-black text-2xl text-green-600">₵{order.total}</span>
                                                {/* Note: View/Edit logic here might need to route back to parent if we want to edit invoices from here. 
                            For now, since we only passed onCreateInvoice, we might omit Edit from THIS view or add onViewInvoice/onEditInvoice props later.
                            Let's keep them as Read-Only or simple View for now to avoid prop drilling madness unless necessary.
                            Actually, 'View' is just viewing. 'Edit' requires the Invoice Modal.
                        */}
                                                <div className="flex gap-2">
                                                    <span className="p-3 bg-gray-50 text-gray-300 rounded-2xl cursor-not-allowed">
                                                        <Edit size={18} />
                                                    </span>
                                                    <span className="p-3 bg-blue-50 text-blue-300 rounded-2xl cursor-not-allowed">
                                                        {['Paid', 'Delivered'].includes(order.status) ? <CreditCard size={18} /> : <FileText size={18} />}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
