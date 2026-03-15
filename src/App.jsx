import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDoc
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
  // currentPage state removed in favor of Router
  const [isCartOpen, setIsCartOpen] = useState(false);
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

  // CRM Helper: Automatically updates/creates customer profile upon purchase
  const handleCustomerData = async (form, orderId, orderTotal) => {
    // ID creation logic: Use phone number as the key to prevent duplicate profiles
    const cleanPhone = form.phone.replace(/[^0-9]/g, '');
    const existing = customers.find(c => c.id === cleanPhone || c.phone === form.phone);

    if (existing) {
      // Update existing customer profile stats
      await updateDoc(doc(db, "customers", existing.id), {
        name: form.name,
        address: form.address,
        email: form.email || existing.email,
        totalSpent: (existing.totalSpent || 0) + orderTotal,
        orderIds: [orderId, ...(existing.orderIds || [])],
        lastOrderDate: new Date().toLocaleDateString()
      });
    } else {
      // Create a brand new customer profile
      const newId = cleanPhone || `cust-${Date.now()}`;
      await setDoc(doc(db, "customers", newId), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        totalSpent: orderTotal,
        orderIds: [orderId],
        joinedDate: new Date().toLocaleDateString(),
        lastOrderDate: new Date().toLocaleDateString()
      });
    }
  };

  // ==========================================
  // 5. NAVIGATION & ACTION HANDLERS
  // ==========================================

  // Updated Navigation Fix: Ensures category clicks take you to the Shop
  // handleNavClick removed in favor of react-router-dom Link components
  // const handleNavClick = (page, category = null) => {
  //   // Legacy handler kept temporarily for prop compatibility, but functionality moved to Links
  //   // In a full refactor, we would remove this and update child components to not ask for it.
  //   // For now, we will assume children might still call it, so we leave it as a no-op or partial.
  //   if (category) setCurrentCategory(category);
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  // };

  // Admin login is now handled by onAuthStateChanged

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

  // --- CHECKOUT LOGIC ---

  const handleCartWhatsApp = async (customerForm) => {
    if (cart.length === 0) return;

    const orderId = generateOrderId('WA');

    try {
      // Step 1: Update CRM History
      await handleCustomerData(customerForm, orderId, cartTotal);

      // Step 2: Save Order to Database
      await setDoc(doc(db, "orders", orderId), {
        date: new Date().toLocaleDateString(),
        createdAt: new Date(),
        items: cart,
        total: customerForm.finalTotal || cartTotal,
        shippingRegion: customerForm.shippingRegion || 'Accra',
        shippingFee: customerForm.shippingFee || 0,
        deliveryMethod: customerForm.deliveryMethod || 'seller_rider',
        status: 'Order Placed',
        method: 'WhatsApp Checkout',
        customer: customerForm
      });

      // Step 2b: Update Stock Levels
      for (const item of cart) {
        const prodRef = doc(db, "products", item.id);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const currentStock = prodSnap.data().stockQuantity ?? prodSnap.data().stock ?? 0;
          await updateDoc(prodRef, {
            stockQuantity: Math.max(0, currentStock - item.quantity)
          });
        }
      }

      // Step 3: Construct Professional WhatsApp Message
      let message = `*KENTEHAUL ORDER:* ${orderId}\n\n`;
      cart.forEach(item => {
        message += `• ${item.name} (${item.sku || 'N/A'}) x${item.quantity} - ₵${item.price * item.quantity}\n`;
      });
      message += `\n*Subtotal:* ₵${cartTotal}`;
      message += `\n*Delivery (${customerForm.deliveryMethod.replace('_', ' ')}):* ₵${customerForm.shippingFee}`;
      message += `\n*Total:* ₵${customerForm.finalTotal}`;
      message += `\n\n*CLIENT DETAILS:*`;
      message += `\nName: ${customerForm.name}`;
      message += `\nPhone: ${customerForm.phone}`;
      if (customerForm.deliveryMethod !== 'pickup') {
        message += `\nAddress: ${customerForm.address}`;
      }
      if (customerForm.deliveryMethod === 'customer_rider') {
        message += `\n\n*RIDER DETAILS:*`;
        message += `\nName: ${customerForm.riderName}`;
        message += `\nPhone: ${customerForm.riderPhone}`;
        if (customerForm.riderCompany) message += `\nCompany: ${customerForm.riderCompany}`;
      }
      message += `\n\n*Track Order:* ${window.location.origin}/track/${orderId}`;

      // Step 3.5: Trigger Automated Email Receipt
      if (customerForm.email) {
        await setDoc(doc(db, "mail", `receipt-${orderId}`), {
          to: customerForm.email,
          message: {
            subject: `Your KenteHaul Order #${orderId} is Confirmed! 🎉`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #4F46E5;">Thank you for your order!</h1>
                <p>Hi ${customerForm.name},</p>
                <p>We've received your WhatsApp order request. <strong>Order ID: #${orderId}</strong></p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Order Summary:</h3>
                  ${cart.map(item => `<div>• ${item.name} (x${item.quantity}) - ₵${item.price * item.quantity}</div>`).join('')}
                  <p><strong>Grand Total: ₵${cartTotal}</strong></p>
                </div>
                <p>We'll be in touch shortly via WhatsApp to confirm delivery details.</p>
                <p>— The KenteHaul Team</p>
              </div>
            `
          }
        });
      }

      // Step 4: Clear State & Redirect
      setCart([]);
      setIsCartOpen(false);

      setTimeout(() => {
        alert(`Order Placed Successfully! Your Order ID is: ${orderId}`);
        window.open(`https://wa.me/${siteContent.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
      }, 500);

    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Network timeout. The order could not be saved to the database.");
    }
  };

  const handlePaystackSuccess = async (reference, customerForm) => {
    try {
      // Step 1: Record Customer Purchase History
      await handleCustomerData(customerForm, reference.reference, cartTotal);

      // Step 2: Record Official Paid Order
      await setDoc(doc(db, "orders", reference.reference), {
        date: new Date().toLocaleDateString(),
        createdAt: new Date(),
        items: cart,
        total: customerForm.finalTotal || cartTotal,
        shippingRegion: customerForm.shippingRegion || 'Accra',
        shippingFee: customerForm.shippingFee || 0,
        deliveryMethod: customerForm.deliveryMethod || 'seller_rider',
        status: 'Payment Confirmed',
        method: 'Paystack Card/Momo',
        customer: customerForm
      });

      // Step 2b: Update Stock Levels
      for (const item of cart) {
        const prodRef = doc(db, "products", item.id);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const currentStock = prodSnap.data().stockQuantity ?? prodSnap.data().stock ?? 0;
          await updateDoc(prodRef, {
            stockQuantity: Math.max(0, currentStock - item.quantity)
          });
        }
      }

      // Step 3: Trigger Automated Email Receipt
      if (customerForm.email) {
        await setDoc(doc(db, "mail", `receipt-${reference.reference}`), {
          to: customerForm.email,
          message: {
            subject: `Payment Confirmed: KenteHaul Order #${reference.reference} 🎉`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #4F46E5;">Order Confirmed!</h1>
                <p>Hi ${customerForm.name},</p>
                <p>Your payment has been successfully processed. <strong>Order ID: #${reference.reference}</strong></p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Order Summary:</h3>
                  ${cart.map(item => `<div>• ${item.name} (x${item.quantity}) - ₵${item.price * item.quantity}</div>`).join('')}
                  <p><strong>Grand Total: ₵${cartTotal}</strong></p>
                </div>
                <p>Our team is now preparing your items for delivery. We'll contact you shortly.</p>
                <p>— The KenteHaul Team</p>
              </div>
            `
          }
        });
      }

      setCart([]);
      setIsCartOpen(false);
      alert(`Payment Confirmed! Your official Order ID is: ${reference.reference}`);
    } catch (error) {
      console.error("Payment Capture Error:", error);
      alert("Payment was successful, but we had trouble saving the order. Please contact support with reference: " + reference.reference);
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

  // Detect admin route to hide public elements
  const isAdminPath = location.pathname.startsWith('/admin');

  // ==========================================
  // 7. MAIN RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-gray-800 flex flex-col overflow-x-hidden">
      <ScrollToTop />

      {/* GLOBAL NAVBAR */}
      {!isAdminPath && (
        <Navbar
          siteContent={siteContent}
          cart={cart}
          setIsCartOpen={setIsCartOpen}
          setIsTrackingOpen={setIsTrackingOpen}
        />
      )}

      {/* OVERLAY DRAWERS & MODALS */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        cartTotal={cartTotal}
        siteContent={siteContent}
        onPaystackSuccess={handlePaystackSuccess}
        onWhatsAppCheckout={handleCartWhatsApp}
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

      {/* MAIN DYNAMIC CONTENT ROUTING */}
      <main className="flex-grow">
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-pulse text-xl font-light">Loading Kente Heritage...</div></div>}>
          <Routes>
            <Route path="/" element={
              <Home
                siteContent={siteContent}
                gallery={gallery}
                feedbacks={feedbacks}
              // onNavClick={handleNavClick} // Removed
              />
            } />

            <Route path="/heritage" element={
              <Heritage
                siteContent={siteContent}
              // onNavClick={handleNavClick} // Removed
              />
            } />

            <Route path="/shop" element={
              <Shop
                products={products}
                currentCategory={currentCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                addToCart={addToCart}
                handleSingleBuy={handleSingleBuy}
                setSelectedProduct={setSelectedProduct}
                siteContent={siteContent}
              />
            } />

            <Route path="/institute" element={
              <Institute
                siteContent={siteContent}
                products={products}
              />
            } />

            <Route path="/contact" element={
              <Contact
                siteContent={siteContent}
              />
            } />

            <Route path="/track/:orderId" element={
              <TrackingPage
                siteContent={siteContent}
              />
            } />

            <Route path="/admin" element={
              isAdminAuthenticated ? (
                <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin text-4xl">⌛</div></div>}>
                  <AdminDashboard
                    siteContent={siteContent}
                    setSiteContent={setSiteContent}
                    products={products}
                    orders={orders}
                    setOrders={setOrders}
                    gallery={gallery}
                    setGallery={setGallery}
                    feedbacks={feedbacks}
                    setFeedbacks={setFeedbacks}
                    customers={customers}
                    setIsAdminAuthenticated={setIsAdminAuthenticated}
                  />
                </Suspense>
              ) : (
                <AdminLoginRequired setIsAdminLoginOpen={setIsAdminLoginOpen} />
              )
            } />
          </Routes>
        </Suspense>
      </main>

      {/* GLOBAL FOOTER */}
      {!isAdminPath && (
        <Footer
          siteContent={siteContent}
          onAdminClick={() => {
            if (isAdminAuthenticated) {
              navigate('/admin');
            } else {
              setIsAdminLoginOpen(true);
            }
          }}
        />
      )}
    </div>
  );
}