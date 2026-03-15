import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Smartphone } from 'lucide-react';
import { TikTokIcon } from './UIComponents'; // Importing from our UI file
import { SOCIAL_LINKS } from '../data/constants'; // Importing from constants

export default function Footer({ siteContent, onNavClick, onAdminClick }) {
  return (
    <footer className="text-white py-16 border-t border-white/10 mt-auto" style={{ backgroundColor: siteContent.primaryColor }}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-20 text-sm">

        {/* Brand Column */}
        <div className="col-span-2 md:col-span-1 border-b md:border-none pb-8 md:pb-0">
          <Link to="/" className="flex items-center gap-2 mb-6 group">
            {siteContent.logo ? (
              <img src={siteContent.logo} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: siteContent.secondaryColor }}
                >K</div>
                <span className="text-2xl font-bold text-white">KenteHaul</span>
              </>
            )}
          </Link>
        </div>

        {/* Explore Column */}
        <div>
          <h4 className="text-white font-bold text-lg mb-6">Explore</h4>
          <ul className="space-y-3">
            <li><Link to="/heritage" className="hover:opacity-80 transition block">Our Story</Link></li>
            <li><Link to="/shop" className="hover:opacity-80 transition block">Shop Products</Link></li>
            <li><Link to="/institute" className="hover:opacity-80 transition block">Kente Stories</Link></li>
            <li><a href="/institute#partner" className="hover:opacity-80 transition block">Partner With Us</a></li>
            {/* Admin Link Moved Here */}
            <li><button className="hover:opacity-100 cursor-pointer transition text-white/20 hover:text-white text-[10px] uppercase tracking-widest mt-4" onClick={onAdminClick}>Manager Access</button></li>
          </ul>
        </div>

        {/* Connect Column */}
        <div>
          <h4 className="text-white font-bold text-lg mb-6">Connect</h4>
          <div className="flex gap-4">
            {(siteContent.instagramLink || SOCIAL_LINKS.instagram) && (
              <a href={siteContent.instagramLink || SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition cursor-pointer">
                <Instagram size={20} />
              </a>
            )}
            {SOCIAL_LINKS.tiktok && (
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition cursor-pointer">
                <TikTokIcon size={20} />
              </a>
            )}
            {(siteContent.contactPhone || SOCIAL_LINKS.whatsapp) && (
              <a href={`https://wa.me/${(siteContent.contactPhone || SOCIAL_LINKS.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition cursor-pointer">
                <Smartphone size={20} />
              </a>
            )}
            {siteContent.facebookLink && (
              <a href={siteContent.facebookLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition cursor-pointer">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center opacity-60">
        &copy; {siteContent.footerText || "2026 KenteHaul Ghana"}. Designed with pride.
      </div>
    </footer>
  );
}