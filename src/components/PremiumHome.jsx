import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Handshake,
  Layers,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
  ZoomIn
} from 'lucide-react';
import { LazyImage } from './UIComponents';
import SEO from './SEO';
import { FEATURED_PRODUCTS_LIMIT } from '../data/constants';
import useSaleWindow, { formatTimeLeft, isSaleLive } from '../hooks/useSaleWindow';

const DEFAULT_HERO_COPY = 'Authentic Ghanaian Kente and smocks, shaped by heritage and finished for modern ceremonies, gifts, and everyday pride.';

const DEFAULT_COLLECTIONS = [
  { id: 'kente',     title: 'Kente Cloth',     label: 'Royal woven cloth',   copy: 'Bold ceremonial strips, color symbolism, and heirloom weight for weddings, durbars, and milestone moments.' },
  { id: 'smock',     title: 'Smocks',           label: 'Northern craft',       copy: 'Fugu silhouettes with texture, structure, and everyday presence for men, women, and young wearers.' },
  { id: 'sash',      title: 'Sashes',           label: 'Finishing pieces',     copy: 'Presentation-ready accents for graduations, gifting, naming ceremonies, and formal recognition.' },
  { id: 'corporate', title: 'Corporate Wears',  label: 'Work and occasion',    copy: 'Measured heritage details for teams, leaders, cultural programs, and polished public appearances.' },
];

const DEFAULT_CRAFT_STEPS = [
  { title: 'Color Carries Meaning',   body: 'Gold, green, black, and red are treated as cultural language, not decoration. The palette now lets the cloth lead.' },
  { title: 'The Cloth Stays Large',   body: 'Imagery has more room to breathe, so customers can inspect texture, scale, drape, and pattern before they buy.' },
  { title: 'Ownership Feels Direct',  body: 'Discovery, price, availability, and next steps stay close together so the customer can move from attraction to action without losing the story.' },
];

const DEFAULT_TRUST = [
  { icon: ShieldCheck, label: 'Authentic Ghanaian craft' },
  { icon: Truck,       label: 'Nationwide delivery options' },
  { icon: Handshake,   label: 'Custom and partnership orders' },
];

const formatPrice = (value) => `₵${Number(value || 0).toLocaleString()}`;

const productStock = (product) => product?.stockQuantity ?? product?.stock ?? 0;

const displayPrice = (product, siteContent) => {
  if (!product) return 0;
  return isSaleLive(siteContent) ? product.price : (product.originalPrice || product.price);
};

const imageFromProducts = (products, categoryId) => (
  products.find((product) => product.category === categoryId && product.image)?.image
);

/** Inline email capture for the "coming soon" banner. The actual send is server-side
 *  (functions/index.js:dispatchSaleAnnouncement) — this only writes the subscriber doc. */
const NotifyMeForm = ({ onSubscribe }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!onSubscribe || status === 'sending' || status === 'done') return;
    setStatus('sending');
    const result = await onSubscribe(email);
    if (result?.success) {
      setStatus('done');
    } else {
      setStatus('error');
      setError(result?.error || 'Something went wrong.');
    }
  };

  if (status === 'done') {
    return <span className="text-[#d9b05d] normal-case tracking-normal font-bold text-xs">You're on the list — we'll email you the moment it opens.</span>;
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 normal-case tracking-normal">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
        placeholder="Notify me by email"
        className="bg-white/10 border border-white/20 px-3 py-2 text-xs text-[#f8f1e6] placeholder:text-[#f8f1e6]/50 outline-none focus:border-[#d9b05d] w-40 sm:w-48"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-[#d9b05d] text-[#211b17] px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-60 whitespace-nowrap"
      >
        {status === 'sending' ? 'Sending…' : 'Notify Me'}
      </button>
      {status === 'error' && <span className="text-red-300 text-[10px] font-bold">{error}</span>}
    </form>
  );
};

export default function PremiumHome({ siteContent, gallery = [], feedbacks = [], products = [], addToCart, onSaleSubscribe }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const { phase: salePhase, timeLeft } = useSaleWindow(siteContent);
  const heroRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  const heroScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 1.12]);
  const heroY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 120]);
  const titleY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -58]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0.2]);
  const wovenScale = useTransform(scrollYProgress, [0.3, 1], reduceMotion ? [1, 1] : [0.84, 1.24]);

  const stockedProducts = useMemo(
    () => products.filter((product) => productStock(product) > 0),
    [products]
  );

  const featuredProducts = useMemo(() => {
    const curated = products.filter((product) => product.isFeatured);
    const pool = curated.length > 0 ? curated : products;
    return [...pool]
      .sort((a, b) => (b.date || 0) - (a.date || 0))
      .slice(0, FEATURED_PRODUCTS_LIMIT);
  }, [products]);

  const saleProducts = useMemo(
    () => products.filter((product) => product.isFlashSale || product.originalPrice > product.price).slice(0, 4),
    [products]
  );

  const heroImage = siteContent?.heroImage || gallery[0]?.image || stockedProducts[0]?.image || '';
  const storyImage = siteContent?.craftImage || 'https://storage.googleapis.com/kentehaul-b1cb5.firebasestorage.app/site-images/craft_home.jpg' || gallery[0]?.image || heroImage || featuredProducts[0]?.image || '';

  // Admin-overridable arrays — fall back to defaults when not set
  const collections = DEFAULT_COLLECTIONS.map((c, i) => ({
    ...c,
    title: siteContent?.[`collectionTitle${i}`] || c.title,
    label: siteContent?.[`collectionLabel${i}`] || c.label,
    copy:  siteContent?.[`collectionCopy${i}`]  || c.copy,
  }));
  const craftSteps = DEFAULT_CRAFT_STEPS.map((s, i) => ({
    title: siteContent?.[`craftStep${i}Title`] || s.title,
    body:  siteContent?.[`craftStep${i}Body`]  || s.body,
  }));
  const trustPoints = DEFAULT_TRUST.map((t, i) => ({
    ...t,
    label: siteContent?.[`trustLabel${i}`] || t.label,
  }));

  const galleryItems = gallery.length > 0
    ? gallery
    : featuredProducts.filter((product) => product.image).map((product) => ({
      id: product.id,
      image: product.image,
      description: product.name
    }));

  const collectionCards = useMemo(() => (
    collections.map((collection) => ({
      ...collection,
      image: imageFromProducts(products, collection.id) || heroImage || gallery[0]?.image || ''
    }))
  ), [products, heroImage, gallery, siteContent]);

  const reveal = (delay = 0, distance = 28) => ({
    initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: reduceMotion ? 0.01 : 0.76, delay, ease: [0.22, 1, 0.36, 1] }
  });

  return (
    <div className="kh-section animate-fade-in overflow-hidden">
      <SEO
        title={siteContent?.heroTitle || 'Home'}
        description={siteContent?.heroSubtitle || 'Discover the finest hand-woven Kente cloth from the heart of Ghana.'}
        ogTitle={`${siteContent?.heroTitle || 'KenteHaul'} | Authentic Ghanaian Heritage`}
        ogDescription="Shop authentic Ghanaian Kente, smocks, sashes, and heritage pieces with live checkout and WhatsApp ordering."
        canonicalPath="/"
      />

      <section ref={heroRef} className="relative min-h-[92svh] overflow-hidden bg-[#211b17] text-[#f8f1e6]">
        {heroImage ? (
          <motion.div className="absolute inset-0" style={{ scale: heroScale, y: heroY }}>
            <LazyImage
              src={heroImage}
              alt="KenteHaul hero"
              priority
              className="h-full w-full object-cover object-[center_22%]"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 kh-woven-grid bg-[#2a211b]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(33,27,23,0.88),rgba(33,27,23,0.52)_48%,rgba(33,27,23,0.2)),linear-gradient(0deg,rgba(33,27,23,0.78),rgba(33,27,23,0)_45%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f8f1e6] to-transparent" />
        <motion.div
          aria-hidden="true"
          style={{ scale: wovenScale, opacity: titleOpacity }}
          className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap kh-display text-[12vw] font-semibold leading-none text-[#f8f1e6]/10 md:block"
        >
          WOVEN FOR GENERATIONS
        </motion.div>

        <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-7xl flex-col justify-end px-5 pb-20 pt-32 sm:px-8 md:pb-24 lg:px-10">
          <motion.div style={{ y: titleY, opacity: titleOpacity }} className="max-w-4xl">
            <motion.p
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.7 }}
              className="mb-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d9b05d]"
            >
              {siteContent?.heroEyebrow || 'KenteHaul / Ghanaian Heritage House'}
            </motion.p>
            <motion.h1
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 1, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="kh-display max-w-4xl text-6xl font-semibold leading-[0.9] text-[#fff8ed] sm:text-7xl md:text-8xl lg:text-[8.5rem]"
            >
              {siteContent?.heroTitle || 'Woven for Legacy'}
            </motion.h1>
            <motion.p
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.9, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 max-w-2xl text-base leading-7 text-[#f8f1e6]/80 sm:text-lg md:text-xl"
            >
              {siteContent?.heroSubtitle || DEFAULT_HERO_COPY}
            </motion.p>

            <motion.div
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.8, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/shop"
                className="group inline-flex items-center justify-center gap-3 bg-[#b88a2b] px-7 py-4 text-[11px] font-black uppercase tracking-[0.26em] text-[#211b17] transition hover:bg-[#d0a445] active:scale-95"
              >
                {siteContent?.heroCta1Text || 'Shop the collection'}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/heritage"
                className="inline-flex items-center justify-center border border-[#f8f1e6]/30 px-7 py-4 text-[11px] font-black uppercase tracking-[0.26em] text-[#fff8ed] transition hover:border-[#f8f1e6] hover:bg-[#f8f1e6]/10 active:scale-95"
              >
                {siteContent?.heroCta2Text || 'Read the heritage'}
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.9, delay: 0.55 }}
            className="mt-14 grid gap-3 border-t border-[#f8f1e6]/20 pt-5 sm:grid-cols-3 lg:max-w-3xl"
          >
            {trustPoints.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-[#f8f1e6]/72">
                <Icon size={18} className="text-[#d9b05d]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Announcement bar. 'upcoming' builds awareness before the sale opens and
          counts down to the start; 'live' counts down to the close. Both vanish on
          their own at 'ended' — no manual untick required. */}
      {(salePhase === 'upcoming' || salePhase === 'live') && (
        <section
          className={`kh-thread border-y px-5 py-4 ${salePhase === 'upcoming'
            ? 'border-[#d9b05d]/40 bg-[#34271f] text-[#f8f1e6]'
            : 'border-[#b88a2b]/25 bg-[#211b17] text-[#f8f1e6]'}`}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 text-center text-[11px] font-black uppercase tracking-[0.28em] sm:justify-between sm:text-left">
            {salePhase === 'upcoming' ? (
              <>
                <span>
                  <span className="text-[#d9b05d]">Coming soon — </span>
                  {siteContent?.flashSaleTitle || 'Limited Heritage Offering'}
                  {siteContent?.flashSaleTeaser ? ` — ${siteContent.flashSaleTeaser}` : ''}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {timeLeft.total > 0 && (
                    <span className="text-[#d9b05d]">Opens in {formatTimeLeft(timeLeft)}</span>
                  )}
                  <NotifyMeForm onSubscribe={onSaleSubscribe} />
                </div>
              </>
            ) : (
              <>
                <span>{siteContent?.flashSaleTitle || 'Limited Heritage Offering'} is live</span>
                {timeLeft.total > 0 && (
                  <span className="text-[#d9b05d]">Ends in {formatTimeLeft(timeLeft)}</span>
                )}
              </>
            )}
          </div>
        </section>
      )}

      <section className="relative bg-[#f8f1e6] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <motion.div {...reveal()} className="grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-end">
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-[#a24f32]">{siteContent?.homeCollectionsEyebrow || 'Shop by collection'}</p>
              <h2 className="kh-display text-5xl font-semibold leading-[0.95] text-[#211b17] md:text-7xl">
                {siteContent?.homeCollectionsHeadline || 'Heritage categories, edited like a wardrobe.'}
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#5f554d] md:justify-self-end md:text-lg">
              {siteContent?.homeCollectionsBody || 'Browse by purpose, from full ceremonial cloth to sashes and corporate pieces. The cards are intentionally image-led so the existing product photography remains the storefront anchor.'}
            </p>
          </motion.div>

          <div className="-mx-5 mt-12 flex snap-x gap-4 overflow-x-auto px-5 pb-5 scrollbar-hide md:mx-0 md:gap-5 md:px-0">
            {collectionCards.map((collection, index) => (
              <motion.div
                key={collection.id}
                {...reveal(index * 0.06, 34)}
                className="group min-w-[82vw] snap-start overflow-hidden bg-[#211b17] text-[#f8f1e6] shadow-[0_28px_80px_rgba(33,27,23,0.16)] transition-all duration-700 md:min-w-0 md:flex-1 md:hover:flex-[1.45]"
              >
                <Link to={`/shop?category=${collection.id}`} className="block">
                  <div className="relative h-[420px] overflow-hidden md:h-[520px]">
                    {collection.image ? (
                      <LazyImage
                        src={collection.image}
                        alt={collection.title}
                        className="h-full w-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full kh-woven-grid bg-[#34271f]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#211b17] via-[#211b17]/20 to-transparent" />
                    <div className="absolute inset-x-5 bottom-5">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#d9b05d]">{collection.label}</p>
                      <h3 className="kh-display text-4xl font-semibold leading-none">{collection.title}</h3>
                      <p className="mt-4 max-w-sm text-sm leading-6 text-[#f8f1e6]/75 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                        {collection.copy}
                      </p>
                    </div>
                    <ArrowRight className="absolute right-5 top-5 text-[#f8f1e6] transition-transform group-hover:translate-x-1" size={21} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {siteContent?.featuredEnabled !== false && featuredProducts.length > 0 && (
        <section className="bg-[#fffaf1] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal()} className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-[#243f2c]">{siteContent?.homeFeaturedEyebrow || 'The Kente edit'}</p>
                <h2 className="kh-display text-5xl font-semibold leading-[0.95] text-[#211b17] md:text-7xl">
                  {siteContent?.homeFeaturedHeadline || 'Featured pieces with room to breathe.'}
                </h2>
              </div>
              <Link
                to="/shop"
                className="group inline-flex w-fit items-center gap-3 border-b border-[#211b17] pb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#211b17]"
              >
                Shop all pieces
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              {featuredProducts[0] && (
                <motion.article {...reveal(0.08)} className="group bg-[#f8f1e6]">
                  <Link to={`/shop?product=${featuredProducts[0].id}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden md:aspect-[5/4]">
                      {featuredProducts[0].image ? (
                        <LazyImage
                          src={featuredProducts[0].image}
                          alt={featuredProducts[0].name}
                          className="h-full w-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center kh-woven-grid text-[#b88a2b]">
                          <ShoppingBag size={56} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#211b17]/48 to-transparent opacity-70" />
                      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-5 text-[#fff8ed]">
                        <div>
                          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#d9b05d]">
                            {featuredProducts[0].subcategory || featuredProducts[0].category || 'Featured'}
                          </p>
                          <h3 className="kh-display text-4xl font-semibold leading-none md:text-6xl">{featuredProducts[0].name}</h3>
                        </div>
                        <p className="hidden text-2xl font-semibold md:block">{formatPrice(displayPrice(featuredProducts[0], siteContent))}</p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-col gap-4 border border-[#211b17]/10 border-t-0 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-2xl font-semibold text-[#211b17] md:hidden">{formatPrice(displayPrice(featuredProducts[0], siteContent))}</p>
                    <p className="max-w-xl text-sm leading-6 text-[#5f554d]">
                      {featuredProducts[0].description || 'A selected KenteHaul piece with authentic texture, pattern, and Ghanaian craft at the center.'}
                    </p>
                    <button
                      onClick={() => addToCart?.(featuredProducts[0])}
                      disabled={productStock(featuredProducts[0]) <= 0}
                      className="inline-flex items-center justify-center gap-2 bg-[#211b17] px-5 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#fff8ed] transition hover:bg-[#3a2b22] active:scale-95 disabled:bg-[#d8c9b7] disabled:text-[#8a7a68]"
                    >
                      <ShoppingBag size={15} />
                      Add to bag
                    </button>
                  </div>
                </motion.article>
              )}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {featuredProducts.slice(1).map((product, index) => (
                  <motion.article
                    key={product.id}
                    {...reveal(0.12 + index * 0.06)}
                    className="group grid grid-cols-[116px_1fr] gap-4 border border-[#211b17]/10 bg-[#f8f1e6] p-3 sm:grid-cols-1 lg:grid-cols-[140px_1fr]"
                  >
                    <Link to={`/shop?product=${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-[#efe2cf]">
                      {product.image ? (
                        <LazyImage
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#b88a2b]">
                          <ShoppingBag size={32} />
                        </div>
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-col justify-between">
                      <div>
                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.24em] text-[#a24f32]">
                          {product.subcategory || product.category || 'Heritage'}
                        </p>
                        <Link to={`/shop?product=${product.id}`} className="kh-display block text-2xl font-semibold leading-none text-[#211b17] transition hover:text-[#a24f32]">
                          {product.name}
                        </Link>
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="text-lg font-semibold text-[#211b17]">{formatPrice(displayPrice(product, siteContent))}</span>
                        <button
                          onClick={() => addToCart?.(product)}
                          disabled={productStock(product) <= 0}
                          className="inline-flex h-11 w-11 items-center justify-center bg-[#211b17] text-[#fff8ed] transition hover:bg-[#b88a2b] hover:text-[#211b17] active:scale-95 disabled:bg-[#d8c9b7] disabled:text-[#8a7a68]"
                          title="Add to bag"
                        >
                          <ShoppingBag size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {salePhase === 'live' && saleProducts.length > 0 && (
        <section className="bg-[#211b17] px-5 py-16 text-[#f8f1e6] sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <motion.div {...reveal()}>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-[#d9b05d]">
                {siteContent?.homeSaleEyebrow || 'Limited offering'}
              </p>
              <h2 className="kh-display text-5xl font-semibold leading-[0.95] md:text-6xl">
                {siteContent?.homeSaleHeadline || 'Current sale pieces, still presented with restraint.'}
              </h2>
            </motion.div>
            <div className="grid gap-3 sm:grid-cols-2">
              {saleProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  {...reveal(index * 0.05)}
                  className="group grid grid-cols-[96px_1fr] gap-4 border border-[#f8f1e6]/10 bg-[#f8f1e6]/5 p-3"
                >
                  <Link to={`/shop?product=${product.id}`} className="aspect-square overflow-hidden bg-[#34271f]">
                    {product.image && (
                      <LazyImage src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    )}
                  </Link>
                  <div className="flex flex-col justify-between">
                    <Link to={`/shop?product=${product.id}`} className="kh-display text-2xl font-semibold leading-none transition hover:text-[#d9b05d]">
                      {product.name}
                    </Link>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-[#d9b05d]">{formatPrice(product.price)}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-[#f8f1e6]/40 line-through">{formatPrice(product.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative bg-[#f8f1e6] px-5 py-20 sm:px-8 md:py-32 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <motion.div {...reveal()} className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative overflow-hidden kh-kente-mask bg-[#efe2cf]">
              {storyImage ? (
                <LazyImage src={storyImage} alt="Craftsmanship" className="aspect-[4/5] h-full w-full object-cover" />
              ) : (
                <div className="aspect-[4/5] kh-woven-grid" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#211b17]/30 to-transparent" />
            </div>
            <div className="mt-5 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#5f554d]">
              <Layers size={16} className="text-[#b88a2b]" />
              {siteContent?.homeCraftCaption || 'Pattern, thread, provenance'}
            </div>
          </motion.div>

          <div>
            <motion.div {...reveal()} className="mb-12">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-[#a24f32]">{siteContent?.homeCraftEyebrow || 'Craftsmanship'}</p>
              <h2 className="kh-display text-5xl font-semibold leading-[0.95] text-[#211b17] md:text-7xl">
                {siteContent?.homeCraftHeadline || 'A quieter page, built around the weight of the cloth.'}
              </h2>
            </motion.div>
            <div className="space-y-5">
              {craftSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  {...reveal(index * 0.08, 36)}
                  className="kh-thread border border-[#211b17]/10 bg-[#fffaf1] p-6 md:p-8"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="kh-display text-5xl font-semibold text-[#b88a2b]">0{index + 1}</span>
                    <CheckCircle size={21} className="text-[#243f2c]" />
                  </div>
                  <h3 className="kh-display text-3xl font-semibold leading-none text-[#211b17]">{step.title}</h3>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f554d]">{step.body}</p>
                </motion.div>
              ))}
            </div>
            <motion.div {...reveal(0.24)} className="mt-10">
              <Link
                to="/heritage"
                className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.32em] text-[#a24f32] hover:text-[#211b17] transition-colors duration-300 group"
              >
                Discover Our Heritage
                <span className="inline-block w-8 h-px bg-[#a24f32] group-hover:w-16 transition-all duration-500" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {galleryItems.length > 0 && (
        <section className="bg-[#fffaf1] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal()} className="mb-12 max-w-3xl">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-[#243f2c]">
                {siteContent?.galleryTitle || 'Lifestyle Gallery'}
              </p>
              <h2 className="kh-display text-5xl font-semibold leading-[0.95] text-[#211b17] md:text-7xl">
                {siteContent?.homeGalleryHeadline || 'Large moments for texture, drape, and ceremony.'}
              </h2>
            </motion.div>

            <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[280px] md:grid-cols-4">
              {galleryItems.slice(0, 8).map((item, index) => (
                <motion.button
                  key={item.id || index}
                  type="button"
                  {...reveal((index % 4) * 0.04)}
                  onClick={() => setSelectedImage(item.image)}
                  className={`group relative overflow-hidden bg-[#efe2cf] text-left ${index === 0 || index === 5 ? 'col-span-2 row-span-2' : ''}`}
                >
                  <LazyImage
                    src={item.image}
                    alt={item.description || 'KenteHaul gallery'}
                    className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[#211b17]/0 transition group-hover:bg-[#211b17]/30" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[#fff8ed] opacity-0 transition group-hover:opacity-100">
                    <ZoomIn size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.24em]">View</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#211b17] px-5 py-20 text-[#f8f1e6] sm:px-8 md:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[0.85fr_1.15fr] md:items-start">
          <motion.div {...reveal()}>
            <p className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.32em] text-[#d9b05d]">
              <MessageCircle size={15} />
              {siteContent?.testimonialsTitle || 'Love from our Clients'}
            </p>
            <h2 className="kh-display text-5xl font-semibold leading-[0.95] md:text-7xl">
              {siteContent?.homeTestimonialsHeadline || 'Proof in the wearing.'}
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {feedbacks.length > 0 ? feedbacks.slice(0, 4).map((feedback, index) => (
              <motion.article
                key={feedback.id}
                {...reveal(index * 0.06)}
                className="border border-[#f8f1e6]/10 bg-[#f8f1e6]/5 p-6"
              >
                <div className="mb-5 flex text-[#d9b05d]">
                  {[...Array(5)].map((_, starIndex) => (
                    <Star key={starIndex} size={15} fill={starIndex < feedback.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="text-base leading-7 text-[#f8f1e6]/80">"{feedback.text}"</p>
                <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-[#d9b05d]">
                  {feedback.name}
                </p>
              </motion.article>
            )) : (
              <motion.div {...reveal()} className="sm:col-span-2 border border-[#f8f1e6]/10 bg-[#f8f1e6]/5 p-8 text-[#f8f1e6]/70">
                Client stories will appear here once feedback is added in Admin.
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex cursor-zoom-out items-center justify-center bg-[#211b17]/95 p-4 md:p-10"
            onClick={() => setSelectedImage(null)}
          >
            <button
              type="button"
              className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center border border-[#f8f1e6]/20 text-[#f8f1e6] transition hover:bg-[#f8f1e6]/10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={22} />
            </button>
            <motion.img
              initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              src={selectedImage}
              className="max-h-full max-w-full object-contain shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
              alt="KenteHaul gallery detail"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
