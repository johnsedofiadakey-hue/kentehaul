import React, { useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ImageUpload, useToast, Toast } from '../UIComponents';

export default function AdminTestimonials({ feedbacks, siteContent }) {
    const [loading, setLoading] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({ name: '', text: '', rating: 5, image: '' });
    const [toast, showToast, dismissToast] = useToast();

    const addFeedback = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "feedbacks"), { ...feedbackForm, date: Date.now() });
            setFeedbackForm({ name: '', text: '', rating: 5, image: '' });
            showToast("Client story posted!");
        } catch (e) {
            showToast("Feedback error.", "error");
        }
        setLoading(false);
    };

    const deleteFeedback = async (id) => {
        if (!window.confirm("Remove this feedback?")) return;
        try {
            await deleteDoc(doc(db, "feedbacks", id));
            showToast("Feedback removed.");
        } catch (e) { showToast("Error deleting feedback.", "error"); }
    };

    return (
        <div className="max-w-2xl animate-fade-in-up">
            <Toast toast={toast} onDone={dismissToast} />
            <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-xl border border-gray-50">
                <h3 className="font-black text-2xl mb-2 flex items-center gap-3 text-gray-800"><MessageCircle size={24} className="text-teal-500" /> Client Stories</h3>
                <p className="text-sm text-gray-400 font-bold mb-8">Testimonials shown in the "Love from our Clients" section on the homepage.</p>
                <form onSubmit={addFeedback} className="space-y-4">
                    <input required placeholder="Client Name" className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold" value={feedbackForm.name} onChange={e => setFeedbackForm({ ...feedbackForm, name: e.target.value })} />
                    <textarea required placeholder="Their testimonial..." className="w-full p-4 bg-gray-50 border-none rounded-2xl h-24 font-medium" value={feedbackForm.text} onChange={e => setFeedbackForm({ ...feedbackForm, text: e.target.value })} />
                    <ImageUpload image={feedbackForm.image} onUpload={img => setFeedbackForm({ ...feedbackForm, image: img })} label="Optional Client Photo" height="h-24" primaryColor={siteContent?.primaryColor} />
                    <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white py-4 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-teal-700 transition-all disabled:opacity-40">
                        {loading ? 'Posting...' : 'Post Feedback'}
                    </button>
                </form>
                <div className="mt-8 space-y-3 max-h-[28rem] overflow-y-auto custom-scrollbar pr-2">
                    {feedbacks.map(f => (
                        <div key={f.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                {f.image ? (
                                    <img src={f.image} className="w-8 h-8 rounded-full object-cover" alt="cli" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-black text-xs">{f.name?.[0]}</div>
                                )}
                                <span className="font-black text-gray-700 truncate w-32">{f.name}</span>
                            </div>
                            <button onClick={() => deleteFeedback(f.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    {feedbacks.length === 0 && <p className="text-sm text-gray-400 font-bold text-center py-6">No client stories yet.</p>}
                </div>
            </div>
        </div>
    );
}
