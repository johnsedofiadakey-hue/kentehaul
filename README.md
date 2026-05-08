# KenteHaul | The Elite Heritage Boutique

KenteHaul is a high-performance, professional e-commerce platform designed for the global trade of authentic Ghanaian Kente and Smocks. Built with a "Culture-First" philosophy, it combines the personal touch of WhatsApp commerce with the robustness of institutional payment processing.

## 🚀 Key Features

### 1. Dynamic Branding CMS
- **Real-time Identity**: Admins can update brand colors (Primary/Secondary), logos, and hero content instantly without code changes.
- **Content Studio**: Manage category hierarchies, home page lifestyles, and student artifacts from the integrated Admin Dashboard.

### 2. Atomic Commerce Logic
- **Sync-Wait Checkout**: Implements a robust "Atomic" write strategy. Orders are secured first, while background processes handle secondary stock deduction and CRM updates to ensure zero data loss.
- **Multi-Channel Checkout**:
    - **WhatsApp Direct**: Personalized shopping experience.
    - **Paystack Live**: Institutional-grade credit card and Mobile Money processing.

### 3. CRM & Insights (Admin Hub)
- **Customer Dossiers**: Automatic profile creation for every shopper, tracking lifetime value and order frequency.
- **Order Tracking**: Real-time order lifecycle management with custom status updates.
- **Product Analytics**: Heart-tracking logic to identify "Trending" royalty pieces before they sell out.

### 4. Viral Marketing & SEO
- **Social Preview Mastery**: Every product detail page is optimized with OpenGraph meta tags. Sharing a link on WhatsApp/Instagram displays the high-res product image, price, and heritage story.
- **SEO Component**: Dynamic title and meta-description management using `react-helmet-async`.
- **Integrated Tracking**: Native support for Google Analytics 4 (GA4) and Facebook Pixel events.

### 5. Automated Operations
- **FCM Notifications**: Hand-held administration via Firebase Cloud Messaging. Admins receive push alerts on their mobile/desktop for every new order.
- **Branded Email Receipts**: Automatic dispatch of "Royal Heritage" HTML invoices using the Firebase Trigger Email extension.

---

## 🛠 Tech Stack
- **Frontend**: React 18 (Vite), Tailwind CSS, Framer Motion (Animations), Lucide (Icons).
- **Backend / BaaS**: Firebase.
    - **Firestore**: Atomic database logic.
    - **Auth**: Secure Admin Authentication.
    - **Storage**: Real-time image optimization.
    - **Messaging**: Cloud Messaging (FCM).
- **Payments**: Paystack SDK (GHS/USD).

---

## 💾 Backup & Data Integrity

### Google Drive Backups
KenteHaul utilizes a periodic data export strategy. 
1. **Firestore Export**: Data can be exported to a Cloud Storage bucket as a `.json` or `.gcloud` export.
2. **Drive Archival**: These exports are then synced to the Owner’s Google Drive for long-term historical retention.

### Restoration Procedure
1. Locate the latest JSON export in the `Backup/Firestore` folder on Google Drive.
2. Use the `import` utility in the Firebase Admin SDK or the Google Cloud CLI to restore:
   ```bash
   gcloud firestore import gs://[BACKUP_BUCKET]/[PATH_TO_BACKUP]
   ```

---

## 🔑 API Configuration & Go-Live

To maintain platform stability, ensure the following keys are verified in `src/data/constants.js` or the Admin Settings:

| Key | Purpose | Source |
|---|---|---|
| **Paystack 公鑰 (pk_live)** | Real money payments | Paystack Dashboard |
| **VAPID Key** | Admin Push Alerts | Firebase Project Settings |
| **Analytics ID** | Traffic Tracking | Google Analytics G-ID |
| **Pixel ID** | Ad Conversion | FB Events Manager |

---

## 💂 Production Security
The platform is protected by hardened **Firestore Security Rules**. These rules enforce:
- **PII Isolation**: Customer phone numbers and addresses are strictly hidden from the public.
- **Admin Lock**: Write access to `settings`, `products`, and `orders` is restricted to authorized administrative emails.
- **Write Sanity**: Stock quantity updates are validated to prevent over-selling.

---
© 2026 KenteHaul | Authentically Ghanaian. Digitally Global.
