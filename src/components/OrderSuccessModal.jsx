import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Truck, Share2, Smartphone, X, ArrowRight, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccessModal({ 
    isOpen, 
    onClose, 
    orderId = 'PENDING', 
    totalAmount = 0, 
    items = [],
    whatsappUrl,
    siteContent,
    setIsTrackingOpen 
}) {
    const [renderError, setRenderError] = useState(false);
    const navigate = useNavigate();

    // Resilience: Fallback for missing theme data
    const sc = siteContent || { primaryColor: '#5b0143', secondaryColor: '#f97316' };
    
    if (!isOpen) return null;

    // --- SAFETY HELPERS ---
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
    const displayTotal = typeof totalAmount === 'number' ? totalAmount : Number(totalAmount) || 0;

    const shareOrder = () => {
        try {
            if (navigator.share) {
                navigator.share({
                    title: 'My KenteHaul Order',
                    text: `I just ordered authentic royal Kente from KenteHaul! Order #${orderId}`,
                    url: window.location.origin
                }).catch(console.error);
            }
        } catch (e) { console.error("Share failed:", e); }
    };

    const whatsappContact = () => {
        const phone = (sc?.contactPhone || '').replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${phone}?text=Hello, I have a question about my order #${orderId}`, '_blank');
    };

    // --- FALLBACK UI (Simple Receipt) ---
    // If the complex UI fails or we force it, show this simple robust view
    if (renderError) {
        return (
            <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-gray-900/90 backdrop-blur-md">
                <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Check size={32} />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Order Confirmed!</h2>
                    <p className="text-gray-500 text-sm mb-6">Your payment was successful and your order is being processed.</p>
                    
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
                        <div className="flex justify-between text-xs font-black uppercase text-gray-400">
                            <span>Order Number</span>
                            <span className="text-gray-900">#{orderId}</span>
                        </div>
                        <div className="flex justify-between text-xs font-black uppercase text-gray-400">
                            <span>Total Paid</span>
                            <span className="text-gray-900">₵{displayTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                    >
                        Close Receipt
                    </button>
                </div>
            </div>
        );
    }

    // --- MAIN ROBUST UI ---
    try {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 40 }}
                        className="relative w-full max-w-2xl bg-white rounded-[40px] md:rounded-[60px] shadow-[0_50px_100px_rgba(0,0,0,0.2)] overflow-hidden"
                    >
                        {/* Top Accent Decoration */}
                        <div className="absolute top-0 left-0 w-full h-2 flex">
                            <div className="flex-1 bg-amber-500"></div>
                            <div className="flex-1 bg-red-600"></div>
                            <div className="flex-1 bg-purple-600"></div>
                            <div className="flex-1 bg-blue-600"></div>
                            <div className="flex-1 bg-green-600"></div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-2xl transition-colors z-10"
                        >
                            <X size={24} className="text-gray-400" />
                        </button>

                        <div className="flex flex-col md:flex-row h-full">
                            {/* Visual Side */}
                            <div className="w-full md:w-[40%] relative min-h-[200px] md:min-h-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${sc.primaryColor}, ${sc.secondaryColor})` }}>
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex flex-col justify-end p-8">
                                    <div className="w-12 h-12 rounded-[18px] bg-white text-gray-900 flex items-center justify-center shadow-2xl mb-4">
                                        <Check size={24} strokeWidth={3} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">Confirmed</h2>
                                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[3px]">Order Received</p>
                                </div>
                            </div>

                            {/* Info Side */}
                            <div className="w-full md:w-[60%] p-8 md:p-10">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[4px] mb-1">Order Number</p>
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase">{orderId}</h3>
                                            <div className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-green-100 flex items-center gap-1">
                                                Active
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-1 gap-3">
                                        {whatsappUrl && (
                                            <button 
                                                onClick={() => window.open(whatsappUrl, '_blank')}
                                                className="w-full flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg"
                                            >
                                                <Smartphone size={16} /> Confirm on WhatsApp
                                            </button>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => { onClose(); navigate(`/track/${orderId}`); }}
                                                className="flex items-center justify-center gap-2 p-4 bg-gray-900 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                                            >
                                                <Truck size={14} /> Track
                                            </button>
                                            <button 
                                                onClick={whatsappContact}
                                                className="flex items-center justify-center gap-2 p-4 bg-gray-50 text-gray-500 rounded-[20px] font-black text-[10px] uppercase tracking-widest border border-gray-100 hover:bg-gray-100 transition-all active:scale-95"
                                            >
                                                <Smartphone size={14} /> Support
                                            </button>
                                        </div>
                                    </div>

                                    {/* Order Items Summary */}
                                    {safeItems.length > 0 && (
                                        <div className="pt-4 border-t border-gray-50">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Items</p>
                                            <div className="max-h-[120px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                {safeItems.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs">
                                                        <span className="font-bold text-gray-900 truncate max-w-[70%]">{item?.name || 'Item'} <span className="text-gray-400">×{item?.quantity || 1}</span></span>
                                                        <span className="font-black text-gray-900">₵{((item?.price || 0) * (item?.quantity || 1)).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Paid</p>
                                            <p className="text-xl font-black text-gray-900 tracking-tight" style={{ color: sc?.secondaryColor }}>₵{displayTotal.toLocaleString()}</p>
                                        </div>
                                        <button 
                                            onClick={shareOrder}
                                            className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition-colors"
                                        >
                                            <Share2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    } catch (error) {
        console.error("OrderSuccessModal Render Error:", error);
        setRenderError(true);
        return null; // Next cycle will show fallback
    }
}
