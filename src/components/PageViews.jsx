import { Helmet } from 'react-helmet-async';

// --- HOME PAGE COMPONENT ---
export const Home = ({ siteContent, gallery, feedbacks }) => (
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

      <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000" style={{ backgroundColor: siteContent.secondaryColor }}></div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.span
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="inline-block py-1 px-3 rounded-full text-white/90 font-bold text-sm tracking-widest uppercase mb-6 border border-white/30 backdrop-blur-sm"
          style={{ backgroundColor: `${siteContent.secondaryColor}40` }}
        >
          Authentic & Royal
        </motion.span>
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg"
        >
          {siteContent.heroTitle}
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed font-light"
        >
          {siteContent.heroSubtitle}
        </motion.p>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/shop"
            className="text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition shadow-lg shadow-black/20 transform hover:-translate-y-1 inline-flex items-center justify-center"
            style={{ backgroundColor: siteContent.secondaryColor }}
          >
            Start Shopping
          </Link>
          <Link to="/heritage" className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition transform hover:-translate-y-1 inline-flex items-center justify-center">
            Our Heritage
          </Link>
        </motion.div>
      </div>
    </div>

    {/* GALLERY SECTION */}
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2" style={{ color: siteContent.primaryColor }}>
            <Camera style={{ color: siteContent.secondaryColor }} /> Our Style Gallery
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">See how our clients rock their KenteHaul outfits. Custom designs and happy moments.</p>
        </div>

        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
            {gallery.map((item, index) => (
              <div key={item.id} className={`rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300 relative group ${index % 3 === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                <LazyImage src={item.image} alt="Gallery" className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-6">
                  <span className="text-white font-bold">KenteHaul Exclusive</span>
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
  </div>
);

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
            <p className="text-xl font-bold">Accra, Ghana</p>
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