import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Upload, CreditCard, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from '../firebase';

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