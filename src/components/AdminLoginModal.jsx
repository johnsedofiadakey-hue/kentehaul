import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminLoginModal({
  isOpen,
  onClose,
  siteContent
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Set persistence based on "Remember me" checkbox
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      await signInWithEmailAndPassword(auth, email, password);
      // Redirection is now handled centrally in App.jsx to ensure persistence
      onClose();
    } catch (err) {
      console.error("Login Error:", err);
      let errorMessage = "Login failed. Please verify credentials and try again.";
      if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Access temporarily locked.";
      }
      setError(errorMessage);
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl max-w-sm w-full relative z-10 text-center border border-gray-100"
          >
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-gray-100 transition-colors"
              style={{ color: siteContent?.primaryColor || '#5b0143' }}
            >
              <Lock size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: siteContent?.primaryColor || '#5b0143' }}>
              Admin Access
            </h2>
            <p className="text-gray-500 mb-8 text-sm">Staff Only Access</p>

            <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition"
                  placeholder=" "
                />
                <label className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none transition-all">Email Address</label>
              </div>
              <style>{`
                input:focus + label, input:not(:placeholder-shown) + label {
                  transform: translateY(-2.2rem) translateX(-2.5rem);
                  font-size: 0.75rem;
                  color: ${siteContent?.primaryColor || '#5b0143'};
                  font-weight: 800;
                }
              `}</style>
              <div className="relative">
                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition"
                  placeholder=" "
                />
                <label className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none transition-all">Password</label>
              </div>

              <div className="flex items-center gap-3 px-1 py-1">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                  />
                </div>
                <label htmlFor="rememberMe" className="text-[11px] font-black text-gray-500 cursor-pointer uppercase tracking-wider select-none">
                  Remember me
                </label>
              </div>

              {error && (
                <p className="text-red-500 text-[10px] font-black text-center bg-red-50 py-2.5 rounded-xl border border-red-100 animate-pulse uppercase tracking-tight">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl hover:opacity-90 transform active:scale-95 transition-all mt-4"
                style={{ backgroundColor: siteContent?.primaryColor || '#5b0143' }}
              >
                {loading ? "Checking..." : "Log In Now"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}