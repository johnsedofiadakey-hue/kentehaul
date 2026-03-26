import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, MessageCircle, Star, Quote, Phone, Mail, MapPin, ShoppingBag, X, ChevronLeft, ChevronRight, ZoomIn, ArrowRight, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { LazyImage } from './UIComponents';
import PhoneInput from './PhoneInput';
import SEO from './SEO';

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

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-2 gap-4">
        <input 
          type="text" 
          placeholder="First Name" 
          className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200" 
          value={formData.firstName}
          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
        />
        <input 
          type="text" 
          placeholder="Last Name" 
          className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200" 
          value={formData.lastName}
          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
        />
      </div>
      <input 
        type="email" 
        placeholder="Email Address" 
        className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200" 
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
      />
      
      <PhoneInput 
        placeholder="Phone Number for Inquiry"
        value={formData.phone}
        onChange={val => setFormData({ ...formData, phone: val })}
        primaryColor={primaryColor}
      />

      <textarea 
        placeholder="How can we help?" 
        className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200 h-32 resize-none"
        value={formData.message}
        onChange={e => setFormData({ ...formData, message: e.target.value })}
      ></textarea>
      
      <button
        className="w-full text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[4px] hover:opacity-90 transition shadow-lg active:scale-95"
        style={{ backgroundColor: secondaryColor }}
      >
        Send Message
      </button>
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
          <PhoneInput value={form.phone} onChange={val => setForm({...form, phone: val})} primaryColor={siteContent.primaryColor} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Why Partner With Us? / Vision</label>
        <textarea required placeholder="Tell us about your proposed collaboration..." className="w-full p-5 bg-white border border-gray-100 rounded-3xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500/20 h-40 resize-none" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full py-6 text-white rounded-3xl font-black text-xs uppercase tracking-[5px] shadow-2xl transition hover:shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3" style={{ backgroundColor: siteContent.primaryColor }}>
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
              {siteContent.partnerCTA || "Partner With Us Now"} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </span>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} style={{ backgroundColor: siteContent.secondaryColor }}></div>
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

// --- HOME PAGE COMPONENT ---
export const Home = ({ siteContent, gallery, feedbacks }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="animate-fade-in">
      <SEO 
        title={siteContent.heroTitle || "Home"}
        description={siteContent.heroSubtitle || "Discover the finest hand-woven Kente cloth from the heart of Ghana."}
        ogTitle={`${siteContent.heroTitle || "KenteHaul"} | Royal Kente Cloth`}
        ogDescription="Shop authentic, high-quality Ghanaian Kente cloth. We deliver heritage to your doorstep."
        canonicalPath="/"
      />
      {/* HERO SECTION */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" style={{ backgroundColor: siteContent.primaryColor }}>
        {siteContent.heroImage ? (
          <div className="absolute inset-0 z-0">
            <LazyImage src={siteContent.heroImage} className="w-full h-full object-cover opacity-60" alt="Hero" />
            <div className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent" style={{ '--tw-gradient-from': siteContent.primaryColor, '--tw-gradient-to': 'transparent' }}></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        )}

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full mix-blend-overlay filter blur-[120px] opacity-20 animate-blob pointer-events-none"></div>
        <div className="absolute bottom-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full mix-blend-overlay filter blur-[150px] opacity-20 animate-blob animation-delay-2000 pointer-events-none" style={{ backgroundColor: siteContent.secondaryColor }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full filter blur-[200px] animate-blob animation-delay-4000 pointer-events-none"></div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12 sm:mb-20 lg:mb-24 -mt-24 sm:-mt-32 lg:mt-0"
          >
            <span
              className="inline-block py-2 px-6 rounded-full text-white font-black text-[10px] sm:text-xs tracking-[5px] uppercase border border-white/20 backdrop-blur-xl shadow-2xl"
              style={{ backgroundColor: `${siteContent.secondaryColor}30` }}
            >
              The Royal Standard
            </span>
          </motion.div>
          <motion.h1
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-9xl font-black text-white mb-8 leading-[0.9] tracking-tighter drop-shadow-2xl uppercase"
          >
            {siteContent.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-3xl text-white/80 mb-14 leading-tight font-black uppercase tracking-tight max-w-3xl mx-auto"
          >
            {siteContent.heroSubtitle}
          </motion.p>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-5 justify-center mt-10"
          >
            <Link
              to="/shop"
              className="shimmer-premium group text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[4px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all transform hover:-translate-y-2 inline-flex items-center justify-center relative overflow-hidden active:scale-95"
              style={{ backgroundColor: siteContent.secondaryColor }}
            >
              <span className="relative z-10 flex items-center gap-2">Our Shop <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
            </Link>
            <Link to="/heritage" className="bg-white/5 backdrop-blur-2xl text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[4px] hover:bg-white/10 transition-all transform hover:-translate-y-2 inline-flex items-center justify-center active:scale-95 shadow-xl">
              Our Legacy
            </Link>
          </motion.div>
        </div>
      </div>

      {/* GALLERY SECTION */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-1 bg-amber-500 mb-6 rounded-full"></div>
              <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter" style={{ color: siteContent.primaryColor }}>
                {siteContent.galleryTitle || "Lifestyle Gallery"}
              </h2>
              <p className="text-gray-400 font-bold max-w-xl mx-auto uppercase tracking-widest text-xs">Curated moments of cultural excellence and royal style.</p>
            </motion.div>
          </div>

          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
              {gallery.map((item, index) => (
                <div key={item.id} className={`rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300 relative group ${index % 3 === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                  <LazyImage src={item.image} alt="Gallery" className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                  <div
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center cursor-zoom-in p-6"
                    onClick={() => setSelectedImage(item.image)}
                  >
                    <ZoomIn className="text-white mb-2" size={32} />
                    <span className="text-white font-black text-[10px] uppercase tracking-[3px]">View Details</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed" style={{ borderColor: `${siteContent.primaryColor}40`, color: `${siteContent.primaryColor}80` }}>
              <p className="font-medium">Gallery images coming soon! Add them in Admin.</p>
            </div>
          )}
        </div>
      </div>

      {/* HERITAGE SUMMARY SECTION */}
      <div className="py-24 bg-gray-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
              <LazyImage
                src={siteContent.heroImage || "https://images.unsplash.com/photo-1523464862212-d6631d073194?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                className="w-full h-full object-cover"
                alt="Heritage"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: siteContent.secondaryColor }}></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-amber-500 font-black text-xs uppercase tracking-[5px] mb-4 block">Our Legacy</span>
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tighter uppercase" style={{ color: siteContent.primaryColor }}>
              {siteContent.heritageHomeTitle || "A Story in Every Thread"}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-10 font-medium">
              {siteContent.heritageSummary || "Connecting the world to the royal heritage of Ghana. Authentic, handwoven, and timeless. Each piece in our collection is a testament to the skill of master weavers and the endurance of our traditions."}
            </p>
            <Link
              to="/heritage"
              className="inline-flex items-center gap-3 font-black text-xs uppercase tracking-[3px] hover:gap-5 transition-all"
              style={{ color: siteContent.primaryColor }}
            >
              Read full heritage <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* FEEDBACK SECTION */}
      <div className="py-20 text-white relative overflow-hidden" style={{ backgroundColor: siteContent.primaryColor }}>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-[100px] opacity-10"></div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
              <MessageCircle style={{ color: siteContent.secondaryColor }} /> {siteContent.testimonialsTitle || "Love from our Clients"}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {feedbacks.map(fb => (
              <div key={fb.id} className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition">
                <div className="flex gap-4 items-start">
                  {fb.image ? (
                    <img src={fb.image} alt={fb.name} className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: siteContent.secondaryColor }} />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: siteContent.secondaryColor }}>
                      {fb.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex mb-2" style={{ color: siteContent.secondaryColor }}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < fb.rating ? "currentColor" : "none"} className={i < fb.rating ? "" : "text-gray-500"} />)}
                    </div>
                    <p className="text-white/90 italic mb-4">"{fb.text}"</p>
                    <h4 className="font-bold text-white">— {fb.name}</h4>
                  </div>
                </div>
              </div>
            ))}
            {feedbacks.length === 0 && <p className="text-center text-white/50 w-full col-span-2">No feedback yet.</p>}
          </div>
        </div>
      </div>
      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              alt="Zoomed"
            />

            <div className="absolute bottom-10 left-0 right-0 text-center">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[4px]">KenteHaul Royal Archives</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- HERITAGE PAGE COMPONENT ---
export const Heritage = ({ siteContent }) => (
  <div className="animate-fade-in bg-white min-h-screen">
    <SEO 
      title="Our Heritage & History"
      description="Learn about the centuries-old tradition of Kente weaving and the master artisans behind KenteHaul."
      ogTitle="The Legend of Kente | KenteHaul Heritage"
      ogDescription="Explore the meanings of colors and patterns in Ghanaian Kente cloth."
      canonicalPath="/heritage"
    />
    <div className="py-20 px-6 text-center text-white relative overflow-hidden" style={{ backgroundColor: siteContent.secondaryColor }}>
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <h1 className="text-5xl font-serif font-bold relative z-10">{siteContent.heritageTitle}</h1>
    </div>
    <div className="max-w-3xl mx-auto py-16 px-6">
      <div className="prose prose-lg mx-auto text-gray-700 leading-loose first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left">
        {siteContent.heritageText ? (
          <FormattedText text={siteContent.heritageText} />
        ) : (
          <p className="text-gray-400 italic">Heritage story coming soon...</p>
        )}
      </div>
      <div className="mt-12 flex justify-center">
        <Link
          to="/shop"
          className="text-white px-8 py-4 rounded-full font-bold shadow-xl hover:opacity-90 transition inline-flex items-center justify-center"
          style={{ backgroundColor: siteContent.primaryColor }}
        >
          Own a Piece of History
        </Link>
      </div>
    </div>
  </div>
);

// --- INSTITUTE PAGE COMPONENT ---
export const Institute = ({ siteContent, products }) => (
  <div className="animate-fade-in bg-gray-50 min-h-screen">
    <SEO 
      title="KenteHaul Institute | Empowerment through Craft"
      description="Empowering local weavers and preserving Kente culture through our educational initiatives and partnerships."
      ogTitle="KenteHaul Institute | Preserving Royal Craft"
      canonicalPath="/institute"
    />
    <div className="text-white py-24 px-6 text-center rounded-b-[4rem] shadow-2xl relative overflow-hidden" style={{ backgroundColor: siteContent.primaryColor }}>
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
      <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 relative z-10">{siteContent.instituteTitle}</h1>
    </div>

    <div className="max-w-4xl mx-auto -mt-12 px-6 relative z-20">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl">
        <Quote className="w-16 h-16 mb-4 mx-auto" style={{ color: `${siteContent.secondaryColor}80` }} />
        <div className="text-lg md:text-xl text-gray-700 font-light">
          {siteContent.instituteText && <FormattedText text={siteContent.instituteText} centered={true} />}
        </div>
      </div>
    </div>

    <div id="partner" className="bg-white py-32 px-6 md:py-48 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-amber-500 font-black text-xs uppercase tracking-[6px] mb-6 block"
          >
            {siteContent.partnerTag || "Collaborate"}
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black mb-10 uppercase tracking-tighter leading-[0.9] text-gray-900"
          >
            {siteContent.partnerHeadline || (<>Building Together <br /> A Vision for Ghana's <br /> Royal Craft</>)}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 font-medium text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-16"
          >
            <FormattedText
              text={siteContent.partnerBody || "We welcome collaborations with institutions, cultural organizations, development partners, and individuals who share in this vision. Together, we can build a sustainable future for Kente weaving, empower young people and communities and keep the craft alive."}
              centered
            />
          </motion.div>
        </motion.div>

        <PartnerInvitation siteContent={siteContent} />
      </div>
    </div>
  </div>
);

// --- CONTACT PAGE COMPONENT ---
export const Contact = ({ siteContent }) => (
  <div className="max-w-7xl mx-auto py-20 px-6 animate-fade-in">
    <SEO 
      title="Contact Us"
      description="Reach out to KenteHaul for custom orders and inquiries."
      canonicalPath="/contact"
    />
    <div className="text-center mb-16">
      <h1 className="text-4xl font-bold mb-4" style={{ color: siteContent.primaryColor }}>Get in Touch</h1>
      <p className="text-gray-500">We'd love to hear from you. Visit us or send a message.</p>
    </div>

    <div className="grid md:grid-cols-2 gap-12 bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="text-white p-12 flex flex-col justify-center space-y-8 relative overflow-hidden" style={{ backgroundColor: siteContent.primaryColor }}>
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white rounded-full opacity-10 blur-3xl"></div>

        <div className="flex items-center gap-6 relative z-10">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center" style={{ color: siteContent.secondaryColor }}><Phone size={28} /></div>
          <div>
            <h3 className="font-bold text-lg opacity-80">Phone</h3>
            <p className="text-xl font-bold">{siteContent.contactPhone}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-pink-400"><Mail size={28} /></div>
          <div>
            <h3 className="font-bold text-lg opacity-80">Email</h3>
            <p className="text-xl font-bold">{siteContent.contactEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-teal-400"><MapPin size={28} /></div>
          <div>
            <h3 className="font-bold text-lg opacity-80">Location</h3>
            <p className="text-xl font-bold">{siteContent.address || "Accra, Ghana"}</p>
          </div>
        </div>
      </div>
      <div className="p-12">
        <ContactForm primaryColor={siteContent.primaryColor} secondaryColor={siteContent.secondaryColor} />
      </div>
    </div>
  </div>
);