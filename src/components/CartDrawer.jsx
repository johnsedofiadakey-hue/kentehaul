import React, { useState } from 'react';
import { ShoppingBag, X, Minus, Plus, Smartphone, User, MapPin, Mail, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaystackButton } from './UIComponents';
import PhoneInput from './PhoneInput';

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
    isProcessing
}) {
    const [step, setStep] = useState('cart'); // 'cart' | 'details' | 'success'
    const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '', address: '', riderName: '', riderPhone: '', riderCompany: '', pickupLocationId: '' });
    const [deliveryMethod, setDeliveryMethod] = useState('seller_rider'); // 'customer_rider' | 'seller_rider' | 'pickup'
    const [shippingRegion, setShippingRegion] = useState('Accra');
    const shippingRegions = siteContent.deliveryRegions || [
        { region: 'Accra', fee: 30 },
        { region: 'Other Ghana', fee: 70 },
        { region: 'International', fee: 250 }
    ];

    // Find current shipping fee based on selected region name
    const selectedRegion = shippingRegions.find(r => r.region === shippingRegion) || shippingRegions[0];
    const shippingFee = deliveryMethod === 'seller_rider' ? (selectedRegion?.fee || 0) : 0;
    const finalTotal = cartTotal + shippingFee;

    const isFormValid = customerForm.name.trim() && customerForm.phone.trim() && 
        (deliveryMethod === 'pickup' ? customerForm.pickupLocationId : customerForm.address.trim()) &&
        (deliveryMethod !== 'customer_rider' || (customerForm.riderName.trim() && customerForm.riderPhone.trim()));
    const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

    const handleClose = () => {
        onClose();
        setTimeout(() => setStep('cart'), 400);
    };

    const handleWhatsApp = () => {
        if (isFormValid) {
            onWhatsAppCheckout({ ...customerForm, deliveryMethod, shippingRegion, shippingFee, finalTotal });
            setStep('cart');
        }
    };

    const handlePaystack = (ref) => {
        onPaystackSuccess(ref, { ...customerForm, deliveryMethod, shippingRegion, shippingFee, finalTotal });
        setStep('cart');
    };

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
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-white/80 backdrop-blur-md z-[400] flex flex-col items-center justify-center p-6 text-center"
                            >
                                <div className="w-20 h-20 border-4 border-gray-100 border-t-amber-500 rounded-full animate-spin mb-6" />
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Processing Order</h3>
                                <p className="text-gray-500 font-bold max-w-xs">We are weaving your order into our system securely. Please do not close this window.</p>
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
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                    className="flex gap-4 items-center bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
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
                                            className="shimmer-premium w-full py-5 rounded-[24px] font-black text-white text-sm uppercase tracking-[3px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1"
                                            style={{ backgroundColor: siteContent.primaryColor }}
                                        >
                                            Secure Checkout
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
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">How do you want to receive your order?</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                <button
                                                    onClick={() => setDeliveryMethod('seller_rider')}
                                                    className={`py-4 px-5 text-left rounded-3xl border transition-all ${deliveryMethod === 'seller_rider' ? 'bg-white shadow-md border-gray-400 border-l-[6px]' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                    style={{ borderLeftColor: deliveryMethod === 'seller_rider' ? siteContent.secondaryColor : '' }}
                                                >
                                                    <p className="font-black text-sm text-gray-900">Arrange Rider for Me</p>
                                                    <p className="text-[10px] text-gray-500">We will find a rider and deliver to your doorstep.</p>
                                                </button>
                                                <button
                                                    onClick={() => setDeliveryMethod('customer_rider')}
                                                    className={`py-4 px-5 text-left rounded-3xl border transition-all ${deliveryMethod === 'customer_rider' ? 'bg-white shadow-md border-gray-400 border-l-[6px]' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                    style={{ borderLeftColor: deliveryMethod === 'customer_rider' ? siteContent.primaryColor : '' }}
                                                >
                                                    <p className="font-black text-sm text-gray-900">I will send my own rider</p>
                                                    <p className="text-[10px] text-gray-500">Provide rider details so we can release the order.</p>
                                                </button>
                                                <button
                                                    onClick={() => setDeliveryMethod('pickup')}
                                                    className={`py-4 px-5 text-left rounded-3xl border transition-all ${deliveryMethod === 'pickup' ? 'bg-white shadow-md border-gray-400 border-l-[6px]' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                    style={{ borderLeftColor: deliveryMethod === 'pickup' ? '#22c55e' : '' }}
                                                >
                                                    <p className="font-black text-sm text-gray-900">Pickup from Store</p>
                                                    <p className="text-[10px] text-gray-500">Collect your order directly from our workshop.</p>
                                                </button>
                                            </div>
                                        </div>

                                        {deliveryMethod === 'seller_rider' && (
                                            <div className="space-y-3 animate-fade-in">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Select Delivery Region</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {shippingRegions.map(r => (
                                                        <button
                                                            key={r.region}
                                                            onClick={() => setShippingRegion(r.region)}
                                                            className={`py-3 px-4 text-left rounded-2xl border transition-all ${shippingRegion === r.region ? 'bg-white shadow-md border-gray-400' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                            style={{ borderLeft: shippingRegion === r.region ? `4px solid ${siteContent.secondaryColor}` : '' }}
                                                        >
                                                            <div className="text-[10px] font-black uppercase tracking-wider">{r.region}</div>
                                                            <div className="text-xs font-black" style={{ color: shippingRegion === r.region ? siteContent.primaryColor : '' }}>₵{r.fee}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {deliveryMethod === 'customer_rider' && (
                                            <div className="space-y-3 animate-fade-in">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Rider Details</p>
                                                <input
                                                    type="text"
                                                    placeholder="Rider Name *"
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
                                                    type="text"
                                                    placeholder="Dispatch Company (Optional)"
                                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm"
                                                    value={customerForm.riderCompany}
                                                    onChange={e => setCustomerForm({ ...customerForm, riderCompany: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        {/* Delivery Summary Mini */}
                                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                            <div className="flex justify-between items-center text-sm mb-1">
                                                <span className="text-gray-500">Method</span>
                                                <span className="font-bold capitalize">{deliveryMethod.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Delivery Fee</span>
                                                <span className="font-black text-amber-600">₵{shippingFee}</span>
                                            </div>
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
                                        <PhoneInput
                                            placeholder="Phone Number * (for delivery)"
                                            value={customerForm.phone}
                                            onChange={val => setCustomerForm({ ...customerForm, phone: val })}
                                        />
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
                                        {deliveryMethod === 'pickup' && (
                                            <div className="space-y-3 animate-fade-in">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Select Pickup Workshop</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {(siteContent.pickupLocations || [{ name: 'KenteHaul Workshop', address: 'Accra, Ghana', mapsLink: '' }]).map((loc, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setCustomerForm({ ...customerForm, pickupLocationId: loc.name })}
                                                            className={`py-4 px-5 text-left rounded-3xl border transition-all ${customerForm.pickupLocationId === loc.name ? 'bg-white shadow-md border-gray-400 border-l-[6px]' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                            style={{ borderLeftColor: customerForm.pickupLocationId === loc.name ? '#22c55e' : '' }}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <p className="font-black text-sm text-gray-900">{loc.name}</p>
                                                                {loc.mapsLink && (
                                                                    <a href={loc.mapsLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-blue-500 transition-colors">
                                                                        <MapPin size={12} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 mt-1">{loc.address}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative">
                                            <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                                            <textarea
                                                placeholder={deliveryMethod === 'pickup' ? 'Selected Pickup Point' : 'Delivery Address * (e.g. Osu, Accra or full street address)'}
                                                className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-gray-400 outline-none transition font-medium text-sm h-24 resize-none ${deliveryMethod === 'pickup' ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                                                value={deliveryMethod === 'pickup' ? (customerForm.pickupLocationId ? `${customerForm.pickupLocationId}\n${siteContent.pickupLocations?.find(l => l.name === customerForm.pickupLocationId)?.address || ''}` : 'Please select a location above') : customerForm.address}
                                                onChange={e => deliveryMethod !== 'pickup' && setCustomerForm({ ...customerForm, address: e.target.value })}
                                                readOnly={deliveryMethod === 'pickup'}
                                            />
                                        </div>
                                        {!isFormValid && (
                                            <p className="text-xs text-amber-600 font-bold text-center">* Name, phone, and address are required to proceed.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 border-t bg-white safe-bottom space-y-3">
                                    {/* Paystack */}
                                    {siteContent.paystackEnabled !== false && (
                                        <div className={!isFormValid ? 'opacity-40 pointer-events-none' : ''}>
                                            <PaystackButton
                                                amount={finalTotal}
                                                email={customerForm.email || "guest@kentehaul.com"}
                                                publicKey={siteContent.paystackPublicKey}
                                                onSuccess={handlePaystack}
                                                onClose={() => { }}
                                            />
                                        </div>
                                    )}
                                    {/* WhatsApp */}
                                    {siteContent.whatsappEnabled !== false && (
                                        <button
                                            onClick={handleWhatsApp}
                                            disabled={!isFormValid}
                                            className="shimmer-premium w-full bg-green-500 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-[2px] hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:pointer-events-none shadow-[0_15px_30px_rgba(34,197,94,0.2)]"
                                        >
                                            <Smartphone size={20} className="animate-pulse" /> Confirm on WhatsApp
                                        </button>
                                    )}
                                    {siteContent.paystackEnabled === false && siteContent.whatsappEnabled === false && (
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
