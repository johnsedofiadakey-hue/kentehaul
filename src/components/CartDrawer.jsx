import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Minus, Plus, Smartphone, User, MapPin, Mail, ArrowLeft, ArrowRight, Package, Clock, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaystackButton } from './UIComponents';
import PhoneInput from './PhoneInput';
import { generateOrderId } from '../data/constants';

const LS_KEY = 'kh_customer';

function loadCustomer() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
function saveCustomer(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ name: data.name, phone: data.phone, email: data.email })); } catch {}
}

// steps: 'cart' → 'you' → 'deliver'
export default function CartDrawer({
    isOpen,
    onClose,
    cart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    siteContent,
    onPaystackSuccess,
    onWhatsAppCheckout,
    isProcessing,
    onForceClearProcessing
}) {
    const [step, setStep] = useState('cart');
    const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '', address: '', landmark: '', riderName: '', riderPhone: '', riderCompany: '', pickupLocationId: '' });
    const [deliveryMethod, setDeliveryMethod] = useState('seller_rider');
    const [shippingRegion, setShippingRegion] = useState('Accra');
    const [regionSearch, setRegionSearch] = useState('');
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);

    // Pre-fill from localStorage when drawer opens
    useEffect(() => {
        if (isOpen) {
            const saved = loadCustomer();
            if (saved.name || saved.phone || saved.email) {
                setCustomerForm(prev => ({ ...prev, name: saved.name || '', phone: saved.phone || '', email: saved.email || '' }));
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (isProcessing) {
            const interval = setInterval(() => setLoadingStep(prev => (prev + 1) % 3), 1500);
            return () => clearInterval(interval);
        }
    }, [isProcessing]);

    const shippingRegions = siteContent?.deliveryRegions || [
        { region: 'Accra', fee: 30 },
        { region: 'Other Ghana', fee: 70 },
        { region: 'International', fee: 250 }
    ];
    const sortedRegions = [...shippingRegions].sort((a, b) => {
        const aO = /^outside/i.test(a.region), bO = /^outside/i.test(b.region);
        if (aO !== bO) return aO ? 1 : -1;
        return a.region.localeCompare(b.region);
    });
    const visibleRegions = regionSearch.trim()
        ? sortedRegions.filter(r => r.region.toLowerCase().includes(regionSearch.trim().toLowerCase()))
        : sortedRegions;

    const selectedRegion = shippingRegions.find(r => r.region === shippingRegion) || shippingRegions[0];
    const shippingFee = deliveryMethod === 'seller_rider' ? (selectedRegion?.fee || 0) : 0;
    const finalTotal = cartTotal + shippingFee;
    const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

    const isValidEmail = /^\S+@\S+\.\S+$/.test(customerForm.email.trim());
    const isYouValid = customerForm.name.trim() && customerForm.phone.trim() && isValidEmail;
    const isDeliverValid = isYouValid &&
        (deliveryMethod === 'pickup' ? customerForm.pickupLocationId : customerForm.address.trim()) &&
        (deliveryMethod !== 'customer_rider' || (customerForm.riderName.trim() && customerForm.riderPhone.trim()));

    const primary = siteContent?.primaryColor || '#5b0143';
    const secondary = siteContent?.secondaryColor || '#f97316';

    const STEPS = ['cart', 'you', 'deliver'];
    const stepIndex = STEPS.indexOf(step);

    const handleClose = () => {
        onClose();
        setTimeout(() => setStep('cart'), 400);
    };

    const goToYou = () => {
        if (!activeOrderId) setActiveOrderId(generateOrderId());
        setStep('you');
    };

    const goToDeliver = () => {
        saveCustomer(customerForm);
        setStep('deliver');
    };

    const handleWhatsApp = async () => {
        if (!isDeliverValid) return;
        saveCustomer(customerForm);
        try {
            await onWhatsAppCheckout({ ...customerForm, items: cart, deliveryMethod, shippingRegion, shippingFee, finalTotal, orderId: activeOrderId || generateOrderId() });
        } catch (err) {
            console.error('WhatsApp Checkout Error:', err);
        }
    };

    const handlePaystack = async (ref) => {
        saveCustomer(customerForm);
        try {
            await onPaystackSuccess(ref, { ...customerForm, items: cart, deliveryMethod, shippingRegion, shippingFee, finalTotal, orderId: activeOrderId });
        } catch (err) {
            console.error('Paystack Checkout Error:', err);
        }
    };

    const StepDots = () => (
        <div className="flex gap-1.5 mt-2">
            {STEPS.map((s, i) => (
                <div
                    key={s}
                    className={`h-1 rounded-full transition-all duration-300 ${i <= stepIndex ? 'flex-[2]' : 'flex-1 bg-gray-200'}`}
                    style={{ backgroundColor: i <= stepIndex ? (i === 2 ? secondary : primary) : '' }}
                />
            ))}
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 z-[300] backdrop-blur-sm"
                    />

                    {/* PROCESSING OVERLAY */}
                    <AnimatePresence>
                        {isProcessing && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[400] flex flex-col items-center justify-center p-8 text-center"
                            >
                                <div className="relative mb-8">
                                    <div className="w-24 h-24 border-4 border-gray-100 border-t-amber-500 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ShoppingBag size={24} className="text-amber-500 animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Processing Order</h3>
                                <div className="h-6 overflow-hidden mb-10">
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={loadingStep}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-gray-500 font-extrabold uppercase text-[10px] tracking-[2px]"
                                        >
                                            {loadingStep === 0 && 'Connecting...'}
                                            {loadingStep === 1 && 'Checking items...'}
                                            {loadingStep === 2 && 'Preparing your order...'}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                                {siteContent?.contactPhone && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 }}
                                        className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 shadow-sm flex flex-col items-center max-w-xs space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Taking a while?</p>
                                        </div>
                                        <a
                                            href={`https://wa.me/${siteContent.contactPhone.replace(/[^0-9]/g, '')}?text=My order is taking a moment to process. Can you please check the status?`}
                                            className="w-full px-6 py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-[2px] border border-amber-200 shadow-sm text-center"
                                        >
                                            Chat on WhatsApp
                                        </a>
                                        <motion.button
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }}
                                            onClick={onForceClearProcessing}
                                            className="w-full px-6 py-3 bg-amber-200 text-amber-900 rounded-2xl font-black text-[9px] uppercase tracking-[2px] active:scale-95 transition-all"
                                        >
                                            Show my Order
                                        </motion.button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[310] shadow-2xl flex flex-col"
                    >
                        {/* HEADER */}
                        <div className="p-5 border-b flex items-center gap-4 bg-white">
                            {step !== 'cart' && (
                                <button onClick={() => setStep(step === 'deliver' ? 'you' : 'cart')} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-90">
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <div className="flex-1">
                                <h2 className="text-xl font-black flex items-center gap-2" style={{ color: primary }}>
                                    {step === 'cart' && <><ShoppingBag size={20} /> Your Bag {cartCount > 0 && <span className="text-sm font-bold text-gray-400">({cartCount})</span>}</>}
                                    {step === 'you' && '👋 Your Info'}
                                    {step === 'deliver' && '🚚 Delivery'}
                                </h2>
                                {cart.length > 0 && <StepDots />}
                            </div>
                            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </div>

                        {/* STEP 1: CART */}
                        {step === 'cart' && (
                            <>
                                <div className="flex-grow overflow-y-auto">
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
                                            <ShoppingBag size={64} className="text-gray-200 mb-4" />
                                            <h3 className="font-black text-xl text-gray-300 mb-2">Your bag is empty</h3>
                                            <p className="text-gray-400 text-sm">Browse the shop and add items you love.</p>
                                            <button onClick={handleClose} className="mt-6 px-8 py-3 rounded-2xl font-bold text-white text-sm" style={{ backgroundColor: primary }}>
                                                Start Shopping
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-5 space-y-3">
                                            {cart.map(item => (
                                                <motion.div
                                                    key={item.id} layout
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                    className="flex gap-4 items-center bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                                                        {item.image
                                                            ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                                            : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={20} /></div>
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-gray-900 truncate">{item.name}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs text-gray-400">{item.subcategory || item.category}</p>
                                                            {item.isPreorder && (
                                                                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                                                                    <Clock size={10} /> Pre-Order ({item.preorderDays || 14}d)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="font-black text-sm mt-0.5" style={{ color: secondary }}>
                                                                ₵{((siteContent?.flashSaleEnabled ? item.price : (item.originalPrice || item.price)) * item.quantity).toLocaleString()}
                                                            </p>
                                                            {siteContent?.flashSaleEnabled && item.originalPrice > item.price && (
                                                                <p className="text-xs text-gray-400 line-through">₵{(item.originalPrice * item.quantity).toLocaleString()}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                                            <X size={14} />
                                                        </button>
                                                        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg hover:bg-gray-100 active:scale-90 transition-all flex items-center justify-center">
                                                                <Minus size={11} />
                                                            </button>
                                                            <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg hover:bg-gray-100 active:scale-90 transition-all flex items-center justify-center">
                                                                <Plus size={11} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {cart.length > 0 && (
                                    <div className="p-5 border-t bg-white">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-500">Subtotal ({cartCount} items)</span>
                                            <span className="font-black text-lg">₵{cartTotal.toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4">+ Delivery fee (next step)</p>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={goToYou}
                                            className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[2px] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3"
                                        >
                                            Checkout <ArrowRight size={18} />
                                        </motion.button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* STEP 2: YOUR INFO */}
                        {step === 'you' && (
                            <>
                                <div className="flex-grow overflow-y-auto p-5 space-y-4">
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-2">
                                        <p className="text-xs text-gray-400 font-bold">
                                            {cart.length} item{cart.length > 1 ? 's' : ''} · ₵{cartTotal.toLocaleString()} + delivery
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Who are we delivering to?</p>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Full Name *"
                                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm"
                                                    value={customerForm.name}
                                                    onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                                                />
                                            </div>
                                            <PhoneInput
                                                placeholder="Phone Number *"
                                                value={customerForm.phone}
                                                onChange={val => setCustomerForm({ ...customerForm, phone: val })}
                                            />
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="email"
                                                    placeholder="Email * (order confirmation)"
                                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm"
                                                    value={customerForm.email}
                                                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                                            We'll send your order confirmation and tracking link to your email. No spam, ever.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-5 border-t bg-white">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={goToDeliver}
                                        disabled={!isYouValid}
                                        className="w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-[2px] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:pointer-events-none text-white"
                                        style={{ backgroundColor: primary }}
                                    >
                                        Set Delivery <ArrowRight size={18} />
                                    </motion.button>
                                </div>
                            </>
                        )}

                        {/* STEP 3: DELIVERY + PAY */}
                        {step === 'deliver' && (
                            <>
                                <div className="flex-grow overflow-y-auto p-5 space-y-5">
                                    {/* How? */}
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">How do you want to receive your order?</p>
                                        <div className="space-y-2">
                                            {[
                                                { id: 'seller_rider', title: 'Send me a rider', desc: 'We arrange a rider to deliver to your address.' },
                                                { id: 'customer_rider', title: 'I\'ll send my own rider', desc: 'Provide rider info so we can release the order.' },
                                                { id: 'pickup', title: 'Pickup from Store', desc: 'Collect directly from our workshop.' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setDeliveryMethod(opt.id)}
                                                    className={`w-full py-4 px-5 text-left rounded-2xl border transition-all ${deliveryMethod === opt.id ? 'bg-white shadow-md border-l-4' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                    style={{ borderLeftColor: deliveryMethod === opt.id ? secondary : '' }}
                                                >
                                                    <p className="font-black text-sm text-gray-900">{opt.title}</p>
                                                    <p className="text-[10px] text-gray-500">{opt.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Region picker */}
                                    {deliveryMethod === 'seller_rider' && (
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Delivery Region</p>
                                            {shippingRegions.length > 8 && (
                                                <div className="relative mb-2">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                                    <input
                                                        type="text" value={regionSearch} onChange={e => setRegionSearch(e.target.value)}
                                                        placeholder="Search your area..."
                                                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                                                    />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                                {visibleRegions.map(r => (
                                                    <button
                                                        key={r.region}
                                                        onClick={() => setShippingRegion(r.region)}
                                                        className={`py-3 px-4 text-left rounded-2xl border transition-all ${shippingRegion === r.region ? 'bg-white shadow-md border-l-4' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                        style={{ borderLeftColor: shippingRegion === r.region ? secondary : '' }}
                                                    >
                                                        <div className="text-[10px] font-black uppercase tracking-wider">{r.region}</div>
                                                        <div className="text-xs font-black" style={{ color: shippingRegion === r.region ? primary : '' }}>₵{r.fee}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Own rider details */}
                                    {deliveryMethod === 'customer_rider' && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Rider Details</p>
                                            <input
                                                type="text" placeholder="Rider Name *"
                                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm"
                                                value={customerForm.riderName}
                                                onChange={e => setCustomerForm({ ...customerForm, riderName: e.target.value })}
                                            />
                                            <PhoneInput
                                                placeholder="Rider Phone *"
                                                value={customerForm.riderPhone}
                                                onChange={val => setCustomerForm({ ...customerForm, riderPhone: val })}
                                            />
                                            <input
                                                type="text" placeholder="Dispatch Company (Optional)"
                                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm"
                                                value={customerForm.riderCompany}
                                                onChange={e => setCustomerForm({ ...customerForm, riderCompany: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {/* Pickup location */}
                                    {deliveryMethod === 'pickup' && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Pickup Point</p>
                                            {(siteContent?.pickupLocations || [{ name: 'KenteHaul Workshop', address: 'Accra, Ghana', mapsLink: '' }]).map((loc, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCustomerForm({ ...customerForm, pickupLocationId: loc.name })}
                                                    className={`w-full py-4 px-5 text-left rounded-2xl border transition-all ${customerForm.pickupLocationId === loc.name ? 'bg-white shadow-md border-l-4' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                    style={{ borderLeftColor: customerForm.pickupLocationId === loc.name ? '#22c55e' : '' }}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-black text-sm text-gray-900">{loc.name}</p>
                                                        {loc.mapsLink && (
                                                            <a href={loc.mapsLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-blue-500 transition-colors">
                                                                <MapPin size={12} />
                                                            </a>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">{loc.address}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Address */}
                                    {deliveryMethod !== 'pickup' && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Address</p>
                                            <div className="relative">
                                                <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                                                <textarea
                                                    placeholder="Area / Street Address * (e.g. Osu, Ring Road)"
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm h-20 resize-none"
                                                    value={customerForm.address}
                                                    onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Landmark (optional — e.g. Near Shell station)"
                                                className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm"
                                                value={customerForm.landmark}
                                                onChange={e => setCustomerForm({ ...customerForm, landmark: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Subtotal</span><span>₵{cartTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-amber-600 font-bold">
                                            <span>Delivery ({deliveryMethod === 'seller_rider' ? shippingRegion : deliveryMethod === 'pickup' ? 'Pickup' : 'Own Rider'})</span>
                                            <span>{shippingFee === 0 ? 'Free' : `+ ₵${shippingFee.toLocaleString()}`}</span>
                                        </div>
                                        <div className="flex justify-between font-black text-base pt-2 border-t border-gray-200">
                                            <span>Total</span>
                                            <span style={{ color: secondary }}>₵{finalTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 border-t bg-white space-y-3">
                                    {siteContent?.paystackEnabled !== false && (
                                        <div className={!isDeliverValid ? 'opacity-40 pointer-events-none' : ''}>
                                            <PaystackButton
                                                amount={finalTotal}
                                                email={customerForm.email || 'guest@kentehaul.com'}
                                                publicKey={siteContent?.paystackPublicKey}
                                                onSuccess={handlePaystack}
                                                onClose={() => {}}
                                                primaryColor={primary}
                                                secondaryColor={secondary}
                                                metadata={{
                                                    orderId: activeOrderId,
                                                    items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image || '' })),
                                                    customer: { ...customerForm, deliveryMethod, shippingRegion, shippingFee, finalTotal },
                                                    source: 'web_cart'
                                                }}
                                            />
                                        </div>
                                    )}
                                    {siteContent?.whatsappEnabled !== false && (
                                        <button
                                            onClick={handleWhatsApp}
                                            disabled={!isDeliverValid}
                                            className="shimmer-premium w-full bg-green-500 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-[2px] hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:pointer-events-none shadow-[0_15px_30px_rgba(34,197,94,0.2)]"
                                        >
                                            <Smartphone size={20} className="animate-pulse" /> Confirm on WhatsApp
                                        </button>
                                    )}
                                    {siteContent?.paystackEnabled === false && siteContent?.whatsappEnabled === false && (
                                        <p className="text-xs text-center text-gray-400 italic font-bold py-4">Checkout is currently unavailable. Please contact us.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
