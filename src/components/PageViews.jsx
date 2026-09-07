import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, MessageCircle, Star, Quote, Phone, Mail, MapPin, ShoppingBag, X, ChevronLeft, ChevronRight, ZoomIn, ArrowRight, CheckCircle, Compass } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LazyImage, MagneticButton } from './UIComponents';
import PhoneInput from './PhoneInput';
import SEO from './SEO';
import { FEATURED_PRODUCTS_LIMIT } from '../data/constants';

// Helper for paragraphing and rich text (bold/italics) from Admin
const FormattedText = ({ text, centered = false }) => {
  if (!text) return null;
  
  // Basic markdown-lite formatter
  const formatText = (content) => {
    return content.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className={`space-y-6 ${centered ? 'text-center' : 'text-left'}`}>
      {text.split(/\n\s*\n/).filter(p => p.trim() !== '').map((para, i) => (
        <p key={i} className="leading-relaxed whitespace-pre-wrap">{formatText(para)}</p>
      ))}
    </div>
  );
};

const ContactForm = ({ primaryColor, secondaryColor }) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.message) return;
    setIsSubmitting(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-12 bg-[#f0ebe2] rounded-[40px] border border-[#d9c9b0]">
        <div className="w-16 h-16 bg-[#243f2c] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-2xl font-black text-[#211b17] mb-2 uppercase tracking-tight">Message Received</h3>
        <p className="text-[#5f554d] font-bold">Thank you for reaching out. We'll get back to you shortly.</p>
      </motion.div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
          <input 
            type="text" 
            placeholder="Kofi" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-gray-200 font-bold" 
            value={formData.firstName}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
          <input 
            type="text" 
            placeholder="Mensah" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-gray-200 font-bold" 
            value={formData.lastName}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Email</label>
        <input 
          type="email" 
          placeholder="email@example.com" 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-gray-200 font-bold" 
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
        <PhoneInput 
          placeholder="Phone Number"
          value={formData.phone}
          onChange={val => setFormData({ ...formData, phone: val })}
          primaryColor={primaryColor}
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Message</label>
        <textarea 
          placeholder="Tell us about your custom order or inquiry..." 
          className="w-full p-5 bg-gray-50 rounded-[32px] border-none focus:ring-2 focus:ring-gray-200 h-40 resize-none font-bold"
          value={formData.message}
          onChange={e => setFormData({ ...formData, message: e.target.value })}
        ></textarea>
      </div>
      
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[4px] transition shadow-2xl flex items-center justify-center gap-3 disabled:opacity-60"
        style={{ backgroundColor: secondaryColor }}
      >
        <ArrowRight size={18} /> {isSubmitting ? 'Sending…' : 'Send Message'}
      </motion.button>
    </form>
  );
};

const PartnerForm = ({ siteContent }) => {
  const [form, setForm] = useState({ name: '', organization: '', email: '', phone: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await addDoc(collection(db, "partnerships"), {
        ...form,
        status: 'new',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-12 bg-green-50 rounded-[40px] border border-green-100">
        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <CheckCircle size={40} />
        </div>
        <h3 className="text-2xl font-black text-green-900 mb-2 uppercase tracking-tight">Vision Received</h3>
        <p className="text-green-700 font-bold">Thank you for reaching out. Our team will review your partnership proposal and get in touch shortly.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-8 md:p-12 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
          <input required type="text" placeholder="Your Name" className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500/20" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Organization</label>
          <input type="text" placeholder="Institution / Company Name" className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500/20" value={form.organization} onChange={e => setForm({...form, organization: e.target.value})} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Email</label>
          <input required type="email" placeholder="email@example.com" className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500/20" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
          </div>
          <PhoneInput value={form.phone} onChange={val => setForm({...form, phone: val})} primaryColor={siteContent?.primaryColor} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Why Partner With Us? / Vision</label>
        <textarea required placeholder="Tell us about your proposed collaboration..." className="w-full p-5 bg-white border border-gray-100 rounded-3xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500/20 h-40 resize-none" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full py-6 text-white rounded-3xl font-black text-xs uppercase tracking-[5px] shadow-2xl transition hover:shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3" style={{ backgroundColor: siteContent?.primaryColor || '#5b0143' }}>
        {isSubmitting ? "Processing..." : <><ArrowRight size={18} /> Send Partnership Inquiry</>}
      </button>
    </form>
  );
};

const PartnerInvitation = ({ siteContent }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.button
            key="cta"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={() => setShowForm(true)}
            className="group relative overflow-hidden bg-gray-900 text-white px-16 py-8 rounded-[40px] font-black text-sm uppercase tracking-[6px] shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="relative z-10 flex items-center gap-3">
              {siteContent?.partnerCTA || "Partner With Us Now"} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </span>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} style={{ backgroundColor: siteContent?.secondaryColor || '#f97316' }}></div>
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            className="w-full"
          >
            <div className="flex justify-between items-center mb-8 px-4">
              <h3 className="text-sm font-black uppercase tracking-[3px] text-gray-400">Inquiry Application</h3>
              <button 
                onClick={() => setShowForm(false)}
                className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 hover:text-red-500 transition-colors"
              >
                Cancel inquiry
              </button>
            </div>
            <PartnerForm siteContent={siteContent} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- HERITAGE PAGE COMPONENT ---
const DEFAULT_kenteColors = [
  { color: '#d9b05d', name: 'Gold',  meaning: 'Royalty, wealth, and high status. Worn by kings and elders to mark authority.' },
  { color: '#243f2c', name: 'Green', meaning: 'Growth, renewal, and the vitality of the land. A symbol of harvest and new beginnings.' },
  { color: '#a24f32', name: 'Red',   meaning: 'Sacrifice, strength, and the blood of ancestors. A call to courage and remembrance.' },
  { color: '#211b17', name: 'Black', meaning: 'Spiritual maturity, aging, and the wisdom carried through generations.' },
];

const DEFAULT_weavingSteps = [
  { step: '01', title: 'The Thread Begins',   caption: 'Raw cotton and silk threads are hand-dyed in village pots, each colour mixed to exact cultural codes passed down through family lines.',                                       defaultImage: 'https://storage.googleapis.com/kentehaul-b1cb5.firebasestorage.app/site-images/weaving_step1.jpg' },
  { step: '02', title: 'Building the Loom',   caption: 'The horizontal strip loom — unchanged for centuries — is strung with warp threads. A master weaver sets the tension by hand, reading the cloth before it exists.',         defaultImage: 'https://storage.googleapis.com/kentehaul-b1cb5.firebasestorage.app/site-images/weaving_step2.jpg' },
  { step: '03', title: 'Hands at the Shuttle',caption: 'The weaver pulls the shuttle across in rhythmic beats. Every row is a decision — pattern, color, intention. No machine can replicate this pace.',                          defaultImage: 'https://storage.googleapis.com/kentehaul-b1cb5.firebasestorage.app/site-images/weaving_step3.jpg' },
  { step: '04', title: 'The Pattern Emerges', caption: 'Strip by strip — each four inches wide — the pattern locks into place. The cloth tells its story only once all strips are joined.',                                        defaultImage: 'https://storage.googleapis.com/kentehaul-b1cb5.firebasestorage.app/site-images/weaving_step4.jpg' },
  { step: '05', title: 'The Finished Cloth',  caption: 'Sewn together into a full length, the kente cloth is ready. What you hold is not fabric — it is biography, ceremony, and identity woven as one.',                        defaultImage: 'https://storage.googleapis.com/kentehaul-b1cb5.firebasestorage.app/site-images/weaving_step5.jpg' },
];

export const Heritage = ({ siteContent }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  // Admin-overridable versions of color meanings and weaving steps
  const kenteColors = DEFAULT_kenteColors.map((c, i) => ({
    ...c,
    name:    siteContent?.[`colorName${i}`]    || c.name,
    meaning: siteContent?.[`colorMeaning${i}`] || c.meaning,
  }));
  const weavingSteps = DEFAULT_weavingSteps.map((s, i) => ({
    ...s,
    title:   siteContent?.[`weavingTitle${i}`]   || s.title,
    caption: siteContent?.[`weavingCaption${i}`] || s.caption,
  }));

  // Auto-advance slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % weavingSteps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const heroImage = siteContent?.heritageHeroImage ||
    'https://storage.googleapis.com/kentehaul-b1cb5.firebasestorage.app/site-images/heritage_hero.jpg';

  return (
    <div className="bg-[#f8f1e6] min-h-screen">
      <SEO
        title="Our Heritage & History"
        description="Learn about the centuries-old tradition of Kente weaving and the master artisans behind KenteHaul."
        ogTitle="The Legend of Kente | KenteHaul Heritage"
        ogDescription="Explore the meanings of colors and patterns in Ghanaian Kente cloth."
        canonicalPath="/heritage"
      />

      {/* ── Hero ── */}
      <div className="relative h-[75vh] min-h-[480px] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={heroImage}
            alt="Kente Heritage"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#211b17]/60 via-[#211b17]/30 to-[#211b17]/70" />
        </motion.div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-[#d9b05d] font-black text-[10px] uppercase tracking-[0.5em] mb-6"
          >
            {siteContent?.heritageEyebrow || 'Ghanaian Heritage House'}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-[#fff8ed] leading-[0.95] tracking-tight max-w-4xl"
          >
            {siteContent?.heritageTitle || 'The Legend of Kente'}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-8 w-16 h-0.5 bg-[#d9b05d] origin-left"
          />
        </div>
      </div>

      {/* ── Story / Heritage Text ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b88a2b] mb-8">{siteContent?.heritageStoryEyebrow || 'Our Story'}</p>
            <div className="font-serif text-lg md:text-xl text-[#211b17] leading-[1.85]
              [&>div>p:first-child]:first-letter:text-6xl
              [&>div>p:first-child]:first-letter:font-bold
              [&>div>p:first-child]:first-letter:float-left
              [&>div>p:first-child]:first-letter:mr-3
              [&>div>p:first-child]:first-letter:leading-none
              [&>div>p:first-child]:first-letter:text-[#b88a2b]">
              {siteContent?.heritageText ? (
                <FormattedText text={siteContent.heritageText} />
              ) : (
                <p className="text-[#5f554d] italic">Heritage story coming soon…</p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Kente Color Meanings ── */}
      <section className="bg-[#211b17] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[#d9b05d] font-black text-[10px] uppercase tracking-[0.4em] mb-4">{siteContent?.heritageColorsEyebrow || 'A Language in Color'}</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#fff8ed] leading-tight">
              {siteContent?.heritageColorsHeadline || 'Every Thread Carries Meaning'}
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kenteColors.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7 }}
                className="group bg-[#2a211c] rounded-2xl p-6 hover:bg-[#32261f] transition-colors duration-300"
              >
                <div
                  className="w-10 h-10 rounded-full mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: c.color }}
                />
                <p className="font-black text-[#fff8ed] uppercase tracking-widest text-xs mb-3">{c.name}</p>
                <p className="text-[#5f554d] text-sm leading-relaxed">{c.meaning}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Weaving Process Slideshow ── */}
      <section className="py-24 px-6 bg-[#fffaf1] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a24f32] mb-4">How Kente Is Born</p>
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-[#211b17] leading-tight max-w-2xl">
              From Village Loom to Your Hands
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
            {/* Main image */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#efe2cf]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeSlide}
                  src={siteContent?.[`weavingSlide${activeSlide + 1}`] || weavingSteps[activeSlide].defaultImage}
                  alt={weavingSteps[activeSlide].title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-[#211b17]/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="font-black text-[#d9b05d] text-[10px] uppercase tracking-[0.4em]">
                      Step {weavingSteps[activeSlide].step}
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#fff8ed] mt-1">
                      {weavingSteps[activeSlide].title}
                    </h3>
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Slide dots */}
              <div className="absolute top-5 right-5 flex gap-2">
                {weavingSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeSlide ? 'bg-[#d9b05d] w-6' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </div>

            {/* Step list */}
            <div className="space-y-3">
              {weavingSteps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`w-full text-left p-5 rounded-xl border transition-all duration-300 ${
                    i === activeSlide
                      ? 'border-[#b88a2b] bg-[#fff8ed] shadow-md'
                      : 'border-[#211b17]/10 bg-white hover:border-[#b88a2b]/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`font-serif text-2xl font-bold shrink-0 transition-colors duration-300 ${i === activeSlide ? 'text-[#b88a2b]' : 'text-[#211b17]/20'}`}>
                      {step.step}
                    </span>
                    <div>
                      <p className={`font-black text-sm mb-1 transition-colors duration-300 ${i === activeSlide ? 'text-[#211b17]' : 'text-[#5f554d]'}`}>
                        {step.title}
                      </p>
                      {i === activeSlide && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-[#5f554d] leading-relaxed"
                        >
                          {step.caption}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prev/Next controls */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => setActiveSlide(prev => (prev - 1 + weavingSteps.length) % weavingSteps.length)}
              className="w-12 h-12 rounded-full border border-[#211b17]/20 flex items-center justify-center hover:bg-[#211b17] hover:text-white hover:border-[#211b17] transition-all duration-300"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setActiveSlide(prev => (prev + 1) % weavingSteps.length)}
              className="w-12 h-12 rounded-full border border-[#211b17]/20 flex items-center justify-center hover:bg-[#211b17] hover:text-white hover:border-[#211b17] transition-all duration-300"
            >
              <ChevronRight size={20} />
            </button>
            <span className="text-[11px] font-black text-[#5f554d] uppercase tracking-widest ml-2">
              {activeSlide + 1} / {weavingSteps.length}
            </span>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative py-28 px-6 overflow-hidden" style={{ backgroundColor: siteContent?.primaryColor || '#5b0143' }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff8ed 0px, #fff8ed 4px, transparent 4px, transparent 18px), repeating-linear-gradient(0deg, #fff8ed 0px, #fff8ed 4px, transparent 4px, transparent 18px)' }}
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#d9b05d] font-black text-[10px] uppercase tracking-[0.5em] mb-6"
          >
            Wear the Story
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-5xl md:text-6xl font-bold text-[#fff8ed] leading-tight mb-10"
          >
            Own a Piece of History
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 bg-[#d9b05d] text-[#211b17] font-black text-sm uppercase tracking-[0.2em] px-10 py-5 rounded-full hover:bg-[#fff8ed] transition-colors duration-300"
            >
              Shop the Collection <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

// --- INSTITUTE PAGE COMPONENT ---
const DEFAULT_INSTITUTE_STATS = [
  { value: '200+', label: 'Artisans Supported' },
  { value: '5+',   label: 'Regions of Ghana' },
  { value: '100%', label: 'Handwoven & Authentic' },
];

const KenteStripeDivider = ({ primaryColor, secondaryColor }) => (
  <div className="w-full overflow-hidden" aria-hidden="true">
    <svg viewBox="0 0 1200 24" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {[...Array(30)].map((_, i) => (
        <rect
          key={i}
          x={i * 40}
          y={0}
          width={20}
          height={24}
          fill={i % 4 === 0 ? (primaryColor || '#5b0143') : i % 4 === 1 ? (secondaryColor || '#f97316') : i % 4 === 2 ? '#b88a2b' : '#243f2c'}
        />
      ))}
    </svg>
  </div>
);

export const Institute = ({ siteContent, products }) => {
  const instituteStats = DEFAULT_INSTITUTE_STATS.map((s, i) => ({
    value: siteContent?.[`statValue${i}`] || s.value,
    label: siteContent?.[`statLabel${i}`] || s.label,
  }));
  return (
  <div className="bg-[#f8f1e6] min-h-screen">
    <SEO
      title="KenteHaul Institute | Empowerment through Craft"
      description="Empowering local weavers and preserving Kente culture through our educational initiatives and partnerships."
      ogTitle="KenteHaul Institute | Preserving Royal Craft"
      canonicalPath="/institute"
    />

    {/* Hero */}
    <div className="text-white pt-28 pb-32 px-6 text-center relative overflow-hidden" style={{ backgroundColor: siteContent?.primaryColor || '#5b0143' }}>
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff8ed 0px, #fff8ed 2px, transparent 2px, transparent 16px)' }}
      />
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-[#d9b05d] font-black text-[10px] uppercase tracking-[0.5em] mb-6 relative z-10"
      >
        {siteContent?.instituteEyebrow || 'Weaving Community & Culture'}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="text-5xl md:text-7xl font-serif font-bold mb-0 relative z-10 leading-[0.95]"
      >
        {siteContent?.instituteTitle || 'KenteHaul Institute'}
      </motion.h1>
    </div>

    {/* Kente stripe divider */}
    <KenteStripeDivider primaryColor={siteContent?.primaryColor} secondaryColor={siteContent?.secondaryColor} />

    {/* Impact stats */}
    <div className="bg-[#211b17] py-10 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
        {instituteStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.7 }}
            className="text-center py-4"
          >
            <p className="font-serif text-3xl md:text-4xl font-bold text-[#d9b05d]">{stat.value}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fff8ed]/50 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>

    {/* Quote card */}
    <div className="max-w-4xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-white p-8 md:p-14 rounded-3xl shadow-xl border border-[#efe2cf]"
      >
        <Quote className="w-14 h-14 mb-6 mx-auto" style={{ color: `${siteContent?.secondaryColor || '#f97316'}60` }} />
        <div className="text-lg md:text-xl text-[#211b17] font-light leading-[1.85]">
          {siteContent?.instituteText
            ? <FormattedText text={siteContent.instituteText} centered={true} />
            : <p className="text-center text-[#5f554d] italic">Institute story coming soon…</p>
          }
        </div>
      </motion.div>
    </div>

    {/* Kente stripe divider */}
    <KenteStripeDivider primaryColor={siteContent?.primaryColor} secondaryColor={siteContent?.secondaryColor} />

    {/* Partner section */}
    <div id="partner" className="bg-white py-32 px-6 md:py-40 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-amber-500 font-black text-xs uppercase tracking-[6px] mb-6 block"
          >
            {siteContent?.partnerTag || 'Collaborate'}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black mb-10 uppercase tracking-tighter leading-[0.9] text-gray-900"
          >
            {siteContent?.partnerHeadline || (<>Building Together<br />A Vision for Ghana's<br />Royal Craft</>)}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 font-medium text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-16"
          >
            <FormattedText
              text={siteContent?.partnerBody || 'We welcome collaborations with institutions, cultural organizations, development partners, and individuals who share in this vision. Together, we can build a sustainable future for Kente weaving, empower young people and communities and keep the craft alive.'}
              centered
            />
          </motion.div>
        </motion.div>
        <PartnerInvitation siteContent={siteContent} />
      </div>
    </div>
  </div>
  );
};// --- CONTACT PAGE COMPONENT ---
const CONTACT_ITEMS = [
  { icon: Phone, label: 'Call Our Weavers', key: 'contactPhone', color: 'text-amber-300' },
  { icon: Mail, label: 'Electronic Mail', key: 'contactEmail', color: 'text-pink-300' },
  { icon: MapPin, label: 'Our Location', key: 'address', fallback: 'Accra, Ghana', color: 'text-teal-300' },
];

const SOCIAL_LINKS = (siteContent) => [
  {
    label: 'WhatsApp',
    href: `https://wa.me/${(siteContent?.contactPhone || '').replace(/[^0-9]/g, '')}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: siteContent?.instagramLink || 'https://instagram.com/kentehaul',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: siteContent?.tiktokLink || 'https://tiktok.com/@kentehaul',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
      </svg>
    ),
  },
];

export const Contact = ({ siteContent }) => (
  <div className="min-h-screen bg-[#f8f1e6]">
    <SEO
      title="Contact Us"
      description="Reach out to KenteHaul for custom orders, collaborations, and royal inquiries."
      canonicalPath="/contact"
    />

    {/* Header */}
    <div className="relative pt-32 pb-20 px-6 text-center overflow-hidden bg-[#f8f1e6]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-block py-2 px-6 rounded-full bg-white shadow-sm border border-[#efe2cf] text-[10px] font-black uppercase tracking-[4px] mb-6"
          style={{ color: siteContent?.secondaryColor || '#f97316' }}
        >
          {siteContent?.contactEyebrow || 'Connect With Royalty'}
        </motion.span>
        <h1
          className="text-5xl md:text-8xl font-black mb-6 uppercase tracking-tighter"
          style={{ color: siteContent?.primaryColor || '#5b0143' }}
        >
          {siteContent?.contactHeadline || 'Get in Touch'}
        </h1>
        <p className="text-[#5f554d] font-bold max-w-xl mx-auto uppercase tracking-widest text-[10px] sm:text-xs">
          {siteContent?.contactSubheadline || "Your journey into heritage begins with a single conversation. We'd love to hear your vision."}
        </p>
      </motion.div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-32">
      <div className="grid lg:grid-cols-12 gap-0 bg-white rounded-[40px] md:rounded-[60px] shadow-[0_40px_100px_rgba(33,27,23,0.10)] overflow-hidden border border-[#efe2cf]">

        {/* Info Column */}
        <div
          className="lg:col-span-5 text-white p-8 md:p-16 lg:p-20 flex flex-col justify-between relative overflow-hidden order-2 lg:order-1"
          style={{ backgroundColor: siteContent?.primaryColor || '#5b0143' }}
        >
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff8ed 0px, #fff8ed 2px, transparent 2px, transparent 14px)' }}
          />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white rounded-full opacity-10 blur-3xl" />
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: siteContent?.secondaryColor || '#f97316' }} />

          <div className="relative z-10 space-y-12 mb-16 lg:mb-0">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">Contact Details</h2>
              <p className="text-white/50 font-medium max-w-xs text-sm">Direct channels for urgent orders and royal support.</p>
            </motion.div>

            <div className="space-y-8">
              {CONTACT_ITEMS.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.12, duration: 0.7 }}
                  className="flex items-start gap-5 group"
                >
                  <div className={`w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 ${item.color}`}>
                    <item.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[3px] opacity-40 mb-1">{item.label}</p>
                    <p className="text-lg sm:text-xl font-black tracking-tight break-all">
                      {siteContent?.[item.key] || item.fallback || '—'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <p className="text-[10px] font-black uppercase tracking-[3px] opacity-40 mb-4">Find Us On</p>
              <div className="flex gap-3">
                {SOCIAL_LINKS(siteContent).map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all duration-300"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[2px] opacity-50">Ghana HQ · Available 8AM – 6PM</p>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-7 p-8 md:p-16 lg:p-20 order-1 lg:order-2"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2" style={{ color: siteContent?.primaryColor || '#5b0143' }}>
              Write to Us
            </h2>
            <p className="text-[#5f554d] font-bold uppercase text-[10px] tracking-widest">Expected response time: Under 24 hours.</p>
          </div>
          <ContactForm primaryColor={siteContent?.primaryColor} secondaryColor={siteContent?.secondaryColor} />
        </motion.div>
      </div>
    </div>
  </div>
);

export const NotFound = ({ siteContent }) => (
  <div className="min-h-[80vh] flex items-center justify-center px-6 text-center">
    <SEO
      title="Page Not Found"
      description="The page you're looking for doesn't exist on KenteHaul."
      canonicalPath="/404"
    />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-md"
    >
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: (siteContent?.primaryColor || '#5b0143') + '10', color: siteContent?.primaryColor || '#5b0143' }}>
        <Compass size={36} strokeWidth={2} />
      </div>
      <span className="inline-block py-2 px-6 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-[4px] mb-6 text-gray-400">
        404
      </span>
      <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter mb-4">Lost in the Archives</h1>
      <p className="text-gray-400 font-bold max-w-sm mx-auto mb-12">This path doesn't lead anywhere in the Royal Collection. The page may have moved or the link may be outdated.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/shop"
          className="px-10 py-5 rounded-[25px] font-black text-white uppercase tracking-widest text-xs shadow-lg hover:opacity-90 transition-all"
          style={{ backgroundColor: siteContent?.primaryColor || '#5b0143' }}
        >
          Return to Shop
        </Link>
        <Link
          to="/"
          className="px-10 py-5 rounded-[25px] font-black text-gray-500 border border-gray-200 uppercase tracking-widest text-xs hover:text-gray-900 transition-all"
        >
          Back Home
        </Link>
      </div>
    </motion.div>
  </div>
);
