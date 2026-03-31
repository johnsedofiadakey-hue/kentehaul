import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Truck, Share2, Smartphone, X, ExternalLink, ArrowRight } from 'lucide-react';

export default function OrderSuccessModal({ 
    isOpen, 
    onClose, 
    orderId, 
    totalAmount, 
    siteContent,
    setIsTrackingOpen 
}) {
    if (!isOpen) return null;

    const shareOrder = () => {
        if (navigator.share) {
            navigator.share({
                title: 'My KenteHaul Order',
                text: `I just ordered authentic royal Kente from KenteHaul! Order #${orderId}`,
                url: window.location.origin
            }).catch(console.error);
        }
    };

    const whatsappContact = () => {
        const phone = (siteContent.contactPhone || '').replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${phone}?text=Hello, I have a question about my order #${orderId}`, '_blank');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
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
                        <div className="w-full md:w-[40%] bg-gray-900 relative min-h-[250px] md:min-h-full">
                            <img 
                                src={siteContent.heroImage || "https://images.unsplash.com/photo-1590666014404-5f50ba56008d?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=600"} 
                                alt="Success" 
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                                <div className="w-16 h-16 rounded-[24px] bg-white text-gray-900 flex items-center justify-center shadow-2xl mb-6">
                                    <Check size={32} strokeWidth={3} />
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">Confirmed</h2>
                                <p className="text-white/60 text-xs font-black uppercase tracking-[3px]">Royal Heritage Secured</p>
                            </div>
                        </div>

                        {/* Info Side */}
                        <div className="w-full md:w-[60%] p-8 md:p-12 md:py-16">
                            <div className="space-y-8">
                                <div>
                                    <p className="text-xs font-black text-amber-500 uppercase tracking-[4px] mb-2">Order Reference</p>
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase">{orderId}</h3>
                                        <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-green-100 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Active
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-500 font-bold leading-relaxed">
                                    Your order has been successfully recorded in the royal archives. We are now preparing your authentic Kente for its journey.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => { setIsTrackingOpen(true); onClose(); }}
                                        className="flex items-center justify-between p-5 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all group overflow-hidden relative shadow-xl active:scale-95"
                                    >
                                        <span className="relative z-10 flex items-center gap-3"><Truck size={18} /> Track Order</span>
                                        <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>

                                    <button 
                                        onClick={whatsappContact}
                                        className="flex items-center justify-center gap-3 p-5 bg-green-50 text-green-600 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-green-100 transition-all border border-green-100 active:scale-95"
                                    >
                                        <Smartphone size={18} /> Support
                                    </button>
                                </div>

                                <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-6 justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Payment Received</p>
                                        <p className="text-xl font-black text-gray-800 tracking-tight">₵{totalAmount?.toLocaleString()}</p>
                                    </div>
                                    <button 
                                        onClick={shareOrder}
                                        className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                                    >
                                        <Share2 size={16} /> Share Achievement
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
