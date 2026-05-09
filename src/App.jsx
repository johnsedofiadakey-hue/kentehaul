import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import OrderSuccessModal from './components/OrderSuccessModal';
import ErrorBoundary from './components/ErrorBoundary';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  limit,
  orderBy,
  writeBatch,
  increment,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import debounce from 'lodash.debounce';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getToken, onMessage } from "firebase/messaging";
import { db, auth, messaging, analytics, logEvent } from './firebase';

// --- IMPORTING DEFAULT DATA (Fallback) ---
import {
  INITIAL_CONTENT,
  INITIAL_FEEDBACK,
  INITIAL_GALLERY,
  generateOrderId,
  hashPassword
} from './data/constants';

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
import WishlistDrawer from './components/WishlistDrawer';
import TrackingPage from './components/TrackingPage';
import LegalView from './components/LegalView';
import SEO from './components/SEO';
import ClientLoginModal from './components/ClientLoginModal';

// --- UTILITIES ---
const getEmailTemplate = (orderId, total, items, customer, content) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong> x ${item.quantity}
        ${item.isPreorder ? `<br/><small style="color: #f97316;">(Pre-order: ${item.preorderDays || 14} days)</small>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₵${(item.price * (item.quantity || 1)).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: ${content.primaryColor || '#5b0143'}; color: white; padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">KENTEHAUL</h1>
        <p style="margin: 10px 0 0; opacity: 0.8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Royal Order Confirmation</p>
      </div>
      <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 16px 16px;">
        <h2 style="margin-top: 0;">Order #${orderId}</h2>
        <p>Dear ${customer.name},</p>
        <p>Your journey into heritage has begun. We have received your order and our master weavers are preparing your pieces.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
               <th style="padding: 12px; text-align: left;">Item</th>
               <th style="padding: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Grand Total</td>
              <td style="padding: 12px; font-weight: bold; text-align: right; color: ${content.secondaryColor || '#f97316'};">₵${total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: bold; text-transform: uppercase;">Tracking Your Order</p>
          <p style="margin: 5px 0 0; font-size: 14px;">You can track your order live at: <a href="${window.location.origin}/track/${orderId}" style="color: #5b0143; text-decoration: none; font-weight: bold;">Track My Kente</a></p>
        </div>

        <p>If you have any questions, reach out to us on WhatsApp.</p>
        <p>Best Regards,<br/><strong>Team KenteHaul</strong></p>
      </div>
    </div>
  `;
};

const AdminLoginRequired = ({ setIsAdminLoginOpen }) => (
  <div className="h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
    <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-xl border border-gray-100">
      <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[30px] flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">Admin Access</h2>
      <p className="text-gray-500 font-bold text-sm mb-8">This zone is reserved for KenteHaul management. Please sign in to proceed.</p>
      <button 
        onClick={() => setIsAdminLoginOpen(true)}
        className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-black"
      >
        Authenticate
      </button>
      <Link 
        to="/" 
        className="block mt-6 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors"
      >
        ← Go back to public site
      </Link>
    </div>
  </div>
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // 1. ALL STATE DECLARATIONS FIRST
  // (Must come before any useEffect that references these variables)
  // ==========================================
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- CLIENT AUTH STATE ---
  const [isClientAuthOpen, setIsClientAuthOpen] = useState(false);
  const [isClientAuthenticated, setIsClientAuthenticated] = useState(false);
  const [clientUser, setClientUser] = useState(null);
  
  // GLOBAL SAFETY MONITOR for Processing state
  useEffect(() => {
    let safetyTimer;
    if (isProcessing) {
        console.info("[SAFETY] Global processing monitor active...");
        safetyTimer = setTimeout(() => {
            console.warn("[SAFETY] Processing timeout (15s). Releasing UI.");
            setIsProcessing(false);
            setIsCartOpen(false);
        }, 15000);
    }
    return () => { if (safetyTimer) clearTimeout(safetyTimer); };
  }, [isProcessing]);
  const [siteContent, setSiteContent] = useState(() => {
    try {
      const deployV = '2026.04.21.V1';
      const cachedV = localStorage.getItem('kh_deploy_v');
      const cached = localStorage.getItem('kente_theme');
      
      // If version mismatch or no cache, prioritize return null to show loader
      if (cachedV !== deployV || !cached) {
          return null;
      }
      
      const parsed = JSON.parse(cached);
      // STRICT VALIDATION: Ensure we have a healthy object
      if (parsed && typeof parsed === 'object' && parsed.primaryColor) {
        return parsed;
      }
      return null;
    } catch (e) {
      console.error("Theme restoration failed, using INITIAL_CONTENT:", e);
      return INITIAL_CONTENT;
    }
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const cached = localStorage.getItem('kente_wishlist');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.warn("Wishlist restoration failed:", e);
      return [];
    }
  });
  const [clientId] = useState(() => {
    let id = localStorage.getItem('kente_clientId');
    if (!id) {
      id = `client-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
      localStorage.setItem('kente_clientId', id);
    }
    return id;
  });

  // ==========================================
  // 2. ANALYTICS / TRACKING (depends on siteContent)
  // ==========================================
  useEffect(() => {
    const gaId = siteContent?.googleAnalyticsId;
    if (gaId && gaId !== 'G-XXXXXXXXXX') {
      const script = document.createElement('script');
      script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag('js', new Date()); gtag('config', gaId);
    }

    const pixelId = siteContent?.facebookPixelId;
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
  }, [siteContent?.googleAnalyticsId, siteContent?.facebookPixelId]);


  // ==========================================
  // 2. UI & NAVIGATION STATE
  // ==========================================
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('kente_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Cart restoration failed:", e);
      return [];
    }
  });

  const [currentCategory, setCurrentCategory] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Logic & Interaction State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Order Success Tracking
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState({ id: '', total: 0 });

  // Order Tracking State
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // --- CLIENT AUTH HANDLERS ---
  const handleClientSignup = async (userData) => {
    try {
      const hashedPassword = await hashPassword(userData.password);
      const cleanPhone = userData.phone.replace(/[^0-9]/g, '');
      const userRef = doc(db, "customers", cleanPhone);
      
      const checkDoc = await getDoc(userRef);
      if (checkDoc.exists() && checkDoc.data().passwordHash) {
        throw new Error("An account already exists with this phone number.");
      }

      const clientData = {
        name: userData.name,
        email: userData.email || '',
        phone: userData.phone,
        passwordHash: hashedPassword,
        joinedDate: new Date().toLocaleDateString(),
        lastVisit: serverTimestamp(),
        totalSpent: 0,
        orderCount: 0,
        orderIds: []
      };

      await setDoc(userRef, clientData, { merge: true });
      setClientUser(clientData);
      setIsClientAuthenticated(true);
      setIsClientAuthOpen(false);
      localStorage.setItem('kente_client_authenticated', 'true');
      localStorage.setItem('kente_client_phone', cleanPhone);
      return { success: true };
    } catch (err) {
      console.error("Signup Error:", err);
      return { success: false, error: err.message };
    }
  };

  const handleClientLogin = async (credentials) => {
    try {
      const cleanPhone = credentials.phone.replace(/[^0-9]/g, '');
      const userRef = doc(db, "customers", cleanPhone);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists() || !userDoc.data().passwordHash) {
        throw new Error("Account not found. Please register first.");
      }

      const userData = userDoc.data();
      const hashedAttempt = await hashPassword(credentials.password);

      if (hashedAttempt !== userData.passwordHash) {
        throw new Error("Invalid password. Please try again.");
      }

      setClientUser({ ...userData, id: userDoc.id });
      setIsClientAuthenticated(true);
      setIsClientAuthOpen(false);
      localStorage.setItem('kente_client_authenticated', 'true');
      localStorage.setItem('kente_client_phone', cleanPhone);
      return { success: true };
    } catch (err) {
      console.error("Login Error:", err);
      return { success: false, error: err.message };
    }
  };

  const handleClientLogout = () => {
    setClientUser(null);
    setIsClientAuthenticated(false);
    localStorage.removeItem('kente_client_authenticated');
    localStorage.removeItem('kente_client_phone');
    navigate('/');
  };

  // Recovery: Auto-login client from cache
  useEffect(() => {
    const isAuth = localStorage.getItem('kente_client_authenticated');
    const phone = localStorage.getItem('kente_client_phone');
    if (isAuth === 'true' && phone) {
      const recover = async () => {
        const d = await getDoc(doc(db, "customers", phone));
        if (d.exists()) {
          setClientUser({ ...d.data(), id: d.id });
          setIsClientAuthenticated(true);
        }
      };
      recover();
    }
  }, []);

  // --- ACTIVITY LOGGING HELPER ---
  const logActivity = async (type, data) => {
    try {
      await addDoc(collection(db, "activity_log"), {
        type,
        clientId,
        ...data,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      // Fail silently for user, but track for BI
      console.warn("BI Activity Sync failed:", e);
    }
  };

  // Track Site Visits (Session-based)
  useEffect(() => {
    const sessionKey = 'kente_visit_tracked';
    if (!sessionStorage.getItem(sessionKey)) {
      const ua = navigator.userAgent;
      let device = 'Desktop';
      if (/Android/i.test(ua)) device = 'Android';
      else if (/iPhone|iPad|iPod/i.test(ua)) device = 'iOS';

      logActivity('site_visit', {
        device,
        userAgent: ua,
        referrer: document.referrer || 'Direct',
        resolution: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language
      });
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, []);

  // Track Product Views
  useEffect(() => {
    if (selectedProduct) {
      logActivity('view_item', { 
        productId: selectedProduct.id, 
        productName: selectedProduct.name,
        category: selectedProduct.category || 'Uncategorized'
      });
    }
  }, [selectedProduct]);

  // Deep Linking: Auto-open product modal if ID is in URL
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkProcessed = useRef(false);

  useEffect(() => {
    const productId = searchParams.get('product');
    if (!productId) return;

    if (products.length > 0 && !deepLinkProcessed.current) {
      const product = products.find(p => p.id === productId);
      if (product) {
        deepLinkProcessed.current = true;
        setSelectedProduct(product);
        // Clean URL to prevent re-triggering
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('product');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [products, searchParams, setSearchParams]);

  // --- DEBOUNCED WISHLIST SYNC ---
  const debouncedSync = useRef(
    debounce(async (currentWishlist, currentClientId) => {
      try {
        await setDoc(doc(db, "wishlists", currentClientId), {
          items: currentWishlist.map(p => ({ id: p.id, name: p.name, price: p.price, image: p.image })),
          itemIds: currentWishlist.map(p => p.id),
          updatedAt: serverTimestamp(),
          clientInfo: {
            lastVisit: new Date().toLocaleDateString(),
            platform: navigator.platform
          }
        }, { merge: true });
        console.debug("Wishlist synced successfully.");
      } catch (e) {
        console.warn("Wishlist sync failed:", e);
      }
    }, 2000)
  ).current;

  useEffect(() => {
    localStorage.setItem('kente_wishlist', JSON.stringify(wishlist));
    if (wishlist.length > 0 || localStorage.getItem('kente_wishlist_synced')) {
      debouncedSync(wishlist, clientId);
      localStorage.setItem('kente_wishlist_synced', 'true');
    }
    return () => debouncedSync.cancel();
  }, [wishlist, clientId, debouncedSync]);

  // ==========================================
  // 3. FIREBASE REAL-TIME LISTENERS
  // ==========================================
  useEffect(() => {
    // Safety Timeout for Loading Screen
    const timeoutId = setTimeout(() => {
      setSiteContent(prev => {
        if (!prev) {
          console.warn("Theme fetch timed out, falling back to INITIAL_CONTENT.");
          return INITIAL_CONTENT;
        }
        return prev;
      });
    }, 3000); // 3 seconds timeout

    // A. Listen to Site Settings (Logo, Colors, Hero Text)
    const unsubContent = onSnapshot(doc(db, "settings", "siteContent"), (doc) => {
      clearTimeout(timeoutId); // Clear timeout if we get data!
      if (doc.exists()) {
        const themeData = doc.data();
        setSiteContent(themeData);
        // Cache theme in localStorage to prevent FOUC on next load
        localStorage.setItem('kente_theme', JSON.stringify(themeData));
        localStorage.setItem('kh_deploy_v', '2026.04.21.V1'); // Fix: Save version to make cache valid!
      } else {
        // Use default constants if database is empty
        setSiteContent(INITIAL_CONTENT);
        localStorage.setItem('kente_theme', JSON.stringify(INITIAL_CONTENT));
      }
    });

    // B. Listen to Products (CRITICAL: DATA TYPE SANITIZATION)
    const unsubProducts = onSnapshot(query(collection(db, "products"), limit(120)), (snapshot) => {
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

    // E. Fetch Photo Gallery (STATIC: ONE-TIME FETCH)
    const fetchGallery = async () => {
      try {
        const snap = await getDocs(query(collection(db, "gallery"), limit(20)));
        setGallery(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      } catch (e) { console.warn("Gallery fetch failed:", e); }
    };
    fetchGallery();

    // F. Fetch Client Feedback (STATIC: ONE-TIME FETCH)
    const fetchFeedback = async () => {
      try {
        const snap = await getDocs(query(collection(db, "feedbacks"), limit(12)));
        setFeedbacks(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      } catch (e) { console.warn("Feedback fetch failed:", e); }
    };
    fetchFeedback();

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
      clearTimeout(timeoutId);
      unsubContent();
      unsubProducts();
      // unsubGallery(); // Now static
      // unsubFeedback(); // Now static
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

    // C. Listen to Recent Orders (Admin Only: Limit to latest 100 for speed)
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(100)), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    // D. Listen to Customer Database (Admin Only: Limit to 100)
    const unsubCustomers = onSnapshot(query(collection(db, "customers"), orderBy("lastOrder", "desc"), limit(100)), (snapshot) => {
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
          // Pull VAPID Key from Site Settings
          const vapidKey = siteContent?.vapidKey;
          
          if (vapidKey && vapidKey !== 'YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE_CONSOLE') {
            const token = await getToken(messaging, { vapidKey });
            
            if (token && token !== siteContent?.adminFcmToken) {
              console.log("FCM Token registered/updated:", token);
              // Store token in settings/siteContent so the admin can receive alerts
              await updateDoc(doc(db, "settings", "siteContent"), {
                adminFcmToken: token,
                lastTokenUpdate: serverTimestamp()
              });
            }
          } else {
            console.warn("[FCM] VAPID Key missing in Settings. Notifications will not work.");
          }
        }
      } catch (err) {
        console.error("FCM Registration failed:", err);
      }
    };

    // DEFERRED RECOVERY: Run FCM setup after app is stable
    const deferTimer = setTimeout(() => {
      setupNotifications();
    }, 5000);

    // Listen for foreground messages
    const unsubMessaging = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/favicon.svg'
        });
      }
    });

    return () => {
      clearTimeout(deferTimer);
      unsubMessaging();
    };
  }, [isAdminAuthenticated, siteContent?.vapidKey]);

  // ==========================================
  // 4. PERSISTENCE & HELPERS
  // ==========================================
  
  const getEmailTemplate = (orderId, total, items, customer, sc) => {
    const primary = sc?.primaryColor || '#5b0143';
    const accent = sc?.secondaryColor || '#f97316';
    
    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0;">
          <div style="font-weight: bold; color: ${primary}; font-size: 14px;">${item.name}</div>
          <div style="font-size: 11px; color: #666;">Qty: ${item.quantity} × ₵${item.price?.toLocaleString()}</div>
        </td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">₵${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 30px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: ${primary}; padding: 40px 30px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 26px; letter-spacing: 4px; font-weight: 900; text-transform: uppercase;">Order Confirmed</h1>
            <p style="margin: 10px 0 0; opacity: 0.8; font-size: 13px; font-weight: 300;">Thank you for weaving your story with KenteHaul</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="margin-bottom: 30px; border-bottom: 2px solid ${primary}10; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: top;">
              <div>
                <h2 style="margin: 0; font-size: 18px; color: ${primary}; font-weight: 900;">Order #${orderId}</h2>
                <p style="font-size: 12px; color: #999; margin: 5px 0 0;">Placed on ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding: 25px 0 5px; font-size: 13px; color: #666;">Shipping (${customer.shippingRegion || 'Accra'})</td>
                <td style="padding: 25px 0 5px; text-align: right; font-weight: bold; color: #666;">₵${(customer.shippingFee || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0 30px; font-size: 22px; font-weight: 900; color: ${accent};">Total Amount</td>
                <td style="padding: 5px 0 30px; text-align: right; font-size: 22px; font-weight: 900; color: ${accent};">₵${total.toLocaleString()}</td>
              </tr>
            </table>
            
            <div style="background-color: ${primary}05; padding: 25px; border-radius: 20px; border: 1px solid ${primary}10;">
              <h3 style="margin: 0 0 12px; font-size: 10px; color: ${primary}; text-transform: uppercase; letter-spacing: 2px; font-weight: 900;">Shipping Destination:</h3>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">${customer.name}</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #666; line-height: 1.5;">${customer.address}</p>
              <p style="margin: 10px 0 0; font-size: 12px; color: ${primary}; font-weight: bold; letter-spacing: 0.5px;">${customer.phone}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #fafafa; padding: 40px 30px; text-align: center; border-top: 1px solid #f0f0f0;">
             <p style="margin: 0 0 25px; font-size: 13px; color: #888; line-height: 1.6;">Our master weavers are already preparing your authentic Ghanaian pieces. We will notify you once your royalty is out for delivery.</p>
            <a href="${window.location.origin}/track/${orderId}" style="display: inline-block; background-color: ${primary}; color: #ffffff; padding: 16px 35px; border-radius: 15px; text-decoration: none; font-weight: 900; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 10px 20px ${primary}30;">Track Order Status</a>
            <div style="margin-top: 40px; border-top: 1px solid #eee; pt: 30px;">
                <p style="margin: 20px 0 0; font-size: 10px; color: #bbb; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">KenteHaul | Authentic Heritage</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Save Cart to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kente_cart', JSON.stringify(cart));
  }, [cart]);

  // --- CART PRICE SYNC ---
  // Ensure prices in the cart match the verified 'products' list from Firestore
  useEffect(() => {
    if (products.length === 0 || cart.length === 0) return;

    let priceChanged = false;
    const updatedCart = cart.map(item => {
      const liveProd = products.find(p => p.id === item.id);
      if (liveProd && Number(liveProd.price) !== Number(item.price)) {
        priceChanged = true;
        return { ...item, price: Number(liveProd.price) };
      }
      return item;
    });

    if (priceChanged) {
      setCart(updatedCart);
      alert("Note: One or more items in your bag had a price update to match our current stock value.");
    }
  }, [products, cart]);

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
        
        // Google Analytics: Add to Cart
        if (analytics) {
          const activePrice = siteContent?.flashSaleEnabled ? product.price : (product.originalPrice || product.price);
          logEvent(analytics, 'add_to_cart', {
            items: [{ item_id: product.id, item_name: product.name, price: activePrice, quantity: 1 }],
            value: activePrice,
            currency: 'GHS'
          });
        }
      } else {
        alert("This item is currently out of stock.");
      }
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleForceClearProcessing = () => {
    setIsProcessing(false);
    setIsCartOpen(false);
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

  const cartTotal = cart.reduce((total, item) => {
    const price = siteContent?.flashSaleEnabled ? item.price : (item.originalPrice || item.price);
    return total + (price * item.quantity);
  }, 0);

  // --- ATOMIC CHECKOUT LOGIC (Robust Firestore Writes) ---

  const onWhatsAppCheckout = async (customerDetails) => {
    setIsProcessing(true);
    const orderId = generateOrderId(); // Unified Production ID
    console.log("Starting WhatsApp Checkout:", { orderId, customerDetails, cart });
    
    // Safety net: always clear processing after 20s
    console.info("[CHECKOUT] Starting processing flow...");
    const safetyTimer = setTimeout(() => {
      console.warn("[CHECKOUT] Safety timer triggered. Releasing UI.");
      setIsProcessing(false);
    }, 20000);
    
    try {
      // --- AUDIT & VALIDATION ---
      // Fetch fresh data from DB to prevent "Price Tampering" or outdated lead times
      const cartItems = [];
      let totalAmount = 0;
      let hasPreorder = false;
      let maxLeadTime = 0;

      const productSnapshots = await Promise.all(cart.map(item => getDoc(doc(db, "products", item.id))));
      
      cart.forEach((item, idx) => {
          const snap = productSnapshots[idx];
          if (snap.exists()) {
              const liveProd = snap.data();
              const price = siteContent?.flashSaleEnabled ? Number(liveProd.price || 0) : Number(liveProd.originalPrice || liveProd.price || 0);
              const qty = Number(item.quantity || 1);
              const itemTotal = price * qty;
              
              totalAmount += itemTotal;
              
              const itemIsPreorder = liveProd.isPreorder || false;
              const itemLeadTime = Number(liveProd.preorderDays || 14);
              if (itemIsPreorder) {
                  hasPreorder = true;
                  maxLeadTime = Math.max(maxLeadTime, itemLeadTime);
              }

              cartItems.push({
                  ...item,
                  price: price,
                  isPreorder: itemIsPreorder,
                  preorderDays: itemLeadTime,
                  liveVerified: true
              });
          }
      });

      const shippingAmount = (customerDetails.deliveryMethod === 'pickup' || customerDetails.deliveryMethod === 'customer_rider') 
          ? 0 
          : (Number(customerDetails.shippingFee) || 0);
      totalAmount += shippingAmount;

      // 1. Critical Construct: Local Order Data
      const orderData = {
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
        items: cartItems,
        total: totalAmount,
        subtotal: totalAmount - shippingAmount,
        shippingFee: shippingAmount,
        hasPreorder,
        maxLeadTime,
        shippingRegion: customerDetails.shippingRegion || 'Accra',
        deliveryMethod: customerDetails.deliveryMethod || 'seller_rider',
        status: 'Order Placed',
        getUpdateVia: 'WhatsApp',
        method: 'WhatsApp Order',
        customer: { ...customerDetails, finalTotal: totalAmount, shippingFee: shippingAmount }
      };

      // Construct WhatsApp message BEFORE releasing UI
      let message = `*KENTEHAUL ORDER:* ${orderId}\n`;
      message += `_Status: Order Placed_\n\n`;
      cartItems.forEach(item => { 
          message += `• ${item.name} x${item.quantity}${item.isPreorder ? ` (PRE-ORDER: ${item.preorderDays}d)` : ''} - ₵${item.price * item.quantity}\n`; 
      });
      message += `\n*Method:* ${(customerDetails.deliveryMethod || 'rider').replace('_', ' ')}`;
      message += `\n*Total:* ₵${totalAmount}`;
      message += `\n\n*TRACKING:* ${window.location.origin}/track/${orderId}`;
      
      const whatsappPhone = (siteContent?.contactPhone || '').replace(/[^0-9]/g, '');

      // 2. IMMEDIATE UI RELEASE
      console.info("[CHECKOUT] Order constructed. Releasing UI immediately for user comfort.");
      // 2. IMMEDIATE SUCCESS TRIGGER
      setSuccessOrderData({ 
          id: orderId, 
          total: totalAmount, 
          items: cartItems, 
          customer: customerDetails,
          whatsappUrl: `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`
      });
      setIsSuccessModalOpen(true);
      setCart([]);
      setIsCartOpen(false);
      setIsProcessing(false);
      clearTimeout(safetyTimer);

      // Trigger automatic redirect to WhatsApp
      try {
          window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`, '_blank');
      } catch (e) {
          console.warn("[CHECKOUT] WhatsApp automatic popup blocked by browser.");
      }

      // 3. BACKGROUND SYNC (The app continues, but these happen in parallel)
      const forceSync = async () => {
        try {
            // Save main order
            await setDoc(doc(db, "orders", orderId), orderData);
            
            // Background Batch for CRM/Stock
            const backgroundBatch = writeBatch(db);
            const phoneInput = String(customerDetails.phone || '');
            const cleanPhone = phoneInput.replace(/[^0-9]/g, '') || `cust-wa-${Date.now()}`;
            const custRef = doc(db, "customers", cleanPhone);
            backgroundBatch.set(custRef, {
                name: customerDetails.name,
                email: customerDetails.email || '',
                phone: customerDetails.phone,
                totalSpent: increment(totalAmount),
                lastOrder: serverTimestamp(),
                orderCount: increment(1)
            }, { merge: true });

            for (const item of cartItems) {
                if (!item.id || item.isPreorder) continue;
                backgroundBatch.update(doc(db, "products", item.id), { 
                    stockQuantity: increment(-Number(item.quantity || 1)) 
                });
            }
            await backgroundBatch.commit();

            // Email side-effect
            if (customerDetails.email) {
                const emailHtml = getEmailTemplate(orderId, totalAmount, cartItems, customerDetails, siteContent);
                await addDoc(collection(db, "mail"), {
                    to: customerDetails.email,
                    message: { subject: `Order Received - #${orderId}`, html: emailHtml }
                });
            }
        } catch (bgErr) {
            console.warn("[BG-SYNC] Order background sync failed:", bgErr);
        }
      };
      
      // FIRE AND FORGET SYNC
      forceSync();

    } catch (error) {
      console.error("Atomic Checkout Failed (onWhatsAppCheckout):", error);
      setIsProcessing(false);
      alert(`Checkout failed: ${error.message || "System Busy"}. Please try again.`);
    } finally {
      clearTimeout(safetyTimer);
    }
  };

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      if (!product || !product.id) return prev;
      const exists = prev.some(p => p.id === product.id);
      
      // Log Heart Activity
      logActivity(exists ? 'unheart_item' : 'heart_item', {
        productId: product.id,
        productName: product.name
      });

      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handlePaystackSuccess = async (reference, customerForm) => {
    setIsProcessing(true);
    console.log("Paystack Success - Syncing to Database:", { reference, customerForm });

    // Safety net: always clear processing after 45s (Auth can take time)
    const safetyTimer = setTimeout(() => {
      setIsProcessing(false);
      console.warn("[PAYSTACK] Safety timeout reached.");
    }, 45000);
    
    try {
      const paymentRef = reference.reference;
      const orderId = customerForm.orderId || generateOrderId(); // Use provided ID if available
      
      // --- AUDIT & VALIDATION ---
      const cartItems = [];
      let totalAmount = 0;
      let hasPreorder = false;
      let maxLeadTime = 0;

      const passedItems = customerForm.items || cart;
      const productSnapshots = await Promise.all(passedItems.map(item => getDoc(doc(db, "products", item.id))));

      passedItems.forEach((item, idx) => {
          const snap = productSnapshots[idx];
          if (snap.exists()) {
              const liveProd = snap.data();
              const price = siteContent?.flashSaleEnabled ? Number(liveProd.price || 0) : Number(liveProd.originalPrice || liveProd.price || 0);
              const qty = Number(item.quantity || 1);
              totalAmount += (price * qty);

              const itemIsPreorder = liveProd.isPreorder || false;
              const itemLeadTime = Number(liveProd.preorderDays || 14);
              if (itemIsPreorder) {
                  hasPreorder = true;
                  maxLeadTime = Math.max(maxLeadTime, itemLeadTime);
              }

              cartItems.push({
                  ...item,
                  price,
                  isPreorder: itemIsPreorder,
                  preorderDays: itemLeadTime,
                  liveVerified: true
              });
          }
      });

      const shippingAmount = (customerForm.deliveryMethod === 'pickup' || customerForm.deliveryMethod === 'customer_rider') 
          ? 0 
          : (Number(customerForm.shippingFee) || 0);
      totalAmount += shippingAmount;

      // --- ATOMIC DATA SNAPSHOT ---
      // We clone the data here so the modal stays stable even if 'cart' or 'customerForm' are cleared
      const orderSnapshot = {
          id: orderId,
          total: totalAmount,
          items: JSON.parse(JSON.stringify(cartItems)), // Deep clone to be safe
          customer: { ...customerForm },
          method: 'Paystack'
      };

      setSuccessOrderData(orderSnapshot);
      setIsSuccessModalOpen(true);
      
      // Clear main UI states ONLY after modal has its snapshot
      setCart([]);
      setIsCartOpen(false);
      setIsProcessing(false);
      
      console.log("[DEBUG] Atomic handover complete. Order:", orderId);

      // ==========================================
      // 2. BACKGROUND ARCHIVAL (Fire and Forget)
      // ==========================================
      const performBackgroundSync = async () => {
        try {
          const orderData = {
            date: new Date().toLocaleDateString(),
            createdAt: serverTimestamp(),
            items: cartItems,
            total: totalAmount,
            subtotal: totalAmount - shippingAmount,
            shippingFee: shippingAmount,
            hasPreorder,
            maxLeadTime,
            shippingRegion: customerForm.shippingRegion || 'Accra',
            deliveryMethod: customerForm.deliveryMethod || 'seller_rider',
            status: 'Payment Confirmed',
            method: 'Paystack Card/Momo',
            paymentRef: paymentRef,
            customer: { ...customerForm, finalTotal: totalAmount, shippingFee: shippingAmount }
          };

          const orderRef = doc(db, "orders", orderId);
          const orderSnap = await getDoc(orderRef);
          
          if (orderSnap.exists()) {
              console.info("[CLIENT] Order already exists. Webhook likely processed it first.");
              return;
          }

          await setDoc(orderRef, orderData);
          
          const backgroundBatch = writeBatch(db);
          const phoneInput = String(customerForm.phone || '');
          const cleanPhone = phoneInput.replace(/[^0-9]/g, '') || `cust-ps-${Date.now()}`;
          
          backgroundBatch.set(doc(db, "customers", cleanPhone), {
            name: customerForm.name,
            email: customerForm.email || '',
            phone: customerForm.phone,
            totalSpent: increment(totalAmount),
            lastOrder: serverTimestamp(),
            orderCount: increment(1)
          }, { merge: true });

          for (const item of cartItems) {
            if (!item.id) continue;
            backgroundBatch.update(doc(db, "products", item.id), { 
              stockQuantity: increment(-Number(item.quantity || 1)) 
            });
          }
          
          await backgroundBatch.commit();

          if (customerForm.email) {
            const orderSummaryHtml = getEmailTemplate(orderId, totalAmount, cartItems, customerForm, siteContent);
            await addDoc(collection(db, "mail"), {
              to: customerForm.email,
              message: { subject: `Payment Confirmed - #${orderId}`, html: orderSummaryHtml }
            });
          }
        } catch (bgError) {
          console.warn("[BG-SYNC] Failed silently in background:", bgError);
        }
      };

      performBackgroundSync();

    } catch (error) {
      console.error("Payment sync failed:", error);
      setIsProcessing(false); // ENSURE CLEAR BEFORE ALERT
      alert("Payment successful, but sync failed: " + error.message);
    } finally {
      clearTimeout(safetyTimer);
    }
  };

  const handleSingleBuy = (product) => {
    const message = `Hello KenteHaul! I am interested in purchasing: *${product.name}* (Price: ₵${product.price}). Is this item available in stock?`;
    const whatsappNum = siteContent?.contactPhone?.replace(/[^0-9]/g, '') || "233540249684";
    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // --- ORDER TRACKING LOGIC ---
  const handleTrackOrder = async () => {
    const cleanInput = trackingInput.trim().toUpperCase();
    if (!cleanInput) { alert("Please enter an Order ID."); return; }
    setIsTrackingOpen(false);
    navigate(`/track/${cleanInput}`);
  };

  const isAdminPath = location.pathname.startsWith('/admin');

  if (!siteContent) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: '#5b0143' }}></div>
        <p className="text-gray-600 font-medium">Loading Kente Experience...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-50 font-sans text-gray-800 flex flex-col">
        <SEO 
          siteContent={siteContent}
          title="KenteHaul | Authentic Royal Ghanaian Kente Cloth"
          description="The world's premier destination for authentic, hand-woven Ghanaian Kente. Discover the legacy of royalty, heritage, and imperial craftsmanship."
          ogTitle="KenteHaul - Royal Heritage Collections"
          ogDescription="Discover the finest hand-woven Ghanaian Kente. Authentic designs delivered worldwide from the heart of Ghana."
          ogImage={siteContent?.heroImage || siteContent?.logo || "/favicon.svg"}
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "KenteHaul",
            "url": window.location.origin,
            "logo": siteContent?.logo || `${window.location.origin}/favicon.svg`,
            "sameAs": [
              siteContent?.instagramLink || "https://instagram.com/kentehaul",
              "https://tiktok.com/@kentehaul"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": siteContent?.contactPhone,
              "contactType": "customer service",
              "email": siteContent?.contactEmail
            }
          }}
        />

        <ScrollToTop />

        {!isAdminPath && (
          <Navbar
            siteContent={siteContent}
            cart={cart}
            wishlistCount={wishlist.length}
            setIsCartOpen={setIsCartOpen}
            setIsWishlistOpen={setIsWishlistOpen}
            setIsTrackingOpen={setIsTrackingOpen}
            isClientAuthenticated={isClientAuthenticated}
            clientUser={clientUser}
            handleClientLogout={handleClientLogout}
            setIsClientAuthOpen={setIsClientAuthOpen}
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
          onForceClearProcessing={handleForceClearProcessing}
          clientUser={clientUser}
        />

        <WishlistDrawer
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          addToCart={addToCart}
          siteContent={siteContent}
        />

        {selectedProduct && (
          <SEO
            siteContent={siteContent}
            title={selectedProduct.name}
            description={selectedProduct.description || `Buy ${selectedProduct.name} on KenteHaul.`}
            ogImage={selectedProduct.image}
            ogTitle={selectedProduct.name}
            ogDescription={`Price: ₵${selectedProduct.price}. Buy authentic Kente on KenteHaul.`}
          />
        )}

        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          addToCart={addToCart}
          onSingleBuy={handleSingleBuy}
          siteContent={siteContent}
          allProducts={products}
          onOpenProduct={setSelectedProduct}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
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

        <ClientLoginModal
          isOpen={isClientAuthOpen}
          onClose={() => setIsClientAuthOpen(false)}
          handleLogin={handleClientLogin}
          handleSignup={handleClientSignup}
          siteContent={siteContent}
        />

        <main className="flex-grow">
          <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-pulse text-xl font-light">Loading Kente Heritage...</div></div>}>
            <Routes>
              <Route path="/" element={<Home siteContent={siteContent} gallery={gallery} feedbacks={feedbacks} products={products} addToCart={addToCart} />} />
              <Route path="/heritage" element={<Heritage siteContent={siteContent} />} />
              <Route path="/shop" element={<Shop products={products} currentCategory={currentCategory} searchQuery={searchQuery} setSearchQuery={setSearchQuery} addToCart={addToCart} handleSingleBuy={handleSingleBuy} setSelectedProduct={setSelectedProduct} siteContent={siteContent} wishlist={wishlist} toggleWishlist={toggleWishlist} />} />
              <Route path="/institute" element={<Institute siteContent={siteContent} products={products} />} />
              <Route path="/contact" element={<Contact siteContent={siteContent} />} />
              <Route path="/track/:orderId" element={<TrackingPage siteContent={siteContent} />} />
              <Route path="/privacy-policy" element={<LegalView title="Privacy Policy" content={siteContent?.privacyPolicy} siteContent={siteContent} type="privacy" />} />
              <Route path="/terms-conditions" element={<LegalView title="Terms & Conditions" content={siteContent?.termsConditions} siteContent={siteContent} type="terms" />} />
              <Route path="/refund-policy" element={<LegalView title="Refund & Return Policy" content={siteContent?.refundPolicy} siteContent={siteContent} type="refund" />} />
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
        {/* SUCCESS MODAL LAYER */}
        <OrderSuccessModal 
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          orderId={successOrderData?.id || ''}
          totalAmount={successOrderData?.total || 0}
          items={successOrderData?.items || []}
          whatsappUrl={successOrderData?.whatsappUrl}
          siteContent={siteContent}
          setIsTrackingOpen={setIsTrackingOpen}
        />
      </div>
    </ErrorBoundary>
  );
}


