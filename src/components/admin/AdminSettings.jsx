import React, { useState, useCallback } from 'react';
import { FileText, Palette, Sliders, CheckCircle, RefreshCw, Eye, Save } from 'lucide-react';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { ImageUpload } from '../UIComponents';

export default function AdminSettings({ siteContent, setSiteContent }) {
    const [saving, setSaving] = useState({});
    const [saved, setSaved] = useState({});

    // INSTANT UPDATE: updates local state immediately (public site sees it live via Firestore listener)
    // then persists to Firestore with full siteContent merge
    const updateField = useCallback((field, value) => {
        setSiteContent(prev => ({ ...prev, [field]: value }));
    }, [setSiteContent]);

    // SAVE TO FIRESTORE: called on blur or explicit save
    const saveField = useCallback(async (field, value, currentContent) => {
        setSaving(prev => ({ ...prev, [field]: true }));
        try {
            const merged = { ...currentContent, [field]: value };
            await setDoc(doc(db, "settings", "siteContent"), merged);
            setSaved(prev => ({ ...prev, [field]: true }));
            setTimeout(() => setSaved(prev => ({ ...prev, [field]: false })), 2500);
        } catch (e) {
            console.error("Settings sync failed:", e);
        }
        setSaving(prev => ({ ...prev, [field]: false }));
    }, []);

    // For color pickers: save on every change (real-time preview + sync)
    const handleColorChange = useCallback(async (field, value) => {
        updateField(field, value);
        // Debounce color saves to avoid hammering Firestore
        clearTimeout(window[`colorTimer_${field}`]);
        window[`colorTimer_${field}`] = setTimeout(async () => {
            setSaving(prev => ({ ...prev, [field]: true }));
            try {
                const merged = { ...siteContent, [field]: value };
                await setDoc(doc(db, "settings", "siteContent"), merged);
                setSaved(prev => ({ ...prev, [field]: true }));
                setTimeout(() => setSaved(prev => ({ ...prev, [field]: false })), 2000);
            } catch (e) { console.error(e); }
            setSaving(prev => ({ ...prev, [field]: false }));
        }, 400);
    }, [siteContent, updateField]);

    // For images: save immediately on upload
    const handleImageUpload = useCallback(async (field, value) => {
        updateField(field, value);
        setSaving(prev => ({ ...prev, [field]: true }));
        try {
            const merged = { ...siteContent, [field]: value };
            await setDoc(doc(db, "settings", "siteContent"), merged);
            setSaved(prev => ({ ...prev, [field]: true }));
            setTimeout(() => setSaved(prev => ({ ...prev, [field]: false })), 2500);
        } catch (e) { console.error(e); }
        setSaving(prev => ({ ...prev, [field]: false }));
    }, [siteContent, updateField]);

    const SaveIndicator = ({ field }) => (
        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black">
            {saving[field] && <RefreshCw size={10} className="animate-spin text-blue-500" />}
            {saved[field] && !saving[field] && <><CheckCircle size={10} className="text-green-500" /> <span className="text-green-500">Saved & Live</span></>}
        </span>
    );

    // Live preview swatch
    const ColorPreview = ({ color, label }) => (
        <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-2xl">
            <div className="w-8 h-8 rounded-xl shadow-md border border-white" style={{ backgroundColor: color }} />
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-xs font-mono font-bold text-gray-600">{color}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-600 font-black">
                <Eye size={10} /> Live Preview
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up">

            {/* 🎨 BRANDING — shown first since it's most used */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <h3 className="font-black text-sm mb-8 flex items-center gap-4 text-gray-900 uppercase tracking-widest">
                    <Palette className="text-purple-400" size={20} /> Store Colors
                    <span className="ml-auto text-[10px] text-green-600 font-black flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                        <Eye size={10} /> Changes appear live on your site
                    </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Primary Brand Color</label>
                            <SaveIndicator field="primaryColor" />
                        </div>
                        <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-[25px] mt-2">
                            <input
                                type="color"
                                className="h-16 w-16 rounded-2xl cursor-pointer border-none bg-transparent"
                                value={siteContent.primaryColor}
                                onChange={e => handleColorChange('primaryColor', e.target.value)}
                            />
                            <div>
                                <p className="font-black text-gray-400 font-mono tracking-widest">{siteContent.primaryColor}</p>
                                <p className="text-[10px] text-gray-400 mt-1">Navbar, buttons, headings</p>
                            </div>
                        </div>
                        <ColorPreview color={siteContent.primaryColor} label="Primary — Used on navbar, hero, CTA buttons" />
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Secondary / Accent Color</label>
                            <SaveIndicator field="secondaryColor" />
                        </div>
                        <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-[25px] mt-2">
                            <input
                                type="color"
                                className="h-16 w-16 rounded-2xl cursor-pointer border-none bg-transparent"
                                value={siteContent.secondaryColor}
                                onChange={e => handleColorChange('secondaryColor', e.target.value)}
                            />
                            <div>
                                <p className="font-black text-gray-400 font-mono tracking-widest">{siteContent.secondaryColor}</p>
                                <p className="text-[10px] text-gray-400 mt-1">Prices, badges, accents</p>
                            </div>
                        </div>
                        <ColorPreview color={siteContent.secondaryColor} label="Accent — Prices, badges, highlights" />
                    </div>
                </div>

                {/* Live mini-preview of how they look together */}
                <div className="mt-8 p-6 rounded-3xl border border-gray-100" style={{ backgroundColor: siteContent.primaryColor + '10' }}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Live Combination Preview</p>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="px-5 py-2.5 rounded-full text-white font-bold text-sm" style={{ backgroundColor: siteContent.primaryColor }}>
                            Shop Now
                        </div>
                        <div className="px-5 py-2.5 rounded-full text-white font-bold text-sm" style={{ backgroundColor: siteContent.secondaryColor }}>
                            ₵150
                        </div>
                        <div className="h-1 w-16 rounded-full" style={{ backgroundColor: siteContent.secondaryColor }} />
                        <span className="font-black text-lg" style={{ color: siteContent.primaryColor }}>KenteHaul</span>
                    </div>
                </div>
            </div>

            {/* 🖼️ HERO + LOGO */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <h3 className="font-black text-sm mb-8 flex items-center gap-4 text-gray-900 uppercase tracking-widest">
                    <Sliders className="text-blue-400" size={20} /> Store Photos & Text
                </h3>

                {/* Logo */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Store Logo</label>
                        <SaveIndicator field="logo" />
                    </div>
                    <ImageUpload
                        image={siteContent.logo}
                        onUpload={img => handleImageUpload('logo', img)}
                        label="Upload PNG or SVG Logo"
                        height="h-32"
                        primaryColor={siteContent.primaryColor}
                    />
                    <p className="text-[10px] text-gray-400 mt-2">Appears in the navbar and footer. Transparent PNG or SVG works best.</p>
                </div>

                {/* Hero Image */}
                <div className="border-t border-gray-100 pt-8 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Hero Background Image</label>
                        <SaveIndicator field="heroImage" />
                    </div>
                    <ImageUpload
                        image={siteContent.heroImage}
                        onUpload={img => handleImageUpload('heroImage', img)}
                        label="Upload Hero / Cover Photo"
                        height="h-56"
                        primaryColor={siteContent.primaryColor}
                    />
                    <p className="text-[10px] text-gray-400 mt-2">Wide landscape image. Min 1200×600px recommended.</p>
                </div>

                {/* Hero Text */}
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hero Headline</label>
                            <SaveIndicator field="heroTitle" />
                        </div>
                        <input
                            className="w-full p-5 bg-gray-50 border-none rounded-[25px] font-black text-lg outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="e.g. Weave Your Story"
                            value={siteContent.heroTitle || ''}
                            onChange={e => updateField('heroTitle', e.target.value)}
                            onBlur={e => saveField('heroTitle', e.target.value, siteContent)}
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hero Subtext</label>
                            <SaveIndicator field="heroSubtitle" />
                        </div>
                        <input
                            className="w-full p-5 bg-gray-50 border-none rounded-[25px] font-bold text-gray-500 outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Subtitle shown below the headline"
                            value={siteContent.heroSubtitle || ''}
                            onChange={e => updateField('heroSubtitle', e.target.value)}
                            onBlur={e => saveField('heroSubtitle', e.target.value, siteContent)}
                        />
                    </div>
                </div>

                {/* Heritage Summary */}
                <div className="mt-8 border-t border-gray-100 pt-8">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Heritage Summary (Home Page)</label>
                        <SaveIndicator field="heritageSummary" />
                    </div>
                    <textarea
                        className="w-full p-6 bg-gray-50 border-none rounded-[30px] h-32 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="A short story about your brand for the home page..."
                        value={siteContent.heritageSummary || ''}
                        onChange={e => updateField('heritageSummary', e.target.value)}
                        onBlur={e => saveField('heritageSummary', e.target.value, siteContent)}
                    />
                </div>
            </div>

            {/* 📄 INVOICE CONFIG */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <h3 className="font-black text-sm mb-8 flex items-center gap-4 text-gray-900 uppercase tracking-widest">
                    <FileText className="text-gray-400" size={20} /> Bill & Footer Text
                </h3>
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Bank Details (shown on invoices)</label>
                            <SaveIndicator field="invoiceBankDetails" />
                        </div>
                        <textarea
                            className="w-full p-6 bg-gray-50 border-none rounded-[30px] h-32 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder={"Bank Name: GCB Bank\nAccount No: 1234567890\nBranch: Accra Main"}
                            value={siteContent.invoiceBankDetails || ''}
                            onChange={e => updateField('invoiceBankDetails', e.target.value)}
                            onBlur={e => saveField('invoiceBankDetails', e.target.value, siteContent)}
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Terms & Conditions (shown on invoices)</label>
                            <SaveIndicator field="invoiceTerms" />
                        </div>
                        <textarea
                            className="w-full p-6 bg-gray-50 border-none rounded-[30px] h-32 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder={"1. All payments cleared within 7 days.\n2. No returns on custom weave fabric."}
                            value={siteContent.invoiceTerms || ''}
                            onChange={e => updateField('invoiceTerms', e.target.value)}
                            onBlur={e => saveField('invoiceTerms', e.target.value, siteContent)}
                        />
                    </div>
                </div>
            </div>

            {/* ⚙️ SYSTEM CONFIG */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <h3 className="font-black text-sm mb-8 flex items-center gap-4 text-gray-900 uppercase tracking-widest">
                    <Save className="text-gray-400" size={20} /> Payments & Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paystack Public Key</label>
                            <SaveIndicator field="paystackPublicKey" />
                        </div>
                        <input
                            type="text"
                            className="w-full p-4 bg-blue-950 text-blue-200 rounded-[20px] font-mono text-xs outline-none"
                            value={siteContent.paystackPublicKey || ''}
                            onChange={e => updateField('paystackPublicKey', e.target.value)}
                            onBlur={e => saveField('paystackPublicKey', e.target.value, siteContent)}
                            placeholder="pk_live_xxxxxxxxx"
                        />
                        <p className="text-[10px] text-gray-400 mt-2">Use your live key for production payments.</p>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp / Contact Phone</label>
                            <SaveIndicator field="contactPhone" />
                        </div>
                        <input
                            type="text"
                            className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-bold outline-none focus:ring-2 focus:ring-blue-200"
                            value={siteContent.contactPhone || ''}
                            onChange={e => updateField('contactPhone', e.target.value)}
                            onBlur={e => saveField('contactPhone', e.target.value, siteContent)}
                            placeholder="+233 54 024 9684"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Email</label>
                            <SaveIndicator field="contactEmail" />
                        </div>
                        <input
                            type="email"
                            className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-bold outline-none focus:ring-2 focus:ring-blue-200"
                            value={siteContent.contactEmail || ''}
                            onChange={e => updateField('contactEmail', e.target.value)}
                            onBlur={e => saveField('contactEmail', e.target.value, siteContent)}
                            placeholder="info@kentehaul.com"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Store Address</label>
                            <SaveIndicator field="address" />
                        </div>
                        <input
                            type="text"
                            className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-bold outline-none focus:ring-2 focus:ring-blue-200"
                            value={siteContent.address || ''}
                            onChange={e => updateField('address', e.target.value)}
                            onBlur={e => saveField('address', e.target.value, siteContent)}
                            placeholder="Accra, Ghana"
                        />
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-8 space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Social Media Links</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Instagram URL</label>
                            <input
                                className="w-full p-3 bg-gray-50 border-none rounded-[15px] font-bold text-xs"
                                value={siteContent.instagramLink || ''}
                                onChange={e => updateField('instagramLink', e.target.value)}
                                onBlur={e => saveField('instagramLink', e.target.value, siteContent)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Facebook URL</label>
                            <input
                                className="w-full p-3 bg-gray-50 border-none rounded-[15px] font-bold text-xs"
                                value={siteContent.facebookLink || ''}
                                onChange={e => updateField('facebookLink', e.target.value)}
                                onBlur={e => saveField('facebookLink', e.target.value, siteContent)}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-8">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Footer Copyright Text</label>
                        <SaveIndicator field="footerText" />
                    </div>
                    <input
                        className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-bold outline-none"
                        placeholder="e.g. 2026 KenteHaul Ghana"
                        value={siteContent.footerText || ''}
                        onChange={e => updateField('footerText', e.target.value)}
                        onBlur={e => saveField('footerText', e.target.value, siteContent)}
                    />
                </div>
            </div>
        </div >
    );
}
