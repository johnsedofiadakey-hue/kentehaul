import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  writeBatch,
  increment,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getToken, onMessage } from "firebase/messaging";
import { db, auth, messaging } from './firebase';

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
import LegalView from './components/LegalView';

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
  useEffect(() => {
    // Dynamic Google Analytics
    const gaId = siteContent.googleAnalyticsId; 
    if (gaId && gaId !== 'G-XXXXXXXXXX') {
      const script = document.createElement('script');
      script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag('js', new Date()); gtag('config', gaId);
    }

    // Dynamic Facebook Pixel
    const pixelId = siteContent.facebookPixelId;
    if (pixelId && pixelId !== 'PIXEL_ID') {
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
  }, [siteContent.googleAnalyticsId, siteContent.facebookPixelId]);

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
  // 3c. ADMIN PUSH NOTIFICATIONS (FCM)
  // ==========================================
  useEffect(() => {
    if (!isAdminAuthenticated || !messaging) return;

    const setupNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Get FCM Token (User should replace VAPID_KEY with their actual key from Firebase Console)
          const token = await getToken(messaging, { 
            vapidKey: 'YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE_CONSOLE'
          });
          
          if (token) {
            console.log("FCM Token registered:", token);
            // Store token in settings/siteContent so the admin can receive alerts
            await updateDoc(doc(db, "settings", "siteContent"), {
              adminFcmToken: token,
              lastTokenUpdate: serverTimestamp()
            });
          }
        }
      } catch (err) {
        console.error("FCM Registration failed:", err);
      }
    };

    setupNotifications();

    // Listen for foreground messages
    const unsubMessaging = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      // You could use a toast library here for better UX
      alert(`🔔 New Order! ${payload.notification.title}: ${payload.notification.body}`);
    });

    return () => unsubMessaging();
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
    console.log("Starting WhatsApp Checkout:", { customerForm, cart });
    
    try {
      const orderId = `WA-${Date.now()}`;
      const batch = writeBatch(db);

      // Ensure all numbers are clean
      const totalAmount = Number(customerForm.finalTotal || cartTotal) || 0;
      const shippingAmount = Number(customerForm.shippingFee) || 0;

      // 1. Record/Update Customer Profile (CRM)
      const phoneInput = String(customerForm.phone || '');
      const cleanPhone = phoneInput.replace(/[^0-9]/g, '') || `cust-${Date.now()}`;
      const custRef = doc(db, "customers", cleanPhone);
      
      batch.set(custRef, {
        name: customerForm.name,
        email: customerForm.email || '',
        phone: customerForm.phone,
        address: customerForm.address || '',
        totalSpent: increment(totalAmount),
        lastOrder: serverTimestamp(),
        orderCount: increment(1)
      }, { merge: true });

      // 2. Save Official Order
      const orderRef = doc(db, "orders", orderId);
      batch.set(orderRef, {
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
        items: cart,
        total: totalAmount,
        shippingRegion: customerForm.shippingRegion || 'Accra',
        shippingFee: shippingAmount,
        deliveryMethod: customerForm.deliveryMethod || 'seller_rider',
        status: 'Order Placed',
        method: 'WhatsApp Order',
        customer: {
            ...customerForm,
            finalTotal: totalAmount,
            shippingFee: shippingAmount
        }
      });

      // 3. Deduction of Stock (Atomic)
      for (const item of cart) {
        if (!item.id) continue;
        const prodRef = doc(db, "products", item.id);
        batch.update(prodRef, {
          stockQuantity: increment(-Number(item.quantity || 1))
        });
      }

      // 4. Trigger Professional Email Receipt
      if (customerForm.email) {
        try {
          const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
              <div style="background-color: ${siteContent.primaryColor || '#4c1d95'}; padding: 40px 20px; text-align: center; color: white; border-radius: 16px 16px 0 0;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 900;">Order Received!</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">We've started weaving your story, ${customerForm.name}.</p>
              </div>
              <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 16px 16px; background-color: #fff;">
                <p style="font-size: 16px; margin-bottom: 25px;">Hello <strong>${customerForm.name}</strong>,</p>
                <p style="margin-bottom: 25px;">Thank you for choosing KenteHaul! Your order <strong>#${orderId}</strong> is now in our system and awaiting processing.</p>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                  <h3 style="margin: 0 0 15px; font-size: 14px; text-transform: uppercase; color: #6b7280; letter-spacing: 1px;">Order Summary</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    ${cart.map(item => `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-weight: bold; display: block;">${item.name}</span>
                          <span style="font-size: 12px; color: #6b7280;">Quantity: ${item.quantity}</span>
                        </td>
                        <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">₵${(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    `).join('')}
                    <tr>
                      <td style="padding-top: 15px; font-weight: bold;">Total Paid</td>
                      <td style="padding-top: 15px; text-align: right; font-weight: 900; font-size: 18px; color: ${siteContent.secondaryColor || '#f97316'};">₵${totalAmount.toLocaleString()}</td>
                    </tr>
                  </table>
                </div>

                <div style="text-align: center; margin-top: 35px;">
                  <a href="${window.location.origin}/track/${orderId}" style="background-color: ${siteContent.primaryColor || '#4c1d95'}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Track Your Order</a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 35px 0;" />
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">&copy; 2026 KenteHaul Ghana. All rights reserved.</p>
              </div>
            </div>
          `;

          await addDoc(collection(db, "mail"), {
            to: customerForm.email,
            message: {
              subject: `KenteHaul Order Confirmed #${orderId}`,
              html: emailHtml
            }
          });
        } catch (emailErr) {
          console.warn("Mail trigger failed:", emailErr);
        }
      }

      // COMMIT ALL OR NOTHING
      await batch.commit();

      // Construct Professional WhatsApp Message
      let message = `*KENTEHAUL ORDER:* ${orderId}\n\n`;
      cart.forEach(item => { message += `• ${item.name} x${item.quantity} - ₵${item.price * item.quantity}\n`; });
      message += `\n*Method:* ${(customerForm.deliveryMethod || 'rider').replace('_', ' ')}`;
      if (customerForm.deliveryMethod === 'pickup') message += `\n*Pickup at:* ${customerForm.pickupLocationId}`;
      message += `\n*Total:* ₵${totalAmount}`;
      message += `\n\n*TRACKING:* ${window.location.origin}/track/${orderId}`;

      setCart([]);
      setIsCartOpen(false);
      
      const whatsappPhone = (siteContent.contactPhone || '').replace(/[^0-9]/g, '');
      setTimeout(() => {
        window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }, 500);

    } catch (error) {
      console.error("Atomic Checkout Failed (onWhatsAppCheckout):", error);
      alert(`Checkout failed: ${error.message || "System Busy"}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaystackSuccess = async (reference, customerForm) => {
    setIsProcessing(true);
    console.log("Paystack Success - Syncing to Database:", { reference, customerForm });
    
    try {
      const orderId = reference.reference;
      const batch = writeBatch(db);

      const totalAmount = Number(customerForm.finalTotal || cartTotal) || 0;
      const shippingAmount = Number(customerForm.shippingFee) || 0;

      // 1. CRM
      const phoneInput = String(customerForm.phone || '');
      const cleanPhone = phoneInput.replace(/[^0-9]/g, '') || `cust-${Date.now()}`;
      const custRef = doc(db, "customers", cleanPhone);
      
      batch.set(custRef, {
        name: customerForm.name,
        email: customerForm.email || '',
        phone: customerForm.phone,
        address: customerForm.address || '',
        totalSpent: increment(totalAmount),
        lastOrder: serverTimestamp(),
        orderCount: increment(1)
      }, { merge: true });

      // 2. PAID Order
      const orderRef = doc(db, "orders", orderId);
      batch.set(orderRef, {
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
        items: cart,
        total: totalAmount,
        shippingRegion: customerForm.shippingRegion || 'Accra',
        shippingFee: shippingAmount,
        deliveryMethod: customerForm.deliveryMethod || 'seller_rider',
        status: 'Payment Confirmed',
        method: 'Paystack Card/Momo',
        customer: {
            ...customerForm,
            finalTotal: totalAmount,
            shippingFee: shippingAmount
        }
      });

      // 3. Stock
      for (const item of cart) {
        if (!item.id) continue;
        const prodRef = doc(db, "products", item.id);
        batch.update(prodRef, { 
            stockQuantity: increment(-Number(item.quantity || 1)) 
        });
      }

      // 4. Trigger Professional Email Receipt
      try {
        const orderSummaryHtml = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="background-color: ${siteContent.primaryColor || '#4c1d95'}; padding: 40px 20px; text-align: center; color: white; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900;">Payment Successful!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Your KenteHaul order is now being prepared, ${customerForm.name}.</p>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 16px 16px; background-color: #fff;">
              <p style="font-size: 16px; margin-bottom: 25px;">Hello <strong>${customerForm.name}</strong>,</p>
              <p style="margin-bottom: 25px;">Great news! We've received your payment for order <strong>#${orderId}</strong>. Our master weavers are now getting ready to work on your items.</p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px; font-size: 14px; text-transform: uppercase; color: #6b7280; letter-spacing: 1px;">What's Next?</h3>
                <p style="margin: 0; font-size: 14px;">You can track the real-time status of your order by clicking the button below. We'll also notify you once it's ready for delivery.</p>
              </div>

              <div style="text-align: center; margin-top: 35px;">
                <a href="${window.location.origin}/track/${orderId}" style="background-color: ${siteContent.primaryColor || '#4c1d95'}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Track Progress</a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 35px 0;" />
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">&copy; 2026 KenteHaul Ghana. All rights reserved.</p>
            </div>
          </div>
        `;

        await addDoc(collection(db, "mail"), {
          to: customerForm.email,
          message: {
            subject: `KenteHaul Payment Confirmed - Order #${orderId}`,
            html: orderSummaryHtml
          }
        });
      } catch (emailErr) {
        console.warn("Mail trigger for Paystack failed:", emailErr);
      }

      // COMMIT
      await batch.commit();

      setCart([]);
      setIsCartOpen(false);
      alert(`Success! Payment received and Order #${orderId} is being prepared.`);
    } catch (error) {
      console.error("Atomic Payment Write Failed (handlePaystackSuccess):", error);
      alert("Payment was successful, but database sync failed. Error: " + error.message + ". Keep your reference: " + reference.reference);
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
      <Helmet>
        <title>KenteHaul | Authentic Ghanaian Kente Cloth & Heritage</title>
        <meta name="description" content="KenteHaul is Ghana's premier destination for authentic, hand-woven Kente cloth. Discover our royal heritage and modern styles." />
        <link rel="canonical" href={window.location.origin + location.pathname} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.origin + location.pathname} />
        <meta property="og:title" content="KenteHaul | Authentic Ghanaian Kente Cloth & Heritage" />
        <meta property="og:description" content="Discover the royalty of Ghanaian weaving. Hand-crafted Kente cloth for weddings, graduations, and cultural excellence." />
        <meta property="og:image" content={siteContent.logo || `${window.location.origin}/logo.png`} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={window.location.origin + location.pathname} />
        <meta property="twitter:title" content="KenteHaul | Authentic Ghanaian Kente Cloth & Heritage" />
        <meta property="twitter:description" content="Discover the royalty of Ghanaian weaving. Hand-crafted Kente cloth for weddings, graduations, and cultural excellence." />
        <meta property="twitter:image" content={siteContent.logo || `${window.location.origin}/logo.png`} />

        {/* Structured Data: Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "KenteHaul",
            "url": window.location.origin,
            "logo": siteContent.logo || `${window.location.origin}/logo.png`,
            "sameAs": [
              siteContent.instagramLink || "https://instagram.com/kentehaul",
              "https://tiktok.com/@kentehaul"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": siteContent.contactPhone,
              "contactType": "customer service",
              "email": siteContent.contactEmail
            }
          })}
        </script>
      </Helmet>

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
            <Route path="/privacy-policy" element={<LegalView title="Privacy Policy" content={siteContent.privacyPolicy} siteContent={siteContent} type="privacy" />} />
            <Route path="/terms-conditions" element={<LegalView title="Terms & Conditions" content={siteContent.termsConditions} siteContent={siteContent} type="terms" />} />
            <Route path="/refund-policy" element={<LegalView title="Refund & Return Policy" content={siteContent.refundPolicy} siteContent={siteContent} type="refund" />} />
            <Route path="/admin" element={isAdminAuthenticated ? (
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin text-4xl">⌛</div></div>}>
                <AdminDashboard siteContent={siteContent} setSiteContent={setSiteContent} products={products} orders={orders} setOrders={setOrders} gallery={gallery} setGallery={setGallery} feedbacks={feedbacks} setFeedbacks={feedbacks} customers={customers} setIsAdminAuthenticated={setIsAdminAuthenticated} />
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