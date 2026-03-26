import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, 
    Truck, 
    CheckCircle2, 
    MapPin, 
    Clock, 
    Smartphone, 
    ChevronLeft, 
    ShieldCheck,
    Phone,
    MessageCircle,
    Copy,
    ExternalLink
} from 'lucide-react';

const STATUS_TIMELINE = [
    { status: 'Order Placed', icon: Clock, description: 'We have received your order.' },
    { status: 'Payment Confirmed', icon: ShieldCheck, description: 'Your payment was successful.' },
    { status: 'Preparing Order', icon: Package, description: 'We are hand-weaving your pieces.' },
    { status: 'Quality Check', icon: ShieldCheck, description: 'Final inspection of the Kente weave.' },
    { status: 'Rider Assigned', icon: Truck, description: 'A delivery rider has been assigned.' },
    { status: 'Out for Delivery', icon: MapPin, description: 'Rider is on the way to your location.' },
    { status: 'Delivered', icon: CheckCircle2, description: 'Order was successfully received.' }
];

export default function TrackingPage({ siteContent }) {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const unsub = onSnapshot(doc(db, "orders", orderId), (docSnap) => {
            if (docSnap.exists()) {
                setOrder({ id: docSnap.id, ...docSnap.data() });
            } else {
                setOrder(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Tracking error:", error);
            setLoading(false);
        });

        return () => unsub();
    }, [orderId]);

    const handleCopyId = () => {
        navigator.clipboard.writeText(orderId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-bold animate-pulse">Locating your order in the loom...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <Package size={40} />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Order Not Found</h1>
                <p className="text-gray-500 max-w-xs mb-8">We couldn't find an order with ID: <span className="font-bold text-gray-900">{orderId}</span>. Please check the ID and try again.</p>
                <Link to="/shop" className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                    Return to Shop
                </Link>
            </div>
        );
    }

    const currentStatusIndex = STATUS_TIMELINE.findIndex(s => s.status === order.status);
    const displayStatusIndex = currentStatusIndex === -1 ? 0 : currentStatusIndex;

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-6">
            <Helmet>
                <title>Track Order #{orderId} | KenteHaul</title>
                <meta name="description" content={`Track the real-time status of your KenteHaul order royal archive #${orderId}.`} />
            </Helmet>
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Back link */}
                <Link to="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-2 group">
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Back to Shop</span>
                </Link>

                {/* Main Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 md:p-10 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-1">Track Order</h1>
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleCopyId}>
                                    <span className="text-xs font-bold text-gray-400">Order ID:</span>
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider">{orderId}</span>
                                    <div className={`p-1 rounded-md transition-colors ${copied ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                        <Copy size={12} />
                                    </div>
                                </div>
                            </div>
                            <div 
                                className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[2px] self-start"
                                style={{ backgroundColor: siteContent.primaryColor + '10', color: siteContent.primaryColor }}
                            >
                                {order.status}
                            </div>
                        </div>

                        {/* Progress Bar (Visual) */}
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${((displayStatusIndex + 1) / STATUS_TIMELINE.length) * 100}%` }}
                                className="absolute top-0 left-0 h-full rounded-full"
                                style={{ backgroundColor: siteContent.secondaryColor }}
                            />
                        </div>
                    </div>

                    <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-1 gap-12">
                        {/* Timeline */}
                        <div className="space-y-8">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-2">Delivery Journey</h2>
                            <div className="space-y-6 relative">
                                {/* Vertical line */}
                                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100" />
                                
                                {STATUS_TIMELINE.map((step, idx) => {
                                    const isCompleted = idx <= displayStatusIndex;
                                    const isCurrent = idx === displayStatusIndex;
                                    const Icon = step.icon;

                                    return (
                                        <div key={step.status} className={`flex gap-6 relative z-10 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                            <div 
                                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${
                                                    isCompleted 
                                                    ? 'scale-110 shadow-lg' 
                                                    : 'bg-white border-gray-200'
                                                }`}
                                                style={{ 
                                                    backgroundColor: isCompleted ? siteContent.secondaryColor : 'white',
                                                    borderColor: isCompleted ? siteContent.secondaryColor : '#E5E7EB'
                                                }}
                                            >
                                                <Icon size={14} className={isCompleted ? 'text-white' : 'text-gray-300'} />
                                            </div>
                                            <div className="pt-0.5 min-w-0">
                                                <h3 className={`font-black text-sm uppercase tracking-wider mb-1 ${isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {step.status}
                                                    {isCurrent && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500 animate-ping" />}
                                                </h3>
                                                <p className="text-xs text-gray-400 leading-relaxed font-medium">{step.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rider & Action Buttons */}
                        {order.rider && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-amber-50/50 rounded-3xl p-6 border border-amber-100 flex flex-col md:flex-row items-center gap-6"
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-amber-100 shrink-0">
                                    <Truck size={32} className="text-amber-600" />
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Assigned Rider</p>
                                    <h3 className="text-lg font-black text-gray-900">{order.rider.name || 'Professional Rider'}</h3>
                                    <p className="text-xs text-gray-500 font-bold">{order.rider.company || 'KenteHaul Delivery Partner'}</p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <a 
                                        href={`tel:${order.rider.phone}`}
                                        className="flex-1 md:flex-none p-4 bg-white rounded-2xl text-gray-900 hover:bg-gray-900 hover:text-white transition-all border border-amber-100 shadow-sm flex items-center justify-center gap-3"
                                    >
                                        <Phone size={18} />
                                        <span className="text-xs font-black uppercase tracking-wider">Call</span>
                                    </a>
                                    <a 
                                        href={`https://wa.me/${order.rider.phone?.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 md:flex-none p-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-3"
                                    >
                                        <MessageCircle size={18} />
                                        <span className="text-xs font-black uppercase tracking-wider">WhatsApp</span>
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="bg-gray-50 border-t border-gray-100 p-8 md:p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-4">Shipping To</h3>
                                <div className="flex gap-3">
                                    <MapPin size={16} className="text-gray-400 shrink-0 mt-1" />
                                    <div>
                                        <p className="text-sm font-black text-gray-900 mb-1">{order.customer?.name}</p>
                                        <p className="text-xs text-gray-500 leading-relaxed font-medium">{order.customer?.address}</p>
                                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">{order.shippingRegion}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-4">Need Help?</h3>
                                <div className="space-y-3">
                                    <a 
                                        href={`https://wa.me/${siteContent.contactPhone?.replace(/[^0-9]/g, '')}?text=Help with Order ${orderId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-xs font-black text-gray-700 hover:text-amber-600 transition-colors group"
                                    >
                                        <Smartphone size={16} className="text-gray-400 group-hover:text-amber-500" />
                                        Chat with Support
                                    </a>
                                    <Link 
                                        to="/contact"
                                        className="flex items-center gap-3 text-xs font-black text-gray-700 hover:text-amber-600 transition-colors group"
                                    >
                                        <ExternalLink size={16} className="text-gray-400 group-hover:text-amber-500" />
                                        Contact Us
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Summary Mini */}
                <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Summary</p>
                        <p className="text-xs font-bold text-gray-900">{order.items?.length} Items Secured</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grand Total</p>
                        <p className="text-xl font-black" style={{ color: siteContent.secondaryColor }}>₵{order.total?.toLocaleString()}</p>
                    </div>
                </div>

                <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-[4px] py-10 opacity-30">Authentic KenteHaul Heritage</p>
            </div>
        </div>
    );
}
