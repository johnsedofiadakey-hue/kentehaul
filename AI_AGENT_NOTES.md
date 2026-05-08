# 🤖 KenteHaul — AI Agent Briefing Notes
**For:** AI coding assistant continuing work on this project  
**Stack:** React + Vite + Firebase (Firestore + Auth) + Tailwind CSS + Framer Motion  
**Host:** Firebase Hosting | **Payments:** Paystack | **Comms:** WhatsApp API

---

## 📁 Project Structure

```
src/
├── App.jsx                         ← Root: all state, Firebase listeners, checkout logic
├── firebase.js                     ← Firebase config (db, auth, storage exports)
├── data/constants.js               ← SHOP_CATEGORIES fallback, INITIAL_CONTENT, generateOrderId()
├── index.css                       ← Global styles + PWA/mobile CSS
├── components/
│   ├── Navbar.jsx                  ← Sticky nav, rich desktop dropdown, mobile accordion
│   ├── CartDrawer.jsx              ← 2-step checkout drawer (cart → details → payment)
│   ├── ProductDetailModal.jsx      ← Bottom sheet on mobile / modal on desktop
│   ├── OrderTrackingModal.jsx      ← Order status timeline
│   ├── AdminLoginModal.jsx         ← Firebase Auth email+password login
│   ├── AdminDashboard.jsx          ← Admin shell with sidebar tabs
│   ├── InvoiceModal.jsx            ← Read-only invoice view/print
│   ├── Footer.jsx
│   ├── PageViews.jsx               ← Home, Heritage, Institute, Contact pages
│   ├── Shop.jsx                    ← Product grid, filters, sort, subcategory pills
│   ├── UIComponents.jsx            ← ImageUpload, PaystackButton, TikTokIcon, LazyImage
│   └── admin/
│       ├── AdminProducts.jsx       ← Product CRUD + Category Manager (Firestore-backed)
│       ├── AdminOrders.jsx         ← Orders list, inline status update, stats
│       ├── AdminSettings.jsx       ← Live branding (colors, hero, logo) + invoice config
│       ├── AdminCRM.jsx            ← Customer database
│       └── InvoiceCreator.jsx      ← Manual invoice creation modal
public/
├── manifest.json                   ← PWA manifest (install as app)
```

---

## 🔑 Key Firebase Collections

| Collection | Purpose |
|---|---|
| `products` | All shop items: name, price, stock, category, subcategory, image (base64), description |
| `orders` | All orders: id (KW-YYMMDD-XXXX), customer, items, total, status, method, date |
| `customers` | Auto-built CRM: keyed by phone number |
| `gallery` | Homepage gallery images (base64) |
| `feedbacks` | Customer testimonials |
| `settings/siteContent` | Live site config: colors, logo, hero, Paystack key, phone |
| `settings/categories` | Dynamic shop categories + subcategories (JSON list) |

**Admin login:** Firebase Auth → check Firebase Console → Authentication → Users  
**Default admin email placeholder:** `admin@kentehaul.com` (actual credentials in Firebase Console)

---

## ⚡ How Live Sync Works

1. `App.jsx` has `onSnapshot` listeners for all collections — updates state in real-time
2. `siteContent` is also cached in `localStorage` as `kente_theme` to prevent flash on load
3. `AdminSettings.jsx` uses **optimistic updates** (`setSiteContent` first, then `setDoc` to Firestore)
4. Color changes debounce 400ms before saving to avoid Firestore spam
5. `settings/categories` is watched by Shop.jsx, Navbar.jsx, and AdminProducts.jsx independently

---

## 🛒 Order ID Format

```js
generateOrderId('WA')   // → "KW-250312-4821"  (WhatsApp order)
generateOrderId('paystack') // → "KH-250312-4821"  (Online/Paystack order)
```
- KW = KenteHaul WhatsApp
- KH = KenteHaul online  
- Date embedded: YYMMDD  
- 4-digit random suffix

---

## 📋 REMAINING IMPROVEMENTS TO IMPLEMENT

### 1. 🔥 Firebase Storage for Images (HIGH PRIORITY)
**Problem:** Products and gallery use base64 strings stored directly in Firestore — this hits the 1MB document limit fast, makes the DB slow, and causes layout shift.  
**Fix:** Upload images to Firebase Storage, store only the download URL.

**Files to change:**
- `src/components/UIComponents.jsx` → `ImageUpload` component
- Replace `reader.readAsDataURL(file)` with Firebase Storage upload
- Install: `firebase/storage` already imported in `firebase.js`

```js
// New ImageUpload logic
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../firebase';

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  onUpload(url); // now a real URL, not base64
};
```

**Note:** You'll need Firebase Storage rules set to allow authenticated writes.

---

### 2. 📧 Email Receipts via Firebase Extension
**Problem:** Customers don't get any email confirmation after purchase.  
**Fix:** Install the "Trigger Email" extension from Firebase Extensions dashboard.

**Steps:**
1. Go to Firebase Console → Extensions → Browse → "Trigger Email from Firestore"
2. Install it, configure your SMTP (Gmail/Sendgrid)
3. When an order is created in `orders` collection, also write to `mail` collection:

```js
// Add this inside handleCartWhatsApp() and handlePaystackSuccess() in App.jsx
if (customerForm.email) {
  await addDoc(collection(db, "mail"), {
    to: customerForm.email,
    message: {
      subject: `Your KenteHaul Order #${orderId} is Confirmed! 🎉`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Order ID: <strong>${orderId}</strong></p>
        <p>We'll be in touch shortly via WhatsApp.</p>
        <p>— The KenteHaul Team</p>
      `
    }
  });
}
```

---

### 3. 📱 WhatsApp Order Notification to Admin
**Problem:** Admin has no automatic notification when a new order comes in.  
**Fix:** When order is saved, send a WhatsApp message to the admin number.

The simplest approach (no backend needed): 
In `handleCartWhatsApp()` in `App.jsx`, after saving the order, the `window.open(wa.me/...)` already sends to admin. ✅ Already works.

For a server-side notification (Zapier/Make):
- Create a Zapier webhook triggered by new Firestore documents in `orders`
- Action: Send WhatsApp via Twilio or direct WhatsApp API to admin number

---

### 4. 🔔 Push Notifications for Admin (New Orders)
**Problem:** Admin won't know about new orders unless they check the dashboard.  
**Fix:** Firebase Cloud Messaging (FCM)

**Files to create/modify:**
- `public/firebase-messaging-sw.js` — service worker for background notifications
- `src/firebase.js` — add `getMessaging`, `getToken`
- Admin dashboard should call `getToken()` on first login and save to Firestore

```js
// src/firebase.js addition
import { getMessaging } from "firebase/messaging";
export const messaging = getMessaging(app);
```

This is a multi-file change. Prompt: "Add Firebase Cloud Messaging push notifications to KenteHaul admin dashboard so admin gets notified when a new order arrives"

---

### 5. 🖼️ Image Compression Before Upload
**Problem:** Raw phone photos can be 3-8MB, making the site slow.  
**Fix:** Compress client-side before uploading.

Install: `npm install browser-image-compression`

```js
// In UIComponents.jsx ImageUpload
import imageCompression from 'browser-image-compression';

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,          // max 500KB
    maxWidthOrHeight: 1200,  // resize large images
    useWebWorker: true
  });
  // then upload to Firebase Storage...
};
```

---

### 6. 📊 Analytics
**Fix:** Add Firebase Analytics (already bundled, just needs init)

```js
// src/firebase.js
import { getAnalytics, logEvent } from "firebase/analytics";
export const analytics = getAnalytics(app);
```

Track: page views, add-to-cart, checkout starts, purchases.

---

### 7. 🔒 Firestore Security Rules (CRITICAL for production)
**File:** `firestore.rules`  
**Current state:** Needs review — orders and customers should only be readable by admin.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public reads: products, gallery, feedbacks, settings
    match /products/{id} { allow read: if true; allow write: if request.auth != null; }
    match /gallery/{id} { allow read: if true; allow write: if request.auth != null; }
    match /feedbacks/{id} { allow read: if true; allow write: if request.auth != null; }
    match /settings/{id} { allow read: if true; allow write: if request.auth != null; }
    
    // Admin only: orders, customers
    match /orders/{id} { allow read, write: if request.auth != null; }
    match /customers/{id} { allow read, write: if request.auth != null; }
    
    // Anyone can create an order (checkout)
    match /orders/{id} { allow create: if true; }
  }
}
```

---

### 8. 🌐 SEO & Meta Tags per Page
**File:** `index.html` (static) or use `react-helmet-async` for dynamic per-page meta.

Install: `npm install react-helmet-async`

Wrap App in `<HelmetProvider>`, then in each page component:
```jsx
import { Helmet } from 'react-helmet-async';
<Helmet>
  <title>Shop Kente | KenteHaul</title>
  <meta name="description" content="Browse authentic Ghanaian Kente, Smocks, Sashes." />
</Helmet>
```

---

### 9. 🌍 Shipping Calculator
**Enhancement for CartDrawer.jsx**  
Add a region selector (Accra / Other Ghana / International) that appends a shipping fee to `cartTotal` before checkout. Currently delivery is discussed via WhatsApp after ordering.

---

### 10. ⭐ Product Reviews
**New collection:** `reviews/{productId}/userReviews`  
Let customers leave a rating + comment after receiving an order. Display on product detail modal.

---

## 🚀 Deployment Checklist

- [ ] Replace `pk_test_xxx` Paystack key with live key in Admin → Settings
- [ ] Set real admin email/password in Firebase Console → Authentication
- [ ] Update `firestore.rules` (see #7 above)
- [ ] Enable Firebase Storage and update ImageUpload component (#1)
- [ ] Set up Firebase Hosting: `firebase init hosting` → `npm run build` → `firebase deploy`
- [ ] Add custom domain in Firebase Hosting settings
- [ ] Test WhatsApp number (must be active +233 number)
- [ ] Test Paystack live key with a small test payment

---

## 💡 Quick Prompts for Common Tasks

**To add a new feature:**  
"I'm working on KenteHaul — a React/Firebase kente fabric shop. [describe what you want]. The relevant file is [filename]. Here's the current code: [paste]"

**To fix a bug:**  
"KenteHaul bug: [describe what's wrong]. It happens when [trigger]. Relevant file: [filename]"

**To deploy:**  
"Help me deploy KenteHaul to Firebase Hosting. The project uses Vite + React."
