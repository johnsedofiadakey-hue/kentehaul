import React, { useState } from 'react';
import { ShoppingBag, X, Minus, Plus, Smartphone, User, MapPin, Mail, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaystackButton } from './UIComponents';

export default function CartDrawer({
    isOpen,
    onClose,
    cart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    siteContent,
    onPaystackSuccess,
    onWhatsAppCheckout
}) {
    const [step, setStep] = useState('cart'); // 'cart' | 'details' | 'success'
    const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '', address: '' });
    const [shippingRegion, setShippingRegion] = useState('Accra');

    const shippingFees = {
        'Accra': 30,
        'Other Ghana': 70,
        'International': 250
    };

    const shippingFee = shippingFees[shippingRegion] || 0;
    const finalTotal = cartTotal + shippingFee;

    const isFormValid = customerForm.name.trim() && customerForm.phone.trim() && customerForm.address.trim();
    const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

    const handleClose = () => {
        onClose();
        setTimeout(() => setStep('cart'), 400);
    };

    const handleWhatsApp = () => {
        if (isFormValid) {
            onWhatsAppCheckout({ ...customerForm, shippingRegion, shippingFee, finalTotal });
            setStep('cart');
        }
    };

    const handlePaystack = (ref) => {
        onPaystackSuccess(ref, { ...customerForm, shippingRegion, shippingFee, finalTotal });
        setStep('cart');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
                    >
                        {/* HEADER */}
                        <div className="p-5 border-b flex items-center gap-4 bg-white">
                            {step === 'details' && (
                                <button onClick={() => setStep('cart')} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-90">
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <div className="flex-1">
                                <h2 className="text-xl font-black flex items-center gap-2" style={{ color: siteContent.primaryColor }}>
                                    {step === 'cart' && <><ShoppingBag size={20} /> Your Bag {cartCount > 0 && <span className="text-sm font-bold text-gray-400">({cartCount} items)</span>}</>}
                                    {step === 'details' && '📦 Delivery Details'}
                                    {step === 'success' && '✅ Order Placed!'}
                                </h2>
                                {step === 'cart' && cart.length > 0 && (
                                    <div className="flex gap-2 mt-1">
                                        <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: siteContent.primaryColor }} />
                                        <div className="flex-1 h-1 rounded-full bg-gray-200" />
                                    </div>
                                )}
                                {step === 'details' && (
                                    <div className="flex gap-2 mt-1">
                                        <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: siteContent.primaryColor }} />
                                        <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: siteContent.secondaryColor }} />
                                    </div>
                                )}
                            </div>
                            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </div>

                        {/* STEP 1: CART ITEMS */}
                        {step === 'cart' && (
                            <>
                                <div className="flex-grow overflow-y-auto">
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
                                            <ShoppingBag size={64} className="text-gray-200 mb-4" />
                                            <h3 className="font-black text-xl text-gray-300 mb-2">Your bag is empty</h3>
                                            <p className="text-gray-400 text-sm">Browse the shop and add items you love.</p>
                                            <button
                                                onClick={handleClose}
                                                className="mt-6 px-8 py-3 rounded-2xl font-bold text-white text-sm"
                                                style={{ backgroundColor: siteContent.primaryColor }}
                                            >
                                                Start Shopping
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-5 space-y-3">
                                            {cart.map(item => (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="flex gap-3 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100"
                                                >
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                                                        {item.image ? (
                                                            <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <Package size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-gray-900 truncate">{item.name}</h4>
                                                        <p className="text-xs text-gray-400">{item.subcategory || item.category}</p>
                                                        <p className="font-black text-sm mt-0.5" style={{ color: siteContent.secondaryColor }}>
                                                            ₵{(item.price * item.quantity).toLocaleString()}
                                                        </p>
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
                                    <div className="p-5 border-t bg-white safe-bottom">
                                        {/* Order summary */}
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-500">Subtotal ({cartCount} items)</span>
                                            <span className="font-black text-lg">₵{cartTotal.toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4">Delivery fee calculated at next step</p>
                                        <button
                                            onClick={() => setStep('details')}
                                            className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg"
                                            style={{ backgroundColor: siteContent.primaryColor }}
                                        >
                                            Proceed to Checkout →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* STEP 2: CUSTOMER DETAILS */}
                        {step === 'details' && (
                            <>
                                <div className="flex-grow overflow-y-auto p-5 space-y-4">
                                    {/* Order summary mini */}
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Order Summary</p>
                                        {cart.map(item => (
                                            <div key={item.id} className="flex justify-between items-center text-sm mb-2">
                                                <span className="text-gray-600 truncate flex-1 mr-2">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                                                <span className="font-bold flex-shrink-0">₵{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                            <div className="flex justify-between items-center text-sm text-gray-500">
                                                <span>Subtotal</span>
                                                <span>₵{cartTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-500">
                                                <span>Shipping ({shippingRegion})</span>
                                                <span>₵{shippingFee.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between font-black text-lg pt-2">
                                                <span>Total</span>
                                                <span style={{ color: siteContent.secondaryColor }}>₵{finalTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form fields */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Delivery Method</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.keys(shippingFees).map(region => (
                                                <button
                                                    key={region}
                                                    onClick={() => setShippingRegion(region)}
                                                    className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${shippingRegion === region ? 'bg-white shadow-sm border-gray-400' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                    style={{ borderLeft: shippingRegion === region ? `4px solid ${siteContent.secondaryColor}` : '' }}
                                                >
                                                    {region}
                                                    <div className="opacity-60">₵{shippingFees[region]}</div>
                                                </button>
                                            ))}
                                        </div>

                                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">Your Details</p>

                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Full Name *"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm"
                                                value={customerForm.name}
                                                onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                placeholder="Phone Number * (for delivery)"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm"
                                                value={customerForm.phone}
                                                onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                placeholder="Email (optional — for receipt)"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm"
                                                value={customerForm.email}
                                                onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative">
                                            <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                                            <textarea
                                                placeholder="Delivery Address * (e.g. Osu, Accra or full street address)"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm h-24 resize-none"
                                                value={customerForm.address}
                                                onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                                            />
                                        </div>
                                        {!isFormValid && (
                                            <p className="text-xs text-amber-600 font-bold text-center">* Name, phone, and address are required to proceed.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 border-t bg-white safe-bottom space-y-3">
                                    {/* Paystack */}
                                    <div className={!isFormValid ? 'opacity-40 pointer-events-none' : ''}>
                                        <PaystackButton
                                            amount={finalTotal}
                                            email={customerForm.email || "guest@kentehaul.com"}
                                            publicKey={siteContent.paystackPublicKey}
                                            onSuccess={handlePaystack}
                                            onClose={() => { }}
                                        />
                                    </div>
                                    {/* WhatsApp */}
                                    <button
                                        onClick={handleWhatsApp}
                                        disabled={!isFormValid}
                                        className="w-full bg-green-500 text-white py-4 rounded-2xl font-black text-sm hover:bg-green-600 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none shadow-lg"
                                    >
                                        <Smartphone size={18} /> Send Order via WhatsApp
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
