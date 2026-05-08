import React, { useState, useCallback } from 'react';
import { 
    FileText, Palette, Sliders, CheckCircle, RefreshCw, Eye, Save, Plus, 
    Trash2, Truck, Shield, Clock, Activity, Globe, Mail, Smartphone 
} from 'lucide-react';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { ImageUpload } from '../UIComponents';

// ==========================================
// --- STABLE INTERNAL COMPONENTS (OUTSIDE) ---
// ==========================================

const SaveIndicator = ({ field, saving, saved }) => (
    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black">
        {saving[field] && <RefreshCw size={10} className="animate-spin text-blue-500" />}
        {saved[field] && !saving[field] && (
            <>
                <CheckCircle size={10} className="text-green-500" />
                <span className="text-green-500 uppercase tracking-widest">Saved & LIVE</span>
            </>
        )}
    </span>
);

const SectionHeader = ({ icon: Icon, title, colorClass, subtitle, action }) => (
    <div className="flex items-center justify-between mb-8">
        <h3 className="font-black text-sm flex items-center gap-4 text-gray-900 uppercase tracking-widest">
            <Icon className={colorClass} size={20} /> {title}
            {subtitle && (
                <span className="ml-4 text-[10px] text-green-600 font-black flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                    <Eye size={10} /> {subtitle}
                </span>
            )}
        </h3>
        {action}
    </div>
);

const RichTextLegend = () => (
    <div className="flex flex-wrap gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-6 font-sans">
        <div className="flex items-center gap-2 text-[10px] font-black text-amber-900 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Formatting Guide:
        </div>
        <div className="flex gap-6">
            <span className="text-[10px] font-bold text-amber-700">**bold text**</span>
            <span className="text-[10px] font-bold text-amber-700 italic">*italic text*</span>
            <span className="text-[10px] font-bold text-amber-700">Enter for new paragraph</span>
        </div>
    </div>
);

const TemplateGuide = ({ placeholders }) => (
    <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <div className="flex items-center gap-2 text-[10px] font-black text-amber-900 uppercase tracking-widest mb-2">
            <Activity size={12} /> Available Placeholders
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
            {placeholders.map(p => (
                <span key={p} className="text-[10px] font-bold text-amber-700">`{p}`</span>
            ))}
        </div>
    </div>
);

// ==========================================
// --- MAIN ADMIN SETTINGS COMPONENT ---
// ==========================================

export default function AdminSettings({ siteContent, setSiteContent, onlyLogistics = false }) {
    const [saving, setSaving] = useState({});
    const [saved, setSaved] = useState({});

    // INSTANT UPDATE: updates local state immediately
    const updateField = useCallback((field, value) => {
        setSiteContent(prev => ({ ...prev, [field]: value }));
    }, [setSiteContent]);

    // SAVE TO FIRESTORE: called on blur or explicit save
    const saveField = useCallback(async (field, value, currentContent) => {
        if (value === undefined) return;
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

    // SPECIAL: Color handler with debounce
    const handleColorChange = useCallback(async (field, value) => {
        updateField(field, value);
        clearTimeout(window[`colorTimer_${field}`]);
        window[`colorTimer_${field}`] = setTimeout(async () => {
            saveField(field, value, siteContent);
        }, 400);
    }, [siteContent, updateField, saveField]);

    // SPECIAL: Image handler
    const handleImageUpload = useCallback(async (field, value) => {
        updateField(field, value);
        saveField(field, value, siteContent);
    }, [siteContent, updateField, saveField]);

    // ==========================================
    // --- LOGISTICS HANDLERS ---
    // ==========================================
    const handleAddRegion = () => {
        const regions = siteContent?.deliveryRegions || [];
        const updated = [...regions, { region: 'New Region', fee: 0 }];
        updateField('deliveryRegions', updated);
        saveField('deliveryRegions', updated, siteContent);
    };

    const handleUpdateRegion = (index, key, value) => {
        const regions = [...(siteContent?.deliveryRegions || [])];
        regions[index][key] = key === 'fee' ? Number(value) : value;
        updateField('deliveryRegions', regions);
    };

    const handleRemoveRegion = (index) => {
        const regions = [...(siteContent?.deliveryRegions || [])];
        regions.splice(index, 1);
        updateField('deliveryRegions', regions);
        saveField('deliveryRegions', regions, siteContent);
    };

    const handleAddLocation = () => {
        const locations = siteContent?.pickupLocations || [];
        const updated = [...locations, { name: 'New Workshop', address: '', mapsLink: '' }];
        updateField('pickupLocations', updated);
        saveField('pickupLocations', updated, siteContent);
    };

    const handleUpdateLocation = (index, key, value) => {
        const locations = [...(siteContent?.pickupLocations || [])];
        locations[index][key] = value;
        updateField('pickupLocations', locations);
    };

    const handleRemoveLocation = (index) => {
        const locations = [...(siteContent?.pickupLocations || [])];
        locations.splice(index, 1);
        updateField('pickupLocations', locations);
        saveField('pickupLocations', locations, siteContent);
    };

    // ==========================================
    // --- UI RENDERERS ---
    // ==========================================

    const renderLogistics = () => (
        <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
            <SectionHeader icon={Truck} title="Shipping & Delivery Management" colorClass="text-gray-400" />
            
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Delivery Regions & Fees</label>
                    <SaveIndicator field="deliveryRegions" saving={saving} saved={saved} />
                </div>
                <div className="bg-gray-50 p-6 rounded-[30px] space-y-4">
                    {(siteContent?.deliveryRegions || []).map((region, index) => (
                        <div key={index} className="flex gap-3 items-center">
                            <input
                                type="text"
                                className="flex-1 p-4 bg-white border border-gray-200 rounded-[20px] font-bold text-sm outline-none focus:border-blue-300"
                                value={region?.region || ''}
                                onChange={e => handleUpdateRegion(index, 'region', e.target.value)}
                                onBlur={() => saveField('deliveryRegions', siteContent?.deliveryRegions, siteContent)}
                            />
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₵</span>
                                <input
                                    type="number"
                                    className="w-32 pl-8 pr-4 py-4 bg-white border border-gray-200 rounded-[20px] font-black text-sm outline-none focus:border-blue-300"
                                    value={region.fee === 0 ? '' : region.fee}
                                    onChange={e => handleUpdateRegion(index, 'fee', e.target.value)}
                                    onBlur={() => saveField('deliveryRegions', siteContent?.deliveryRegions, siteContent)}
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

            <div className="space-y-4 mt-12 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Self-Pickup Workshops & Stores</label>
                    <SaveIndicator field="pickupLocations" saving={saving} saved={saved} />
                </div>
                <div className="bg-gray-50 p-6 rounded-[30px] space-y-4">
                    {(siteContent?.pickupLocations || []).map((loc, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative">
                            <button onClick={() => handleRemoveLocation(index)} className="absolute -top-2 -right-2 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm z-10">
                                <Trash2 size={14} />
                            </button>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400">Workshop/Store Name</label>
                                <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" placeholder="e.g. Accra Workshop" value={loc.name} onChange={e => handleUpdateLocation(index, 'name', e.target.value)} onBlur={() => saveField('pickupLocations', siteContent?.pickupLocations, siteContent)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400">Maps Link (URL)</label>
                                <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" placeholder="Google Maps URL" value={loc.mapsLink} onChange={e => handleUpdateLocation(index, 'mapsLink', e.target.value)} onBlur={() => saveField('pickupLocations', siteContent?.pickupLocations, siteContent)} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400">Physical Address / Instructions</label>
                                <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none h-20 resize-none" placeholder="Detailed address..." value={loc.address} onChange={e => handleUpdateLocation(index, 'address', e.target.value)} onBlur={() => saveField('pickupLocations', siteContent?.pickupLocations, siteContent)} />
                            </div>
                        </div>
                    ))}
                    <button onClick={handleAddLocation} className="w-full p-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-[20px] font-black text-sm uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                        <Plus size={18} /> Add Pickup Point
                    </button>
                </div>
            </div>
        </div>
    );

    if (onlyLogistics) {
        return (
            <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up pb-32">
                {renderLogistics()}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up pb-32">
            
            {/* 🎨 BRANDING */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <SectionHeader 
                    icon={Palette} 
                    title="Store Branding" 
                    colorClass="text-purple-400" 
                    subtitle="Changes appear live on your site" 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {['primaryColor', 'secondaryColor'].map(field => (
                        <div key={field}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">{field.replace('Color', ' Brand Color')}</label>
                                <SaveIndicator field={field} saving={saving} saved={saved} />
                            </div>
                            <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-[25px] mt-2">
                                <input
                                    type="color"
                                    className="h-16 w-16 rounded-2xl cursor-pointer border-none bg-transparent"
                                    value={siteContent[field] || (field === 'primaryColor' ? '#5b0143' : '#f97316')}
                                    onChange={e => handleColorChange(field, e.target.value)}
                                />
                                <div>
                                    <p className="font-black text-gray-400 font-mono tracking-widest">{siteContent[field]}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{field === 'primaryColor' ? 'Navbar, buttons, headings' : 'Prices, badges, accents'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ⚡ FLASH SALES */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100 mt-8">
                <SectionHeader 
                    icon={Sliders} 
                    title="Flash Sale Settings" 
                    colorClass="text-amber-400" 
                    subtitle="Customize your sale banner" 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Sale Title</label>
                            <SaveIndicator field="flashSaleTitle" saving={saving} saved={saved} />
                        </div>
                        <input
                            type="text"
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-gray-200 font-bold mt-2"
                            value={siteContent?.flashSaleTitle || "Mother's Day Sales"}
                            onChange={e => updateField('flashSaleTitle', e.target.value)}
                            onBlur={e => saveField('flashSaleTitle', e.target.value, siteContent)}
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Sale Color</label>
                            <SaveIndicator field="flashSaleColor" saving={saving} saved={saved} />
                        </div>
                        <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-[25px] mt-2">
                            <input
                                type="color"
                                className="h-16 w-16 rounded-2xl cursor-pointer border-none bg-transparent"
                                value={siteContent?.flashSaleColor || '#5b0143'}
                                onChange={e => handleColorChange('flashSaleColor', e.target.value)}
                            />
                            <div>
                                <p className="font-black text-gray-400 font-mono tracking-widest">{siteContent?.flashSaleColor}</p>
                                <p className="text-[10px] text-gray-400 mt-1">Background color for the sale section</p>
                        </div>
                    </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Enable Sale</label>
                            <SaveIndicator field="flashSaleEnabled" saving={saving} saved={saved} />
                        </div>
                        <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-[25px] mt-2">
                            <input
                                type="checkbox"
                                className="h-6 w-6 cursor-pointer"
                                checked={siteContent?.flashSaleEnabled || false}
                                onChange={e => {
                                    updateField('flashSaleEnabled', e.target.checked);
                                    saveField('flashSaleEnabled', e.target.checked, siteContent);
                                }}
                            />
                            <span className="font-bold text-sm text-gray-700">Turn on Sales ad</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Sale End Date & Time</label>
                            <SaveIndicator field="flashSaleEndDate" saving={saving} saved={saved} />
                        </div>
                        <input
                            type="datetime-local"
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-gray-200 font-bold mt-2"
                            value={siteContent?.flashSaleEndDate || ''}
                            onChange={e => updateField('flashSaleEndDate', e.target.value)}
                            onBlur={e => saveField('flashSaleEndDate', e.target.value, siteContent)}
                        />
                    </div>
                </div>
            </div>

            {/* 🖼️ ASSETS & TEXT */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <SectionHeader icon={Sliders} title="Visual Assets & Headlines" colorClass="text-blue-400" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {['logo', 'heroImage'].map(field => (
                        <div key={field}>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">{field.replace(/([A-Z])/g, ' $1')}</label>
                                <SaveIndicator field={field} saving={saving} saved={saved} />
                            </div>
                            <ImageUpload
                                image={siteContent[field]}
                                onUpload={img => handleImageUpload(field, img)}
                                label={`Upload ${field}`}
                                height={field === 'logo' ? "h-32" : "h-56"}
                                primaryColor={siteContent?.primaryColor}
                            />
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    {[
                        { id: 'heroTitle', label: 'Hero Headline', placeholder: 'e.g. Weave Your Story' },
                        { id: 'heroSubtitle', label: 'Hero Subtext', placeholder: 'Subtitle shown below headline' },
                        { id: 'galleryTitle', label: 'Gallery Section Title', placeholder: 'e.g. Lifestyle Gallery' },
                        { id: 'testimonialsTitle', label: 'Testimonials Title', placeholder: 'e.g. Love from our Clients' }
                    ].map(field => (
                        <div key={field.id}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                                <SaveIndicator field={field.id} saving={saving} saved={saved} />
                            </div>
                            <input
                                className="w-full p-5 bg-gray-50 border-none rounded-[25px] font-bold outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
                                value={siteContent[field.id] || ''}
                                placeholder={field.placeholder}
                                onChange={e => updateField(field.id, e.target.value)}
                                onBlur={e => saveField(field.id, e.target.value, siteContent)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* 📖 CONTENT & HISTORY */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <SectionHeader icon={FileText} title="Knowledge & History Pages" colorClass="text-amber-500" />
                <RichTextLegend />
                <div className="space-y-10">
                    {/* Heritage / Story */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Our Story / Heritage Page</label>
                            <SaveIndicator field="heritageText" saving={saving} saved={saved} />
                        </div>
                        <input 
                            className="w-full p-4 bg-gray-50 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-amber-100" 
                            placeholder="Page Title" 
                            value={siteContent?.heritageTitle || ''} 
                            onChange={e => updateField('heritageTitle', e.target.value)} 
                            onBlur={e => saveField('heritageTitle', e.target.value, siteContent)} 
                        />
                        <textarea 
                            className="w-full p-6 bg-gray-50 rounded-[30px] h-48 font-medium text-sm leading-relaxed outline-none focus:ring-2 focus:ring-amber-100 resize-none" 
                            placeholder="Complete brand narrative..." 
                            value={siteContent?.heritageText || ''} 
                            onChange={e => updateField('heritageText', e.target.value)} 
                            onBlur={e => saveField('heritageText', e.target.value, siteContent)} 
                        />
                    </div>

                    {/* Partnership Section */}
                    <div className="pt-10 border-t border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Partnership Section</label>
                            <SaveIndicator field="partnerHeadline" saving={saving} saved={saved} />
                        </div>
                        <input 
                            className="w-full p-4 bg-gray-50 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-100" 
                            placeholder="Partnership Headline" 
                            value={siteContent?.partnerHeadline || ''} 
                            onChange={e => updateField('partnerHeadline', e.target.value)} 
                            onBlur={e => saveField('partnerHeadline', e.target.value, siteContent)} 
                        />
                        <textarea 
                            className="w-full p-6 bg-gray-50 rounded-[30px] h-48 font-medium text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-100 resize-none" 
                            placeholder="Partnership details..." 
                            value={siteContent?.partnerBody || ''} 
                            onChange={e => updateField('partnerBody', e.target.value)} 
                            onBlur={e => saveField('partnerBody', e.target.value, siteContent)} 
                        />
                    </div>
                </div>
            </div>

            {/* 🚀 BILLING & INVOICING */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <SectionHeader icon={Shield} title="Invoicing & Checkout" colorClass="text-blue-600" />
                
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paystack Public Key</label>
                                <SaveIndicator field="paystackPublicKey" saving={saving} saved={saved} />
                            </div>
                            <input 
                                className="w-full p-4 bg-blue-950 text-blue-200 rounded-2xl font-mono text-xs outline-none" 
                                value={siteContent?.paystackPublicKey || ''} 
                                onChange={e => updateField('paystackPublicKey', e.target.value)} 
                                onBlur={e => saveField('paystackPublicKey', e.target.value, siteContent)} 
                                placeholder="pk_live_..." 
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => saveField('paystackEnabled', !siteContent?.paystackEnabled, siteContent)} 
                                className={`flex-1 p-4 h-[52px] rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-3 mt-auto ${siteContent?.paystackEnabled !== false ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                            >
                                Card Payments: {siteContent?.paystackEnabled !== false ? 'ON' : 'OFF'}
                                <SaveIndicator field="paystackEnabled" saving={saving} saved={saved} />
                            </button>
                        </div>
                    </div>

                    {/* Invoice Sharing Templates */}
                    <div className="pt-10 border-t border-gray-100">
                        <SectionHeader icon={Mail} title="Invoice Share Templates" colorClass="text-amber-500" />
                        <TemplateGuide placeholders={['[customerName]', '[orderId]', '[total]', '[invoiceUrl]', '[completionDate]', '[weavingDays]']} />
                        
                        <div className="space-y-6">
                            {[
                                { id: 'invoiceEmailSubject', label: 'Email Subject' },
                                { id: 'invoiceEmailBody', label: 'Email Content', area: true },
                                { id: 'invoiceWhatsAppMsg', label: 'WhatsApp Template', area: true }
                            ].map(field => (
                                <div key={field.id}>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                                        <SaveIndicator field={field.id} saving={saving} saved={saved} />
                                    </div>
                                    {field.area ? (
                                        <textarea className="w-full p-6 bg-gray-50 rounded-[30px] h-32 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-50 resize-none" value={siteContent[field.id] || ''} onChange={e => updateField(field.id, e.target.value)} onBlur={e => saveField(field.id, e.target.value, siteContent)} />
                                    ) : (
                                        <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-50" value={siteContent[field.id] || ''} onChange={e => updateField(field.id, e.target.value)} onBlur={e => saveField(field.id, e.target.value, siteContent)} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Production Templates */}
                    <div className="pt-10 border-t border-gray-100">
                        <SectionHeader icon={Activity} title="Production Progress Updates" colorClass="text-blue-500" />
                        <TemplateGuide placeholders={['[stage]', '[stageDescription]', '[trackingUrl]', '[customerName]', '[orderId]']} />
                        
                        <div className="space-y-6">
                            {[
                                { id: 'productionUpdateEmailSubject', label: 'Email Subject' },
                                { id: 'productionUpdateEmailBody', label: 'Email Content', area: true },
                                { id: 'productionUpdateWhatsAppMsg', label: 'WhatsApp Template', area: true }
                            ].map(field => (
                                <div key={field.id}>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                                        <SaveIndicator field={field.id} saving={saving} saved={saved} />
                                    </div>
                                    {field.area ? (
                                        <textarea className="w-full p-6 bg-gray-50 rounded-[30px] h-32 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-50 resize-none" value={siteContent[field.id] || ''} onChange={e => updateField(field.id, e.target.value)} onBlur={e => saveField(field.id, e.target.value, siteContent)} />
                                    ) : (
                                        <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-50" value={siteContent[field.id] || ''} onChange={e => updateField(field.id, e.target.value)} onBlur={e => saveField(field.id, e.target.value, siteContent)} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 📍 CONTACT & FOOTER */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <SectionHeader icon={Activity} title="Public Presence & Legal" colorClass="text-gray-950" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {[
                        { id: 'contactPhone', label: 'Contact Phone', icon: Smartphone, type: 'tel' },
                        { id: 'contactEmail', label: 'Contact Email', icon: Mail, type: 'email' },
                        { id: 'address', label: 'Store Physical Address', icon: Truck, type: 'text' },
                        { id: 'footerText', label: 'Copyright Footer Text', icon: Shield, type: 'text' }
                    ].map(field => (
                        <div key={field.id}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                                <SaveIndicator field={field.id} saving={saving} saved={saved} />
                            </div>
                            <div className="relative">
                                <field.icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input 
                                    type={field.type}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-gray-100" 
                                    value={siteContent[field.id] || ''} 
                                    onChange={e => updateField(field.id, e.target.value)} 
                                    onBlur={e => saveField(field.id, e.target.value, siteContent)} 
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-6 pt-10 border-t border-gray-100">
                    {['privacyPolicy', 'termsConditions', 'refundPolicy'].map(field => (
                        <div key={field}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.replace(/([A-Z])/g, ' $1')}</label>
                                <SaveIndicator field={field} saving={saving} saved={saved} />
                            </div>
                            <textarea className="w-full p-6 bg-gray-50 rounded-[30px] h-32 font-medium text-sm leading-relaxed outline-none focus:ring-2 focus:ring-gray-100 resize-none" value={siteContent[field] || ''} onChange={e => updateField(field, e.target.value)} onBlur={e => saveField(field, e.target.value, siteContent)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* 🚛 LOGISTICS (Secondary inclusion) */}
            {renderLogistics()}
        </div>
    );
}
