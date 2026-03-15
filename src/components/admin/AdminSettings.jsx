import React, { useState, useCallback } from 'react';
import { FileText, Palette, Sliders, CheckCircle, RefreshCw, Eye, Save, Plus, Trash2, Truck } from 'lucide-react';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { ImageUpload } from '../UIComponents';

export default function AdminSettings({ siteContent, setSiteContent, onlyLogistics = false }) {
    const [saving, setSaving] = useState({});
    const [saved, setSaved] = useState({});

    // ... (rest of logic remains same)

    const handleLocationBlur = () => {
        saveField('pickupLocations', siteContent.pickupLocations, siteContent);
    };

    const handleRegionBlur = () => {
        saveField('deliveryRegions', siteContent.deliveryRegions, siteContent);
    };

    if (onlyLogistics) {
        return (
            <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up pb-32">
                <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                    <h3 className="font-black text-sm mb-8 flex items-center gap-4 text-gray-900 uppercase tracking-widest">
                        <Truck className="text-gray-400" size={20} /> Shipping & Delivery Management
                    </h3>
                    
                    {/* Shipping Regions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Delivery Regions & Fees</label>
                            <SaveIndicator field="deliveryRegions" />
                        </div>
                        <div className="bg-gray-50 p-6 rounded-[30px] space-y-4">
                            {(siteContent.deliveryRegions || []).map((region, index) => (
                                <div key={index} className="flex gap-3 items-center">
                                    <input
                                        type="text"
                                        className="flex-1 p-4 bg-white border border-gray-200 rounded-[20px] font-bold text-sm outline-none focus:border-blue-300"
                                        placeholder="Region Name (e.g., Accra)"
                                        value={region.region}
                                        onChange={e => handleUpdateRegion(index, 'region', e.target.value)}
                                        onBlur={handleRegionBlur}
                                    />
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₵</span>
                                        <input
                                            type="number"
                                            className="w-32 pl-8 pr-4 py-4 bg-white border border-gray-200 rounded-[20px] font-black text-sm outline-none focus:border-blue-300"
                                            placeholder="Fee"
                                            value={region.fee === 0 ? '' : region.fee}
                                            onChange={e => handleUpdateRegion(index, 'fee', e.target.value)}
                                            onBlur={handleRegionBlur}
                                        />
                                    </div>
                                    <button onClick={() => handleRemoveRegion(index)} className="p-4 bg-red-50 text-red-500 rounded-[20px] hover:bg-red-500 hover:text-white transition-all transform active:scale-95">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={handleAddRegion} className="w-full p-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-[20px] font-black text-sm uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                                <Plus size={18} /> Add New Shipping Region
                            </button>
                        </div>
                    </div>

                    {/* Pickup Locations */}
                    <div className="space-y-4 mt-12 pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Self-Pickup Workshops & Stores</label>
                            <SaveIndicator field="pickupLocations" />
                        </div>
                        <div className="bg-gray-50 p-6 rounded-[30px] space-y-4">
                            {(siteContent.pickupLocations || []).map((loc, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative">
                                    <button onClick={() => handleRemoveLocation(index)} className="absolute -top-2 -right-2 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm z-10">
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400">Workshop/Store Name</label>
                                        <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" placeholder="e.g. Accra Workshop" value={loc.name} onChange={e => handleUpdateLocation(index, 'name', e.target.value)} onBlur={handleLocationBlur} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400">Maps Link (URL)</label>
                                        <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" placeholder="Google Maps URL" value={loc.mapsLink} onChange={e => handleUpdateLocation(index, 'mapsLink', e.target.value)} onBlur={handleLocationBlur} />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400">Physical Address / Instructions</label>
                                        <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none h-20 resize-none" placeholder="Detailed address..." value={loc.address} onChange={e => handleUpdateLocation(index, 'address', e.target.value)} onBlur={handleLocationBlur} />
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleAddLocation} className="w-full p-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-[20px] font-black text-sm uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                                <Plus size={18} /> Add Pickup Point
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up pb-32">



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
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gallery Section Title</label>
                            <SaveIndicator field="galleryTitle" />
                        </div>
                        <input
                            className="w-full p-5 bg-gray-50 border-none rounded-[25px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="e.g. Lifestyle Gallery"
                            value={siteContent.galleryTitle || ''}
                            onChange={e => updateField('galleryTitle', e.target.value)}
                            onBlur={e => saveField('galleryTitle', e.target.value, siteContent)}
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Testimonials Title</label>
                            <SaveIndicator field="testimonialsTitle" />
                        </div>
                        <input
                            className="w-full p-5 bg-gray-50 border-none rounded-[25px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="e.g. Love from our Clients"
                            value={siteContent.testimonialsTitle || ''}
                            onChange={e => updateField('testimonialsTitle', e.target.value)}
                            onBlur={e => saveField('testimonialsTitle', e.target.value, siteContent)}
                        />
                    </div>
                </div>

                {/* Navbar Content */}
                <div className="mt-8 border-t border-gray-100 pt-8">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Navbar Hook & Featured</label>
                        <SaveIndicator field="navShopTitle" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-black text-xs outline-none"
                            placeholder="Hook Title (e.g. Store Shop)"
                            value={siteContent.navShopTitle || ''}
                            onChange={e => updateField('navShopTitle', e.target.value)}
                            onBlur={e => saveField('navShopTitle', e.target.value, siteContent)}
                        />
                        <input
                            className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-black text-xs outline-none"
                            placeholder="Hook Subtitle (e.g. Discover Excellence)"
                            value={siteContent.navShopSubtitle || ''}
                            onChange={e => updateField('navShopSubtitle', e.target.value)}
                            onBlur={e => saveField('navShopSubtitle', e.target.value, siteContent)}
                        />
                    </div>
                </div>

                {/* Heritage Summary */}
                <div className="mt-8 border-t border-gray-100 pt-8">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Heritage Section (Home Page)</label>
                        <SaveIndicator field="heritageSummary" />
                    </div>
                    <div className="space-y-4">
                        <input
                            className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-black text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Section Title (e.g. A Story in Every Thread)"
                            value={siteContent.heritageHomeTitle || ''}
                            onChange={e => updateField('heritageHomeTitle', e.target.value)}
                            onBlur={e => saveField('heritageHomeTitle', e.target.value, siteContent)}
                        />
                        <textarea
                            className="w-full p-6 bg-gray-50 border-none rounded-[30px] h-32 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="A short story about your brand for the home page..."
                            value={siteContent.heritageSummary || ''}
                            onChange={e => updateField('heritageSummary', e.target.value)}
                            onBlur={e => saveField('heritageSummary', e.target.value, siteContent)}
                        />
                    </div>
                </div>

                {/* Our Story Page */}
                <div className="mt-8 border-t border-gray-100 pt-8">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Our Story Page</label>
                        <SaveIndicator field="heritageTitle" />
                    </div>
                    <div className="space-y-4">
                        <input
                            className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-black text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Hero Title (e.g. Our Royal Heritage)"
                            value={siteContent.heritageTitle || ''}
                            onChange={e => updateField('heritageTitle', e.target.value)}
                            onBlur={e => saveField('heritageTitle', e.target.value, siteContent)}
                        />
                        <textarea
                            className="w-full p-6 bg-gray-50 border-none rounded-[30px] h-48 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed"
                            placeholder="The full narrative for the Our Story page..."
                            value={siteContent.heritageText || ''}
                            onChange={e => updateField('heritageText', e.target.value)}
                            onBlur={e => saveField('heritageText', e.target.value, siteContent)}
                        />
                    </div>
                </div>

                {/* Institute Page */}
                <div className="mt-8 border-t border-gray-100 pt-8">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institute Page & History</label>
                        <SaveIndicator field="instituteTitle" />
                    </div>
                    <div className="space-y-4">
                        <input
                            className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-black text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Hero Title (e.g. Kente Institute)"
                            value={siteContent.instituteTitle || ''}
                            onChange={e => updateField('instituteTitle', e.target.value)}
                            onBlur={e => saveField('instituteTitle', e.target.value, siteContent)}
                        />
                        <textarea
                            className="w-full p-6 bg-gray-50 border-none rounded-[30px] h-32 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed"
                            placeholder="Main text/history for the Institute page..."
                            value={siteContent.instituteText || ''}
                            onChange={e => updateField('instituteText', e.target.value)}
                            onBlur={e => saveField('instituteText', e.target.value, siteContent)}
                        />
                        <div className="pt-2">
                             <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Global Artifact Story / Educational Content</label>
                                <SaveIndicator field="globalArtifactStory" />
                            </div>
                            <textarea
                                className="w-full p-6 bg-purple-50/50 border border-purple-100 rounded-[30px] h-48 font-bold text-sm outline-none focus:ring-2 focus:ring-purple-200 leading-relaxed"
                                placeholder="This story appears across the Kente Institute as educational content..."
                                value={siteContent.globalArtifactStory || ''}
                                onChange={e => updateField('globalArtifactStory', e.target.value)}
                                onBlur={e => saveField('globalArtifactStory', e.target.value, siteContent)}
                            />
                        </div>
                    </div>
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

            {/* ⚙️ SYSTEM CONFIG & SHIPPING */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <h3 className="font-black text-sm mb-8 flex items-center gap-4 text-gray-900 uppercase tracking-widest">
                    <Truck className="text-gray-400" size={20} /> Shipping & Delivery
                </h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Regions & Fees</label>
                        <SaveIndicator field="deliveryRegions" />
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-[30px] space-y-4">
                        {(siteContent.deliveryRegions || []).map((region, index) => (
                            <div key={index} className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    className="flex-1 p-4 bg-white border border-gray-200 rounded-[20px] font-bold text-sm outline-none focus:border-blue-300"
                                    placeholder="Region Name (e.g., Accra)"
                                    value={region.region}
                                    onChange={e => handleUpdateRegion(index, 'region', e.target.value)}
                                    onBlur={handleRegionBlur}
                                />
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₵</span>
                                    <input
                                        type="number"
                                        className="w-32 pl-8 pr-4 py-4 bg-white border border-gray-200 rounded-[20px] font-black text-sm outline-none focus:border-blue-300"
                                        placeholder="Fee"
                                        value={region.fee === 0 ? '' : region.fee}
                                        onChange={e => handleUpdateRegion(index, 'fee', e.target.value)}
                                        onBlur={handleRegionBlur}
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoveRegion(index)}
                                    className="p-4 bg-red-50 text-red-500 rounded-[20px] hover:bg-red-500 hover:text-white transition-all transform active:scale-95"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                        
                        <button
                            onClick={handleAddRegion}
                            className="w-full p-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-[20px] font-black text-sm uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Add Region
                        </button>
                    </div>
                </div>

                <div className="space-y-4 mt-12 pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pickup Locations (Multi-Location)</label>
                        <SaveIndicator field="pickupLocations" />
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-[30px] space-y-4">
                        {(siteContent.pickupLocations || []).map((loc, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative">
                                <button
                                    onClick={() => handleRemoveLocation(index)}
                                    className="absolute -top-2 -right-2 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm z-10"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400">Location Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                                        placeholder="e.g. Accra Workshop"
                                        value={loc.name}
                                        onChange={e => handleUpdateLocation(index, 'name', e.target.value)}
                                        onBlur={handleLocationBlur}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400">GPS/Maps Link</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                                        placeholder="Google Maps URL"
                                        value={loc.mapsLink}
                                        onChange={e => handleUpdateLocation(index, 'mapsLink', e.target.value)}
                                        onBlur={handleLocationBlur}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400">Full Address</label>
                                    <textarea
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none h-20 resize-none"
                                        placeholder="Detailed address and directions..."
                                        value={loc.address}
                                        onChange={e => handleUpdateLocation(index, 'address', e.target.value)}
                                        onBlur={handleLocationBlur}
                                    />
                                </div>
                            </div>
                        ))}
                        
                        <button
                            onClick={handleAddLocation}
                            className="w-full p-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-[20px] font-black text-sm uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Add Pickup Location
                        </button>
                    </div>
                </div>

                <div className="space-y-4 mt-12 pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notifications API (SMS/WhatsApp)</label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arkesel API Key</label>
                                <SaveIndicator field="arkeselApiKey" />
                            </div>
                            <input
                                type="password"
                                className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-mono text-xs outline-none"
                                value={siteContent.arkeselApiKey || ''}
                                onChange={e => updateField('arkeselApiKey', e.target.value)}
                                onBlur={e => saveField('arkeselApiKey', e.target.value, siteContent)}
                                placeholder="Enter API Key"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arkesel Sender ID</label>
                                <SaveIndicator field="arkeselSenderId" />
                            </div>
                            <input
                                type="text"
                                className="w-full p-4 bg-gray-50 border-none rounded-[20px] font-bold text-sm outline-none"
                                value={siteContent.arkeselSenderId || ''}
                                onChange={e => updateField('arkeselSenderId', e.target.value)}
                                onBlur={e => saveField('arkeselSenderId', e.target.value, siteContent)}
                                placeholder="KenteHaul"
                            />
                        </div>
                    </div>
                </div>

                <h3 className="font-black text-sm mb-8 mt-12 flex items-center gap-4 text-gray-900 uppercase tracking-widest pt-8 border-t border-gray-100">
                    <Save className="text-gray-400" size={20} /> Checkout & Payment Modes
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={() => saveField('paystackEnabled', siteContent.paystackEnabled === false ? true : false, siteContent)}
                        className={`p-6 rounded-[30px] border-2 transition-all flex flex-col items-center gap-2 ${siteContent.paystackEnabled !== false ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                    >
                        <SaveIndicator field="paystackEnabled" />
                        <div className={`p-3 rounded-full ${siteContent.paystackEnabled !== false ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <Palette size={20} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Paystack (Card)</span>
                        <span className="text-[10px] font-bold text-gray-400">{siteContent.paystackEnabled !== false ? 'ENABLED' : 'DISABLED'}</span>
                    </button>
                    <button 
                        onClick={() => saveField('whatsappEnabled', siteContent.whatsappEnabled === false ? true : false, siteContent)}
                        className={`p-6 rounded-[30px] border-2 transition-all flex flex-col items-center gap-2 ${siteContent.whatsappEnabled !== false ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-gray-50'}`}
                    >
                        <SaveIndicator field="whatsappEnabled" />
                        <div className={`p-3 rounded-full ${siteContent.whatsappEnabled !== false ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <RefreshCw size={20} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">WhatsApp Order</span>
                        <span className="text-[10px] font-bold text-gray-400">{siteContent.whatsappEnabled !== false ? 'ENABLED' : 'DISABLED'}</span>
                    </button>
                </div>

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
