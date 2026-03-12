import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Smartphone } from 'lucide-react';
import { TikTokIcon } from './UIComponents'; // Importing from our UI file
import { SOCIAL_LINKS } from '../data/constants'; // Importing from constants

export default function Footer({ siteContent, onNavClick, onAdminClick }) {
  return (
    <footer className="text-white py-16 border-t border-white/10 mt-auto" style={{ backgroundColor: siteContent.primaryColor }}>
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 text-sm">

        {/* Brand Column */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
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
          </div>
          <p className="max-w-xs leading-relaxed opacity-80">
            Connecting the world to the royal heritage of Ghana. Authentic, handwoven, and timeless.
          </p>
        </div>

        {/* Explore Column */}
        <div>
          <h4 className="text-white font-bold text-lg mb-6">Explore</h4>
          <ul className="space-y-3">
            <li><Link to="/heritage" className="hover:opacity-80 transition block">Our Heritage</Link></li>
            <li><Link to="/shop" className="hover:opacity-80 transition block">Shop Collections</Link></li>
            <li><Link to="/institute" className="hover:opacity-80 transition block">Kente History</Link></li>
            {/* Admin Link Moved Here */}
            <li><button className="hover:opacity-80 cursor-pointer transition text-white/50 hover:text-white" onClick={onAdminClick}>Admin Portal</button></li>
          </ul>
        </div>

        {/* Connect Column */}
        <div>
          <h4 className="text-white font-bold text-lg mb-6">Connect</h4>
          <div className="flex gap-4">
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition cursor-pointer">
              <Instagram size={20} />
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition cursor-pointer">
              <TikTokIcon size={20} />
            </a>
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition cursor-pointer">
              <Smartphone size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center opacity-60">
        &copy; 2024 KenteHaul Ghana. Designed with pride.
      </div>
    </footer>
  );
}