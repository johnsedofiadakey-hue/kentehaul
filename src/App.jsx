import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  updateDoc,
  getDoc,
  writeBatch,
  increment,
  serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from './firebase';

// --- IMPORTING DEFAULT DATA (Fallback) ---
import {
  INITIAL_CONTENT,
  INITIAL_FEEDBACK,
  INITIAL_GALLERY,
  generateOrderId
} from './data/constants';

// --- IMPORTING COMPONENTS ---
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// --- IMPORTING COMPONENTS (LAZY LOADED) ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
const Home = lazy(() => import('./components/PageViews').then(module => ({ default: module.Home })));
const Heritage = lazy(() => import('./components/PageViews').then(module => ({ default: module.Heritage })));
const Institute = lazy(() => import('./components/PageViews').then(module => ({ default: module.Institute })));
const Contact = lazy(() => import('./components/PageViews').then(module => ({ default: module.Contact })));
const Shop = lazy(() => import('./components/Shop'));
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import OrderTrackingModal from './components/OrderTrackingModal';
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
import AdminLoginModal from './components/AdminLoginModal';
import TrackingPage from './components/TrackingPage';

// Protected Route Component
function AdminLoginRequired({ setIsAdminLoginOpen }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    setIsAdminLoginOpen(true);
    navigate('/');
  }, [navigate, setIsAdminLoginOpen]);

  return null;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // 1. REAL-TIME DATA STATE (Syncs with Cloud)
  // ==========================================
  // --- ANALYTICS & PIXEL INITIALIZATION ---
  useEffect(() => {
    const gaId = 'G-XXXXXXXXXX'; 
    if (gaId !== 'G-XXXXXXXXXX') {
      const script = document.createElement('script');
      script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag('js', new Date()); gtag('config', gaId);
    }
    const pixelId = 'PIXEL_ID';
    if (pixelId !== 'PIXEL_ID') {
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', pixelId); fbq('track', 'PageView');
    }
  }, []);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [siteContent, setSiteContent] = useState(() => {
    // Try to load cached theme from localStorage first
    const cached = localStorage.getItem('kente_theme');
    return cached ? JSON.parse(cached) : INITIAL_CONTENT;
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // ==========================================
  // 2. UI & NAVIGATION STATE
  // ==========================================
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('kente_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentCategory, setCurrentCategory] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Logic & Interaction State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Order Tracking State
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);

  // ==========================================
  // 3. FIREBASE REAL-TIME LISTENERS
  // ==========================================
  useEffect(() => {

    // A. Listen to Site Settings (Logo, Colors, Hero Text)
    const unsubContent = onSnapshot(doc(db, "settings", "siteContent"), (doc) => {
      if (doc.exists()) {
        const themeData = doc.data();
        setSiteContent(themeData);
        // Cache theme in localStorage to prevent FOUC on next load
        localStorage.setItem('kente_theme', JSON.stringify(themeData));
      } else {
        // Use default constants if database is empty
        setSiteContent(INITIAL_CONTENT);
        localStorage.setItem('kente_theme', JSON.stringify(INITIAL_CONTENT));
      }
    });

    // B. Listen to Products (CRITICAL: DATA TYPE SANITIZATION)
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const sanitizedProducts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          // Ensure price and stock are treated as Math Numbers for the Shop filters
          price: typeof data.price === 'number' ? data.price : parseFloat(data.price || 0),
          stockQuantity: typeof data.stockQuantity === 'number' ? data.stockQuantity : parseInt(data.stockQuantity || data.stock || 0),
          sku: data.sku || ''
        };
      });
      setProducts(sanitizedProducts);
    });

    // C. (Orders listener moved to Admin Auth effect)

    // D. (Customers listener moved to Admin Auth effect)

    // E. Listen to Photo Gallery
    const unsubGallery = onSnapshot(collection(db, "gallery"), (snapshot) => {
      setGallery(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    // F. Listen to Client Feedback
    const unsubFeedback = onSnapshot(collection(db, "feedbacks"), (snapshot) => {
      setFeedbacks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    // G. Listen to Auth State
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@kentehaul.com') {
        setIsAdminAuthenticated(true);
        if (isAdminLoginOpen) {
          setIsAdminLoginOpen(false);
        }
      } else {
        setIsAdminAuthenticated(false);
        if (user) signOut(auth);
      }
    });

    // Cleanup all listeners when the application closes
    return () => {
      unsubContent();
      unsubProducts();
      // Orders & Customers cleanup handled in their own effect
      unsubGallery();
      unsubFeedback();
      unsubAuth();
    };
  }, []);

  // Centralized Navigation for Admin
  useEffect(() => {
    if (isAdminAuthenticated && location.pathname === '/') {
      navigate('/admin');
    }
  }, [isAdminAuthenticated, location.pathname, navigate]);

  // ==========================================
  // 3b. ADMIN DATA LISTENERS (Secure)
  // ==========================================
  useEffect(() => {
    if (!isAdminAuthenticated) {
      setOrders([]);
      setCustomers([]);
      return;
    }

    // C. Listen to All Orders (Admin Only)
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    // D. Listen to Customer Database (CRM) (Admin Only)
    const unsubCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => {
      unsubOrders();
      unsubCustomers();
    };
  }, [isAdminAuthenticated]);

  // ==========================================
  // 4. PERSISTENCE & HELPERS
  // ==========================================

  // Save Cart to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kente_cart', JSON.stringify(cart));
  }, [cart]);

  // CRM Helper: Removed in favor of Atomic Batches in checkout handlers

  // ==========================================
  // 5. NAVIGATION & ACTION HANDLERS
  // ==========================================

  // ==========================================
  // 6. E-COMMERCE CORE LOGIC
  // ==========================================

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < (product.stockQuantity ?? product.stock ?? 0)) {
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        setIsCartOpen(true);
      } else {
        alert("Maximum available stock reached for this item.");
      }
    } else {
      if ((product.stockQuantity ?? product.stock ?? 0) > 0) {
        setCart([...cart, { ...product, quantity: 1 }]);
        setIsCartOpen(true);
      } else {
        alert("This item is currently out of stock.");
      }
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const maxStock = product ? (product.stockQuantity ?? product.stock ?? 999) : 999;
        const newQuantity = Math.max(1, item.quantity + delta);
        if (newQuantity <= maxStock) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // --- ATOMIC CHECKOUT LOGIC (Robust Firestore Writes) ---

  const onWhatsAppCheckout = async (customerForm) => {
    setIsProcessing(true);
    try {
      const orderId = `WA-${Date.now()}`;
      const batch = writeBatch(db);

      // 1. Record/Update Customer Profile (CRM)
      const cleanPhone = customerForm.phone.replace(/[^0-9]/g, '') || `cust-${Date.now()}`;
      const custRef = doc(db, "customers", cleanPhone);
      batch.set(custRef, {
        name: customerForm.name,
        email: customerForm.email || '',
        phone: customerForm.phone,
        address: customerForm.address || '',
        totalSpent: increment(customerForm.finalTotal || cartTotal),
        lastOrder: serverTimestamp(),
        orderIds: increment(1) // Just a counter or we could use arrayUnion
      }, { merge: true });

      // 2. Save Official Order
      const orderRef = doc(db, "orders", orderId);
      batch.set(orderRef, {
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
        items: cart,
        total: customerForm.finalTotal || cartTotal,
        shippingRegion: customerForm.shippingRegion || 'Accra',
        shippingFee: customerForm.shippingFee || 0,
        deliveryMethod: customerForm.deliveryMethod || 'seller_rider',
        status: 'Order Placed',
        method: 'WhatsApp Order',
        customer: customerForm
      });

      // 3. Deduction of Stock (Atomic)
      for (const item of cart) {
        const prodRef = doc(db, "products", item.id);
        batch.update(prodRef, {
          stockQuantity: increment(-item.quantity)
        });
      }

      // 4. Trigger Email (if provided)
      if (customerForm.email) {
        const mailRef = doc(db, "mail", `receipt-${orderId}`);
        batch.set(mailRef, {
          to: customerForm.email,
          message: {
            subject: `Pending: Your KenteHaul Order #${orderId} 🎉`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;"><h1 style="color: #4F46E5;">Thank You!</h1><p>Hi ${customerForm.name}, we've received your order request. <strong>Order ID: #${orderId}</strong></p><p>Track your weaving progress here: <a href="${window.location.origin}/track/${orderId}">${window.location.origin}/track/${orderId}</a></p></div>`
          }
        });
      }

      // COMMIT ALL OR NOTHING
      await batch.commit();

      // Construct Professional WhatsApp Message
      let message = `*KENTEHAUL ORDER:* ${orderId}\n\n`;
      cart.forEach(item => { message += `• ${item.name} x${item.quantity} - ₵${item.price * item.quantity}\n`; });
      message += `\n*Method:* ${customerForm.deliveryMethod.replace('_', ' ')}`;
      if (customerForm.deliveryMethod === 'pickup') message += `\n*Pickup at:* ${customerForm.pickupLocationId}`;
      message += `\n*Total:* ₵${customerForm.finalTotal}`;
      message += `\n\n*TRACKING:* ${window.location.origin}/track/${orderId}`;

      setCart([]);
      setIsCartOpen(false);
      
      setTimeout(() => {
        window.open(`https://wa.me/${siteContent.contactPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
      }, 500);

    } catch (error) {
      console.error("Atomic Checkout Failed:", error);
      alert("System Busy: We couldn't secure your order right now. Please try again in 30 seconds.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaystackSuccess = async (reference, customerForm) => {
    setIsProcessing(true);
    try {
      const orderId = reference.reference;
      const batch = writeBatch(db);

      // 1. CRM
      const cleanPhone = customerForm.phone.replace(/[^0-9]/g, '') || `cust-${Date.now()}`;
      const custRef = doc(db, "customers", cleanPhone);
      batch.set(custRef, {
        name: customerForm.name,
        email: customerForm.email || '',
        phone: customerForm.phone,
        address: customerForm.address || '',
        totalSpent: increment(customerForm.finalTotal || cartTotal),
        lastOrder: serverTimestamp(),
        orderIds: increment(1)
      }, { merge: true });

      // 2. PAID Order
      const orderRef = doc(db, "orders", orderId);
      batch.set(orderRef, {
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
        items: cart,
        total: customerForm.finalTotal || cartTotal,
        shippingRegion: customerForm.shippingRegion || 'Accra',
        shippingFee: customerForm.shippingFee || 0,
        deliveryMethod: customerForm.deliveryMethod || 'seller_rider',
        status: 'Payment Confirmed',
        method: 'Paystack Card/Momo',
        customer: customerForm
      });

      // 3. Stock
      for (const item of cart) {
        const prodRef = doc(db, "products", item.id);
        batch.update(prodRef, { stockQuantity: increment(-item.quantity) });
      }

      // COMMIT
      await batch.commit();

      setCart([]);
      setIsCartOpen(false);
      alert(`Success! Payment received and Order #${orderId} is being prepared.`);
    } catch (error) {
      console.error("Atomic Payment Write Failed:", error);
      alert("Payment was successful, but database sync failed. Keep your reference: " + reference.reference);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleBuy = (product) => {
    const message = `Hello KenteHaul! I am interested in purchasing: *${product.name}* (Price: ₵${product.price}). Is this item available in stock?`;
    window.open(`https://wa.me/${siteContent.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // --- ORDER TRACKING LOGIC ---
  const handleTrackOrder = async () => {
    const cleanInput = trackingInput.trim().toUpperCase();
    if (!cleanInput) { alert("Please enter an Order ID."); return; }
    setIsTrackingOpen(false);
    navigate(`/track/${cleanInput}`);
  };

  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-gray-800 flex flex-col overflow-x-hidden">
      <ScrollToTop />

      {!isAdminPath && (
        <Navbar
          siteContent={siteContent}
          cart={cart}
          setIsCartOpen={setIsCartOpen}
          setIsTrackingOpen={setIsTrackingOpen}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        cartTotal={cartTotal}
        siteContent={siteContent}
        isProcessing={isProcessing}
        onPaystackSuccess={handlePaystackSuccess}
        onWhatsAppCheckout={onWhatsAppCheckout}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        addToCart={addToCart}
        onSingleBuy={handleSingleBuy}
        siteContent={siteContent}
        allProducts={products}
        onOpenProduct={setSelectedProduct}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        trackingInput={trackingInput}
        setTrackingInput={setTrackingInput}
        trackingResult={trackingResult}
        handleTrackOrder={handleTrackOrder}
        siteContent={siteContent}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        siteContent={siteContent}
      />

      <main className="flex-grow">
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-pulse text-xl font-light">Loading Kente Heritage...</div></div>}>
          <Routes>
            <Route path="/" element={<Home siteContent={siteContent} gallery={gallery} feedbacks={feedbacks} />} />
            <Route path="/heritage" element={<Heritage siteContent={siteContent} />} />
            <Route path="/shop" element={<Shop products={products} currentCategory={currentCategory} searchQuery={searchQuery} setSearchQuery={setSearchQuery} addToCart={addToCart} handleSingleBuy={handleSingleBuy} setSelectedProduct={setSelectedProduct} siteContent={siteContent} />} />
            <Route path="/institute" element={<Institute siteContent={siteContent} products={products} />} />
            <Route path="/contact" element={<Contact siteContent={siteContent} />} />
            <Route path="/track/:orderId" element={<TrackingPage siteContent={siteContent} />} />
            <Route path="/admin" element={isAdminAuthenticated ? (
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin text-4xl">⌛</div></div>}>
                <AdminDashboard siteContent={siteContent} setSiteContent={setSiteContent} products={products} orders={orders} setOrders={setOrders} gallery={gallery} setGallery={setGallery} feedbacks={feedbacks} setFeedbacks={setFeedbacks} customers={customers} setIsAdminAuthenticated={setIsAdminAuthenticated} />
              </Suspense>
            ) : <AdminLoginRequired setIsAdminLoginOpen={setIsAdminLoginOpen} />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdminPath && (
        <Footer
          siteContent={siteContent}
          onAdminClick={() => {
            if (isAdminAuthenticated) navigate('/admin');
            else setIsAdminLoginOpen(true);
          }}
        />
      )}
    </div>
  );
}