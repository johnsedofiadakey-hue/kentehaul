import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Upload, CreditCard, Loader2, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from '../firebase';

// --- LAZY LOADING IMAGE COMPONENT ---
export const LazyImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

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

// --- IMAGE UPLOAD COMPONENT ---
export const ImageUpload = ({ image, onUpload, label = "Upload Image", height = "h-32", primaryColor }) => {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setProgress(10); // Start progress

      // 1. Compress Image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      setProgress(30);

      // 2. Upload to Firebase Storage
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      const storageRef = ref(storage, `cms_images/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const p = 30 + (snapshot.bytesTransferred / snapshot.totalBytes) * 70;
          setProgress(p);
        },
        (error) => {
          console.error("Upload failed:", error);
          alert("Image upload failed. Please try again.");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onUpload(downloadURL);
          setUploading(false);
          setProgress(0);
        }
      );

    } catch (error) {
      console.error("Compression/Upload failed:", error);
      alert("Image processing failed.");
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <label
        className={`flex flex-col items-center justify-center w-full ${height} border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 bg-white overflow-hidden relative transition-colors`}
        style={{ borderColor: primaryColor ? `${primaryColor}40` : '#ccc' }}
      >
        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={uploading} />

        {uploading ? (
          <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="w-8 h-8 animate-spin mb-2" style={{ color: primaryColor }} />
            <div className="w-32 bg-gray-100 rounded-full h-1 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ backgroundColor: primaryColor, width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest mt-2" style={{ color: primaryColor }}>
              {progress < 30 ? "Compressing..." : `Uploading ${Math.round(progress)}%`}
            </span>
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
      
      {image && !uploading && (
        <button
          onClick={(e) => { e.preventDefault(); onUpload(''); }}
          className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

// --- TIKTOK ICON COMPONENT ---
export const TikTokIcon = ({ size = 24, color = "currentColor", className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-colors ${className}`}
  >
    <path
      d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"
      fill={color}
    />
  </svg>
);

// --- PAYSTACK BUTTON COMPONENT ---
export const PaystackButton = ({ amount, email, publicKey, onSuccess, onClose, primaryColor, secondaryColor }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  // useRef ensures the reference is stable and initialized before the hook config — avoids TDZ errors in minified builds
  const referenceRef = React.useRef(`KH-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`);
  const reference = referenceRef.current;

  const config = {
    reference,
    email: email || 'guest@kentehaul.com',
    amount: Math.round(amount * 100), // Paystack uses pesewas (1 GHS = 100 pesewas)
    publicKey: publicKey || 'pk_test_26140a2b5a94175d96518',
    currency: 'GHS',
  };

  const initializePayment = usePaystackPayment(config);

  const handleClick = () => {
    if (isLoading) return;
    setIsLoading(true);
    initializePayment(
      (ref) => {
        setIsLoading(false);
        onSuccess(ref);
      },
      () => {
        setIsLoading(false);
        if (onClose) onClose();
      }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full py-5 rounded-[24px] font-black text-white text-sm uppercase tracking-[2px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ background: `linear-gradient(135deg, ${primaryColor || '#4c1d95'}, ${secondaryColor || '#f97316'})` }}
    >
      {isLoading ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard size={20} />
          Pay with Card / MoMo
        </>
      )}
    </button>
  );
};