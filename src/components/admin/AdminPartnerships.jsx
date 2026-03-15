import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users, Mail, Phone, Clock, Trash2, CheckCircle, XCircle, Search, MessageSquare, Building2 } from 'lucide-react';

export default function AdminPartnerships({ siteContent }) {
    const [partnerships, setPartnerships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, "partnerships"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPartnerships(docs);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, "partnerships", id), { status: newStatus });
        } catch (err) {
            console.error(err);
            alert("Error updating status.");
        }
    };

    const deleteInquiry = async (id) => {
        if (!window.confirm("Delete this inquiry permanently?")) return;
        try {
            await deleteDoc(doc(db, "partnerships", id));
        } catch (err) {
            console.error(err);
            alert("Error deleting inquiry.");
        }
    };

    const filtered = partnerships.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin text-4xl" style={{ color: siteContent.primaryColor }}>⌛</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Users className="text-amber-500" /> Partnership Inquiries
                    </h2>
                    <p className="text-gray-500 font-medium">Manage and respond to collaboration requests.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or org..." 
                        className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500/20 w-full md:w-80"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500"><Users size={24} /></div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-black">{partnerships.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><Clock size={24} /></div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">New</p>
                        <p className="text-2xl font-black">{partnerships.filter(p => p.status === 'new').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Approved</p>
                        <p className="text-2xl font-black">{partnerships.filter(p => p.status === 'approved').length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 text-gray-400 uppercase font-black text-[10px] tracking-widest">
                            <tr>
                                <th className="p-6">Partner</th>
                                <th className="p-6">Contact info</th>
                                <th className="p-6">Vision / Reason</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-gray-900">{p.name}</span>
                                            {p.organization && (
                                                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                                    <Building2 size={12} /> {p.organization}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-1">
                                            <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-amber-600">
                                                <Mail size={12} /> {p.email}
                                            </a>
                                            {p.phone && (
                                                <span className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                    <Phone size={12} /> {p.phone}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="max-w-xs">
                                            <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                                {p.reason}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <select 
                                            value={p.status || 'new'} 
                                            onChange={(e) => updateStatus(p.id, e.target.value)}
                                            className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-none outline-none appearance-none cursor-pointer
                                                ${p.status === 'new' ? 'bg-blue-50 text-blue-600' : 
                                                  p.status === 'approved' ? 'bg-green-50 text-green-600' : 
                                                  'bg-gray-100 text-gray-500'}`}
                                        >
                                            <option value="new">New Inquiry</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Declined</option>
                                        </select>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button 
                                            onClick={() => deleteInquiry(p.id)}
                                            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-300">
                                            <Users size={64} className="opacity-20" />
                                            <p className="font-black uppercase tracking-widest text-xs">No inquiries found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
