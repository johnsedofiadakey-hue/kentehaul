import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Phone, Mail, User, ArrowRight, Loader2, Sparkles, LogIn, UserPlus } from 'lucide-react';

export default function ClientLoginModal({
    isOpen,
    onClose,
    handleLogin,
    handleSignup,
    siteContent
}) {
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', password: '' });
        setError('');
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let res;
            if (mode === 'login') {
                res = await handleLogin({
                    phone: formData.phone,
                    password: formData.password
                });
            } else {
                if (!formData.name) throw new Error("Full name is required.");
                res = await handleSignup(formData);
            }

            if (res.success) {
                resetForm();
                onClose();
            } else {
                setError(res.error || "Authentication failed.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.4)] flex flex-col"
                >
                    {/* Header Decorative Bar */}
                    <div className="h-2 w-full flex">
                        <div className="flex-1" style={{ backgroundColor: siteContent?.primaryColor }} />
                        <div className="flex-1" style={{ backgroundColor: siteContent?.secondaryColor }} />
                        <div className="flex-1 bg-amber-400" />
                    </div>

                    <div className="p-10 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full transition-all active:scale-95"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-10 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-gray-900 text-white flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                {mode === 'login' ? <LogIn size={28} /> : <UserPlus size={28} />}
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-2">
                                {mode === 'login' ? 'Royal Welcome' : 'Join the Legacy'}
                            </h2>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                                {mode === 'login' ? 'Access your KenteHaul account' : 'Register for an exclusive experience'}
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-3 border border-red-100"
                            >
                                <Lock size={14} className="shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ghana Ba"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[22px] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        required
                                        type="tel"
                                        placeholder="024 XXX XXXX"
                                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[22px] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {mode === 'signup' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email (Optional)</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            placeholder="royal@heritage.com"
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[22px] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Secret Access Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[22px] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 text-white rounded-[24px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:opacity-90 flex items-center justify-center gap-3 mt-4 disabled:opacity-70 group"
                                style={{ backgroundColor: siteContent?.primaryColor || '#4c1d95' }}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        {mode === 'login' ? 'Authenticate' : 'Create Account'}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-gray-50 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                {mode === 'login' ? "Don't have an account yet?" : "Already a royal member?"}
                            </p>
                            <button
                                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                                className="text-sm font-black text-gray-900 hover:opacity-70 transition-opacity flex items-center gap-2 mx-auto uppercase tracking-tighter"
                            >
                                <Sparkles size={16} className="text-amber-500" />
                                {mode === 'login' ? 'Register Private Profile' : 'Sign In to Dashboard'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
