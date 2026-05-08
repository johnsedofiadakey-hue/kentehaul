// src/data/constants.js

export const SHOP_CATEGORIES = [
  {
    id: 'kente',
    name: 'Kente',
    subcategories: ['Ombre', 'Pattern Kente', 'Plain Kente']
  },
  {
    id: 'smock',
    name: 'Smock',
    subcategories: ['Women', 'Sleeves', 'Sleeveless', 'Kids']
  },
  {
    id: 'sash',
    name: 'Sash',
    subcategories: ['Regular', 'Classic', 'Premium']
  },
  {
    id: 'corporate',
    name: 'Corporate Wears',
    subcategories: ['Men', 'Women']
  },
  {
    id: 'essentials',
    name: 'Everyday Essentials',
    subcategories: ['General']
  }
];

export const INITIAL_CONTENT = {
  // Brand Colors (Default: Royal Violet & Sunset Orange)
  primaryColor: "#5b0143",
  secondaryColor: "#f97316",

  // Flash Sale Settings
  flashSaleTitle: "Mother's Day Sales",
  flashSaleColor: "#5b0143",

  // Brand Assets
  logo: null,

  // Home Page Data
  heroTitle: "Weave Your Story",
  heroSubtitle: "Authentic Ghanaian Kente and Smocks. Bold colors, royal patterns, and modern style delivered to your doorstep.",
  heroImage: null,
  galleryTitle: "Lifestyle Gallery",
  testimonialsTitle: "Love from our Clients",
  heritageHomeTitle: "A Story in Every Thread",

  // Heritage Page Data
  heritageTitle: "Our Royal Heritage",
  heritageText: "Legend has it that Kente was first woven by two friends who learned the art by watching a spider spin its web. Today, it stands as a symbol of African pride, royalty, and cultural resilience. At KenteHaul, we honor this legacy by sourcing directly from the master weavers of Bonwire and Adanwomase.",

  // Institute Page Data
  instituteTitle: "Kente Institute",
  instituteText: "Kente is not just a cloth; it is a language. Originating from the Ashanti Kingdom, every pattern tells a story, every color holds a meaning. At the Kente Institute, we preserve these ancient weaving techniques and educate the world on the royal significance of Ghana's most prized fabric.",
  instituteArtifactsTitle: "Educational Artifacts",

  // Contact Data
  contactEmail: "info@kentehaul.com",
  contactPhone: "+233 54 024 9684",
  adminPin: "123456",

  // Legacy Homepage Content
  heritageSummary: "In the heart of West Africa, long before global fashion houses discovered the power of storytelling through fabric, master weavers in Ghana were already doing it, thread by thread. Kente Haul was born from that same spirit. A simple belief that this culture should be worn, celebrated, and shared with the world. We exist to move heritage forward by creating authentic, high-quality Kente pieces and essentials that speaks to culture whiles embracing new-day fashion. We bring culture, fashion and comfort directly to people who value craftsmanship and true identity. Our mission is simple: connect modern style with centuries of African excellence.",

  // Delivery & Shipping options
  deliveryRegions: [
    { region: 'Accra', fee: 30 },
    { region: 'Other Ghana', fee: 70 },
    { region: 'International', fee: 250 }
  ],

  // Payment Config
  paystackPublicKey: "pk_live_adc0c246926e6638234258b6c5393c1b9f48dd1f",
  paystackEnabled: true,
  whatsappEnabled: true,
  vapidKey: "BN2rEFZO8KuagTFO09EPUklifvzEK6NGO31ujUAvWJq_t8lDu82Lsv6f8s0mKM3YsxOnd_oLoVQxEpXaTbt3n6A",
  googleAnalyticsId: "G-XXXXXXXXXX",
  facebookPixelId: "PIXEL_ID",
  adminFcmToken: "",
  lastTokenUpdate: null,

  // Legal Policies
  privacyPolicy: "### Privacy Policy\n\nYour privacy is important to us. It is KenteHaul's policy to respect your privacy regarding any information we may collect from you across our website.\n\n**1. Information we collect**\nWe only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.\n\n**2. Use of Information**\nWe only retain collected information for as long as necessary to provide you with your requested service.\n\n**3. Data Security**\nWe protect your data within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.",
  termsConditions: "### Terms & Conditions\n\nWelcome to KenteHaul. By accessing our website, you agree to be bound by these terms of service, all applicable laws and regulations.\n\n**1. Use License**\nPermission is granted to temporarily download one copy of the materials on KenteHaul's website for personal, non-commercial transitory viewing only.\n\n**2. Disclaimer**\nThe materials on KenteHaul's website are provided on an 'as is' basis. KenteHaul makes no warranties, expressed or implied.\n\n**3. Limitations**\nIn no event shall KenteHaul or its suppliers be liable for any damages arising out of the use or inability to use the materials on KenteHaul's website.",
  // Shipping and Return policies
  refundPolicy: "### Refund & Return Policy\n\nAt KenteHaul, we take pride in the quality of our hand-woven products. Because each piece is custom-made or unique, our refund policy is as follows:\n\n**1. Returns**\nYou have 7 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it.\n\n**2. Refunds**\nOnce we receive your item, we will inspect it and notify you that we have received your returned item. If your return is approved, we will initiate a refund to your original method of payment.\n\n**3. Shipping**\nYou will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable.",

  // Invoice & Sharing Templates
  invoiceEmailSubject: "Invoice for Your KenteHaul Order #[orderId]",
  invoiceEmailBody: "Dear [customerName],\n\nThank you for choosing KenteHaul. Please find your official invoice attached to this email.\n\nOrder ID: #[orderId]\nTotal Amount: ₵[total]\n\nWe appreciate your business!\n\nBest Regards,\nKenteHaul Team",
  invoiceWhatsAppMsg: "Hello [customerName], here is your KenteHaul invoice for Order #[orderId]: [invoiceUrl]. Total: ₵[total]. Thank you!",

  // Production Notification Templates
  productionUpdateEmailSubject: "Production Update: Your Kente is now in [stage] stage - #[orderId]",
  productionUpdateEmailBody: "Dear [customerName],\n\nWe are excited to inform you that your authentic Ghanaian Kente (Order #[orderId]) has progressed to the next stage of our traditional weaving process.\n\nCurrent Stage: [stage]\nEstimated Completion: [completionDate]\n\n[stageDescription]\n\nYou can track the live progress here: [trackingUrl]\n\nThank you for supporting traditional craftsmanship.\n\nBest Regards,\nKenteHaul Team",
  productionUpdateWhatsAppMsg: "Hi [customerName], great news! Your Kente order #[orderId] has progressed to: *[stage]*. \n\n[stageDescription]\n\nTrack live here: [trackingUrl]"
};

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/kentehaul?igsh=bmp1dm55OTZkcHd0",
  tiktok: "https://www.tiktok.com/@kente_haul?_r=1&_t=ZM-92MhyIDEzIR",
  whatsapp: "https://wa.me/233540249684"
};

export const INITIAL_FEEDBACK = [
  { id: 1, name: "Ama K.", text: "The fabric quality is absolutely stunning! I wore my sash to a wedding and got so many compliments.", rating: 5, image: null },
  { id: 2, name: "John D.", text: "Fast delivery to London. The colors are even more vibrant in person.", rating: 5, image: null }
];

export const ORDER_STATUSES = [
  'Order Placed',
  'Payment Confirmed',
  'Preparing Order',
  'Under Production', // New umbrella for pre-orders
  'Quality Check',
  'Rider Assigned',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

export const PRODUCTION_STAGES = [
  { id: 'placed', label: 'Order Placed', progress: 0 },
  { id: 'warping', label: 'Warping (Setting the Loom)', progress: 25 },
  { id: 'weaving', label: 'Weaving in Progress', progress: 50 },
  { id: 'qc', label: 'Quality Check', progress: 75 },
  { id: 'finished', label: 'Ready for Delivery', progress: 100 }
];

export const DELIVERY_METHODS = [
  { id: 'customer_rider', label: 'I will send my own rider' },
  { id: 'seller_rider', label: 'Seller should arrange rider' },
  { id: 'pickup', label: 'Pickup from store' }
];

export const INITIAL_GALLERY = [];

// ============================================================
// SECURITY UTILITIES - Secure Hashing for Credentials
// ============================================================
export const hashPassword = async (password) => {
  if (!password) return null;
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// ============================================================
// ORDER ID GENERATION - Production-grade readable format
// ============================================================
export const generateOrderId = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KH${rand}`;
  // Example: KH4821
};