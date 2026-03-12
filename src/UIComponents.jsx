import React, { useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from './firebase'; // Connects to the firebase.js file we created

export const TikTokIcon = ({ size = 24, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="transition-colors"
  >
    <path
      d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"
      fill={color}
    />
  </svg>
);

// --- LAZY LOADING IMAGE COMPONENT ---
export const LazyImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className} bg-gray-100`}>
      {/* Placeholder / Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          <span className="sr-only">Loading...</span>
        </div>
      )}

      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        className={`
          ${className} 
          transition-opacity duration-700 ease-in-out
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
};

// --- IMAGE UPLOAD COMPONENT (Cloud Connected) ---
export const ImageUpload = ({ image, onUpload, label, height = "h-48", primaryColor = "black" }) => {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Create a unique address for this image in the cloud
      // We use Date.now() to ensure every filename is unique
      const storageRef = ref(storage, `images/${Date.now()}-${file.name}`);

      // 2. Upload the raw file
      const snapshot = await uploadBytes(storageRef, file);

      // 3. Get the public internet link (URL)
      const url = await getDownloadURL(snapshot.ref);

      // 4. Send this URL back to the form
      onUpload(url);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload image. Check your internet connection.");
    } finally {
      setUploading(false);
    }
  };

  // If an image already exists, show it with a delete button
  if (image) {
    return (
      <div className={`relative w-full ${height} rounded-xl overflow-hidden group border-2 border-gray-100`}>
        <img src={image} alt="Upload" className="w-full h-full object-cover" />
        <button
          onClick={() => onUpload('')}
          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // Otherwise, show the upload box
  return (
    <label className={`
      flex flex-col items-center justify-center w-full ${height} 
      border-2 border-dashed border-gray-300 rounded-xl cursor-pointer 
      hover:bg-gray-50 transition-colors relative
    `}>
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
        {uploading ? (
          <>
            <Loader2 className="animate-spin mb-2" size={32} style={{ color: primaryColor }} />
            <p className="text-sm font-medium">Uploading to Cloud...</p>
          </>
        ) : (
          <>
            <Upload className="mb-2" size={32} />
            <p className="text-sm font-bold text-gray-500">{label}</p>
            <p className="text-xs text-gray-400">Click to browse</p>
          </>
        )}
      </div>
      <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={uploading} />
    </label>
  );
};

// --- PAYSTACK BUTTON WRAPPER ---
export const PaystackButtonWrapper = ({ amount, email, publicKey, onSuccess, onClose }) => {
  const componentProps = {
    email,
    amount: amount * 100, // Paystack expects amount in pesewas (multiply by 100)
    publicKey,
    text: "Pay Now",
    onSuccess,
    onClose,
  };

  return (
    <PaystackButton
      {...componentProps}
      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2"
    />
  );
};

// Export alias to maintain compatibility with other files
export { PaystackButtonWrapper as PaystackButton };