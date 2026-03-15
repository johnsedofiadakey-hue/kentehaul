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
  primaryColor: "#4c1d95",
  secondaryColor: "#f97316",

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

  // Payment Config (Replace with your Public Key)
  paystackPublicKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxx"
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

export const ORDER_STATUSES = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const INITIAL_GALLERY = [];

// ============================================================
// ORDER ID GENERATION - Production-grade readable format
// ============================================================
export const generateOrderId = (method = 'WA') => {
  const prefix = method === 'paystack' ? 'KH' : 'KW';
  const date = new Date();
  const datePart = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${datePart}-${rand}`;
  // Example: KW-250312-4821 (WhatsApp order, March 12 2025)
  // Example: KH-250312-4821 (Paystack/KenteHaul online)
};