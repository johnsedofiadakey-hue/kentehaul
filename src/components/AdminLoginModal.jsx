import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase';

export default function AdminLoginModal({
  isOpen,
  onClose,
  siteContent,
  setIsAdminAuthenticated
}) {
  const [loginMethod, setLoginMethod] = useState('pin'); // 'pin' or 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth listener in App.jsx will handle closing the modal via state
    } catch (err) {
      console.error("Login Error:", err);
      let errorMessage = "Login failed. Please try again.";
      switch (err.code) {
        case 'auth/invalid-credential': errorMessage = "Invalid email or password."; break;
        case 'auth/too-many-requests': errorMessage = "Too many attempts. try later."; break;
        default: errorMessage = err.message;
      }
      setError(errorMessage);
    }
    setLoading(false);
  };

  const handlePinLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (pin === siteContent.adminPin) {
      setIsAdminAuthenticated(true);
      onClose();
    } else {
      setError("Incorrect Master Security PIN");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
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
              style={{ color: siteContent.primaryColor }}
            >
              <Lock size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: siteContent.primaryColor }}>
              Admin Access
            </h2>
            <p className="text-gray-500 mb-6 text-sm">Security check for dashboard access</p>

            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => setLoginMethod('pin')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginMethod === 'pin' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                style={{ color: loginMethod === 'pin' ? siteContent.primaryColor : undefined }}
              >
                PIN LOGIN
              </button>
              <button
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginMethod === 'email' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                style={{ color: loginMethod === 'email' ? siteContent.primaryColor : undefined }}
              >
                SECURE EMAIL
              </button>
            </div>

            <form onSubmit={loginMethod === 'pin' ? handlePinLogin : handleEmailLogin} className="space-y-4 text-left">
              {loginMethod === 'pin' ? (
                <div className="relative">
                  <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition text-center font-black tracking-[10px] text-lg"
                    placeholder="••••••"
                  />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition"
                      placeholder="admin@kentehaul.com"
                    />
                  </div>
                  <div className="relative">
                    <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition"
                      placeholder="Password"
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition flex justify-center items-center mt-4"
                style={{ backgroundColor: siteContent.primaryColor }}
              >
                {loading ? <span className="animate-pulse">Verifying...</span> : (loginMethod === 'pin' ? "Unlock Dashboard" : "Sign In")}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}