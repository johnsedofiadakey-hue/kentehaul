import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Smartphone } from 'lucide-react';
import { TikTokIcon } from './UIComponents';
import { SOCIAL_LINKS } from '../data/constants';

export default function Footer({ siteContent, setIsTrackingOpen, onAdminClick }) {
  return (
    <footer className="text-white py-16 border-t border-white/10 mt-auto pb-28 md:pb-16" style={{ backgroundColor: siteContent?.primaryColor }}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-16 text-sm">

        {/* Brand Column */}
        <div className="col-span-2 md:col-span-1 border-b md:border-none pb-8 md:pb-0">
          <Link to="/" className="flex items-center gap-2 mb-6 group">
            {siteContent?.logo ? (
              <img src={siteContent?.logo} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: siteContent?.secondaryColor }}
                >K</div>
                <span className="text-2xl font-bold text-white">KenteHaul</span>
              </>
            )}
          </Link>
          <p className="text-xs text-white/40 leading-relaxed font-medium">
            Moving heritage forward by connecting modern style with centuries of African excellence.
          </p>
        </div>

        {/* Explore Column */}
        <div>
          <h4 className="text-white font-black text-xs uppercase tracking-[3px] mb-6 opacity-40">Explore</h4>
          <ul className="space-y-3">
            <li><Link to="/heritage" className="hover:opacity-80 transition block font-bold">Kente History</Link></li>
            <li><Link to="/shop" className="hover:opacity-80 transition block font-bold">Shop Products</Link></li>
            <li><Link to="/institute" className="hover:opacity-80 transition block font-bold">Kente Haul Institute</Link></li>
            <li><a href="/institute#partner" className="hover:opacity-80 transition block font-bold">Partner With Us</a></li>
          </ul>
        </div>

        {/* Help Column */}
        <div>
          <h4 className="text-white font-black text-xs uppercase tracking-[3px] mb-6 opacity-40">Help</h4>
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => setIsTrackingOpen && setIsTrackingOpen(true)}
                className="hover:opacity-80 transition font-bold text-left text-white"
              >
                Track My Order
              </button>
            </li>
            <li>
              <a href={`https://wa.me/${(siteContent?.contactPhone || '233540249684').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:opacity-80 transition block font-bold">
                Contact Us
              </a>
            </li>
            <li><Link to="/refund-policy" className="hover:opacity-80 transition block font-bold">Returns & Refunds</Link></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div>
          <h4 className="text-white font-black text-xs uppercase tracking-[3px] mb-6 opacity-40">Legal</h4>
          <ul className="space-y-3">
            <li><Link to="/privacy" className="hover:opacity-80 transition block font-bold">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:opacity-80 transition block font-bold">Terms of Service</Link></li>
            <li><Link to="/refund-policy" className="hover:opacity-80 transition block font-bold">Refund Policy</Link></li>
            <li>
              <button onClick={onAdminClick} className="hover:opacity-80 transition font-bold text-white/40 text-xs text-left">
                Manager Access
              </button>
            </li>
          </ul>
        </div>

        {/* Connect Column */}
        <div>
          <h4 className="text-white font-black text-xs uppercase tracking-[3px] mb-6 opacity-40">Connect</h4>
          <div className="flex flex-col gap-4">
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-80 transition font-bold">
              <Instagram size={16} /> Instagram
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-80 transition font-bold">
              <TikTokIcon size={16} /> TikTok
            </a>
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-80 transition font-bold">
              <Smartphone size={16} /> WhatsApp
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-white/30 text-xs">© {new Date().getFullYear()} KenteHaul. All rights reserved.</p>
        <p className="text-white/20 text-xs">Made with ♥ in Ghana</p>
      </div>
    </footer>
  );
}
