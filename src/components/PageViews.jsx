import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, MessageCircle, Star, Quote, Phone, Mail, MapPin, ShoppingBag, X, ChevronLeft, ChevronRight, ZoomIn, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const LazyImage = ({ src, alt, className }) => (
  <img src={src} alt={alt} className={className} loading="lazy" />
);

// --- HOME PAGE COMPONENT ---
export const Home = ({ siteContent, gallery, feedbacks }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="animate-fade-in">
      <Helmet>
        <title>{siteContent.heroTitle} | KenteHaul</title>
        <meta name="description" content={siteContent.heroSubtitle} />
      </Helmet>
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

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full mix-blend-overlay filter blur-[120px] opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full mix-blend-overlay filter blur-[150px] opacity-20 animate-blob animation-delay-2000" style={{ backgroundColor: siteContent.secondaryColor }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full filter blur-[200px] animate-blob animation-delay-4000"></div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="inline-block py-2 px-6 rounded-full text-white font-black text-[10px] sm:text-xs tracking-[5px] uppercase mb-8 border border-white/20 backdrop-blur-xl shadow-2xl"
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
              <span className="relative z-10 flex items-center gap-2">Start Exploring <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
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
                Lifestyle Gallery
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
              A Story in <br /> Every Thread
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
              <MessageCircle style={{ color: siteContent.secondaryColor }} /> Love from our Clients
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
    <Helmet>
      <title>Our Heritage | KenteHaul</title>
      <meta name="description" content="Discover the rich history and tradition behind every thread of KenteHaul." />
    </Helmet>
    <div className="py-20 px-6 text-center text-white relative overflow-hidden" style={{ backgroundColor: siteContent.secondaryColor }}>
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <h1 className="text-5xl font-serif font-bold relative z-10">{siteContent.heritageTitle}</h1>
    </div>
    <div className="max-w-3xl mx-auto py-16 px-6">
      <div className="prose prose-lg mx-auto text-gray-700 leading-loose first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left">
        <span style={{ color: siteContent.secondaryColor }} className="float-left text-5xl font-bold mr-2">{siteContent.heritageText.charAt(0)}</span>
        {siteContent.heritageText.slice(1)}
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
    <Helmet>
      <title>Kente Institute | KenteHaul</title>
      <meta name="description" content="Educational resources and historical background on Ghanaian Kente tradition." />
    </Helmet>
    <div className="text-white py-24 px-6 text-center rounded-b-[4rem] shadow-2xl relative overflow-hidden" style={{ backgroundColor: siteContent.primaryColor }}>
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
      <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 relative z-10">{siteContent.instituteTitle}</h1>
    </div>

    <div className="max-w-4xl mx-auto -mt-12 px-6 relative z-20">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl">
        <Quote className="w-16 h-16 mb-4 mx-auto" style={{ color: `${siteContent.secondaryColor}80` }} />
        <p className="text-lg md:text-xl text-gray-700 leading-loose text-center font-light">
          {siteContent.instituteText}
        </p>
      </div>
    </div>

    <div className="max-w-6xl mx-auto py-20 px-6">
      <h3 className="text-3xl font-bold text-center mb-12" style={{ color: siteContent.primaryColor }}>Educational Artifacts</h3>
      <div className="grid md:grid-cols-2 gap-8">
        {products.filter(p => p.longHistory).map(p => (
          <div key={p.id} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-xl transition">
            {p.image && <LazyImage src={p.image} className="w-full md:w-40 h-40 object-cover rounded-2xl" alt="thumb" />}
            <div>
              <h4 className="font-bold text-xl mb-2" style={{ color: siteContent.primaryColor }}>{p.name}</h4>
              <div className="w-12 h-1 rounded-full mb-3" style={{ backgroundColor: siteContent.secondaryColor }}></div>
              <p className="text-gray-600 leading-relaxed text-sm">{p.longHistory}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- CONTACT PAGE COMPONENT ---
export const Contact = ({ siteContent }) => (
  <div className="max-w-7xl mx-auto py-20 px-6 animate-fade-in">
    <Helmet>
      <title>Contact Us | KenteHaul</title>
      <meta name="description" content="Reach out to KenteHaul for custom orders and inquiries." />
    </Helmet>
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
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200" />
            <input type="text" placeholder="Last Name" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200" />
          </div>
          <input type="email" placeholder="Email Address" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200" />
          <textarea placeholder="How can we help?" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200 h-32"></textarea>
          <button
            className="w-full text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg"
            style={{ backgroundColor: siteContent.secondaryColor }}
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  </div>
);