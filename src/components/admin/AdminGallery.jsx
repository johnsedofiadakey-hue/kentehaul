import React, { useState, useEffect } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ImageUpload, useToast, Toast } from '../UIComponents';

export default function AdminGallery({ gallery, siteContent }) {
    const [loading, setLoading] = useState(false);
    const [galleryImage, setGalleryImage] = useState('');
    const [galleryDescription, setGalleryDescription] = useState('');
    const [localGallery, setLocalGallery] = useState(gallery || []);
    const [toast, showToast, dismissToast] = useToast();

    useEffect(() => {
        setLocalGallery(gallery || []);
    }, [gallery]);

    const addGalleryImage = async () => {
        if (!galleryImage) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "gallery"), {
                image: galleryImage,
                description: galleryDescription,
                date: Date.now()
            });
            setGalleryImage('');
            setGalleryDescription('');
            showToast("Photo published to gallery!");
        } catch (e) {
            showToast("Gallery error.", "error");
        }
        setLoading(false);
    };

    const deleteGalleryImage = async (id) => {
        if (!window.confirm("Remove this image?")) return;
        try {
            await deleteDoc(doc(db, "gallery", id));
            setLocalGallery(prev => prev.filter(g => g.id !== id));
            showToast("Image removed.");
        } catch (e) { showToast("Error deleting image.", "error"); }
    };

    const handleUpdateGalleryDescription = (id, text) => {
        setLocalGallery(prev => prev.map(g => g.id === id ? { ...g, description: text } : g));
    };

    const handleSaveGalleryDescription = async (id, text) => {
        try {
            await updateDoc(doc(db, "gallery", id), { description: text });
        } catch (e) {
            console.error("Error saving description:", e);
        }
    };

    return (
        <div className="max-w-3xl animate-fade-in-up">
            <Toast toast={toast} onDone={dismissToast} />
            <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-xl border border-gray-50">
                <h3 className="font-black text-2xl mb-2 flex items-center gap-3 text-gray-800"><Camera size={24} className="text-blue-500" /> Brand Gallery</h3>
                <p className="text-sm text-gray-400 font-bold mb-8">Lifestyle photos shown on the homepage gallery.</p>
                <div className="space-y-6">
                    <ImageUpload image={galleryImage} onUpload={setGalleryImage} label="Select Professional Photo" primaryColor={siteContent?.primaryColor} />
                    <textarea
                        placeholder="Add a breathtaking description for this image..."
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-400/20 h-24 resize-none"
                        value={galleryDescription}
                        onChange={e => setGalleryDescription(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={addGalleryImage}
                        disabled={!galleryImage || loading}
                        className="w-full bg-gray-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                        <Camera size={18} /> {loading ? 'Publishing...' : 'Publish to Gallery'}
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {localGallery.map(g => (
                            <div key={g.id} className="space-y-2">
                                <div className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm">
                                    <img src={g.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="gal" />
                                    <button
                                        onClick={() => deleteGalleryImage(g.id)}
                                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-110"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <textarea
                                    placeholder="Add description..."
                                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-400/20 h-16 resize-none"
                                    value={g.description || ''}
                                    onChange={e => handleUpdateGalleryDescription(g.id, e.target.value)}
                                    onBlur={e => handleSaveGalleryDescription(g.id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
