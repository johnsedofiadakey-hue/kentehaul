import React, { useState } from 'react';
import { Lock, Mail, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminLoginModal({
  isOpen,
  onClose,
  siteContent
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
      // Auth state listener in App.jsx will handle closing the modal
    } catch (err) {
      console.error("Login Error:", err);

      // Provide specific error messages based on Firebase error codes
      let errorMessage = "Login failed. Please try again.";

      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = "Invalid email format.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
        case 'auth/user-not-found':
          errorMessage = "No account found with this email.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Login Box */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full relative z-10 text-center border border-gray-100"
          >
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-gray-100"
              style={{ color: siteContent.primaryColor }}
            >
              <Lock size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: siteContent.primaryColor }}>
              Admin Access
            </h2>
            <p className="text-gray-500 mb-6 text-sm">Sign in to manage your store</p>

            <form onSubmit={handleLogin} className="space-y-4 text-left" autoComplete="off">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition"
                  placeholder="Email Address"
                />
              </div>

              <div className="relative">
                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition"
                  placeholder="Password"
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition flex justify-center items-center mt-4"
                style={{ backgroundColor: siteContent.primaryColor }}
              >
                {loading ? <span className="animate-pulse">Verifying...</span> : "Unlock Dashboard"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}