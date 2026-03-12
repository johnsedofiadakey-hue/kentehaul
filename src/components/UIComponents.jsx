import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Upload, CreditCard, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../firebase';

// --- IMAGE UPLOAD COMPONENT ---
export const ImageUpload = ({ image, onUpload, label = "Upload Image", height = "h-32", primaryColor }) => {
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      // 1. Compress Image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);

      // 2. Upload to Firebase Storage
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(snapshot.ref);

      onUpload(url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <label
      className={`flex flex-col items-center justify-center w-full ${height} border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 bg-white overflow-hidden relative transition-colors`}
      style={{ borderColor: primaryColor ? `${primaryColor}40` : '#ccc' }}
    >
      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={uploading} />

      {uploading ? (
        <div className="flex flex-col items-center text-gray-400">
          <Loader2 className="w-8 h-8 mb-2 animate-spin" style={{ color: primaryColor }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Compressing & Uploading...</span>
        </div>
      ) : image ? (
        <img src={image} alt="Preview" className="h-full w-full object-contain" />
      ) : (
        <div className="flex flex-col items-center text-gray-400">
          <Upload className="w-8 h-8 mb-2" style={{ color: primaryColor }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>{label}</span>
        </div>
      )}
    </label>
  );
};

// --- TIKTOK ICON COMPONENT ---
export const TikTokIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

// --- PAYSTACK BUTTON COMPONENT ---
export const PaystackButton = ({ amount, email, publicKey, onSuccess, onClose }) => {
  const config = { reference: (new Date()).getTime().toString(), email, amount: amount * 100, publicKey };
  const initializePayment = usePaystackPayment(config);

  return (
    <button
      onClick={() => initializePayment(onSuccess, onClose)}
      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
    >
      <CreditCard size={20} /> Pay with MoMo / Card
    </button>
  );
};