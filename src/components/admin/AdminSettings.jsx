import React, { useState, useCallback, useEffect } from 'react';
import {
    FileText, Palette, Sliders, CheckCircle, RefreshCw, Eye, Save, Plus,
    Trash2, Truck, Shield, Clock, Activity, Globe, Mail, Smartphone, Zap, Key, MapPin
} from 'lucide-react';
import { doc, setDoc, getDoc, collection, getDocs, query, limit as fbLimit } from "firebase/firestore";
import { db } from '../../firebase';
import { ImageUpload } from '../UIComponents';
import useSaleWindow, { formatTimeLeft, localInputToUtcIso, utcIsoToLocalInput, localZoneLabel } from '../../hooks/useSaleWindow';

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

// WhatsApp has no bulk-send API here (that needs Meta Business approval), so this
// is a deliberate, one-at-a-time tool rather than an automatic blast: it builds the
// message once, then opens a pre-filled wa.me chat per customer for the admin to
// review and hit send on. Kept separate from the automatic email above because it
// reaches past customers who ordered before — not people who explicitly opted in.
const WhatsAppBroadcastPanel = ({ siteContent, customers }) => {
    const defaultMsg = `${siteContent?.flashSaleTitle || "Our sale"} is now live on KenteHaul!${siteContent?.flashSaleTeaser ? ` ${siteContent.flashSaleTeaser}.` : ''} Shop now: https://kentehaul.com/shop?category=sales`;
    const [message, setMessage] = useState(defaultMsg);
    const [copied, setCopied] = useState(false);

    // Re-sync the draft when the sale copy changes, but only until the admin starts
    // typing their own edit — otherwise every keystroke on Sale Title would stomp it.
    const [touched, setTouched] = useState(false);
    useEffect(() => { if (!touched) setMessage(defaultMsg); }, [defaultMsg, touched]);

    const contactable = (customers || []).filter(c => c.phone);

    const copyMessage = async () => {
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard unavailable — the textarea itself is still selectable */ }
    };

    return (
        <div className="p-6 rounded-[32px] border border-gray-100 bg-white">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Smartphone size={12} /> WhatsApp — Reaches Past Customers
            </p>
            <textarea
                className="w-full p-3 bg-gray-50 rounded-2xl text-xs font-medium leading-relaxed outline-none focus:ring-2 focus:ring-green-100 resize-none mt-2"
                rows={3}
                value={message}
                onChange={e => { setMessage(e.target.value); setTouched(true); }}
            />
            <div className="flex items-center justify-between mt-2">
                <button
                    type="button"
                    onClick={copyMessage}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                >
                    {copied ? 'Copied!' : 'Copy Message'}
                </button>
                <span className="text-[10px] text-gray-400 font-bold">{contactable.length} customer{contactable.length === 1 ? '' : 's'} with a phone number</span>
            </div>
            {contactable.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto flex flex-col gap-1 border-t border-gray-100 pt-3">
                    {contactable.slice(0, 100).map(c => (
                        <a
                            key={c.id || c.phone}
                            href={`https://wa.me/${String(c.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-green-50 text-xs font-bold text-gray-600 hover:text-green-700"
                        >
                            <span>{c.name || c.phone}</span>
                            <span className="text-green-600">Send →</span>
                        </a>
                    ))}
                    {contactable.length > 100 && (
                        <p className="text-[10px] text-gray-400 px-3 pt-1">+{contactable.length - 100} more in Customers tab.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// ==========================================
// --- MAIN ADMIN SETTINGS COMPONENT ---
// ==========================================

export default function AdminSettings({ siteContent, setSiteContent, onlyLogistics = false, customers = [] }) {
    const [saving, setSaving] = useState({});
    const [saved, setSaved] = useState({});

    // Live preview of what customers currently see for the sale banner —
    // ticks off the same clock the storefront uses, so there's no guessing
    // whether a saved schedule actually landed in the "upcoming" window.
    const salePreview = useSaleWindow(siteContent);

    // Email subscribers ("Notify me") who opted in on the homepage banner —
    // fetched once on mount so the count doesn't require a live listener.
    const [subscriberCount, setSubscriberCount] = useState(null);
    useEffect(() => {
        getDocs(query(collection(db, 'sale_subscribers'), fbLimit(500)))
            .then(snap => setSubscriberCount(snap.size))
            .catch(() => setSubscriberCount(null));
    }, []);

    // Private settings (API keys) — loaded separately, never exposed to client bundle
    const [privateSettings, setPrivateSettings] = useState({});
    const [savingPrivate, setSavingPrivate] = useState({});
    const [savedPrivate, setSavedPrivate] = useState({});

    useEffect(() => {
        getDoc(doc(db, "settings", "private")).then(snap => {
            if (snap.exists()) setPrivateSettings(snap.data());
        }).catch(() => {});
    }, []);

    const savePrivateField = useCallback(async (field, value) => {
        if (value === undefined) return;
        setSavingPrivate(prev => ({ ...prev, [field]: true }));
        try {
            await setDoc(doc(db, "settings", "private"), { [field]: value }, { merge: true });
            setPrivateSettings(prev => ({ ...prev, [field]: value }));
            setSavedPrivate(prev => ({ ...prev, [field]: true }));
            setTimeout(() => setSavedPrivate(prev => ({ ...prev, [field]: false })), 2500);
        } catch (e) {
            console.error("Private settings sync failed:", e);
        }
        setSavingPrivate(prev => ({ ...prev, [field]: false }));
    }, []);

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

            {/* Workshop / Pickup Address */}
            <div className="space-y-3 mb-10">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={12} /> Workshop / Dispatch Address
                    </label>
                    <SaveIndicator field="workshopAddress" saving={saving} saved={saved} />
                </div>
                <input
                    type="text"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-[20px] font-bold text-sm outline-none focus:border-blue-300"
                    placeholder="e.g. 12 Tetteh Quarshie Road, Adabraka, Accra, Ghana"
                    value={siteContent?.workshopAddress || ''}
                    onChange={e => updateField('workshopAddress', e.target.value)}
                    onBlur={e => saveField('workshopAddress', e.target.value, siteContent)}
                />
                <p className="text-[10px] text-gray-400 font-bold ml-1">This is used as the pickup point for all Kwik Delivery bookings.</p>
            </div>

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
                            <span className="font-bold text-sm text-gray-700">Master switch — off hides everything below, regardless of dates</span>
                        </div>
                    </div>
                    <div />
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Sale Start Date &amp; Time</label>
                            <SaveIndicator field="flashSaleStartAt" saving={saving} saved={saved} />
                        </div>
                        <input
                            type="datetime-local"
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-gray-200 font-bold mt-2"
                            value={utcIsoToLocalInput(siteContent?.flashSaleStartAt)}
                            onChange={e => updateField('flashSaleStartAt', localInputToUtcIso(e.target.value))}
                            onBlur={e => saveField('flashSaleStartAt', localInputToUtcIso(e.target.value), siteContent)}
                        />
                        <p className="text-[10px] text-gray-400 mt-2">Leave blank to make the sale live the moment you enable it. Times are your local time ({localZoneLabel()}) — every customer sees the same moment worldwide.</p>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Sale End Date &amp; Time</label>
                            <SaveIndicator field="flashSaleEndAt" saving={saving} saved={saved} />
                        </div>
                        <input
                            type="datetime-local"
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-gray-200 font-bold mt-2"
                            value={utcIsoToLocalInput(siteContent?.flashSaleEndAt || siteContent?.flashSaleEndDate)}
                            onChange={e => updateField('flashSaleEndAt', localInputToUtcIso(e.target.value))}
                            onBlur={e => {
                                const iso = localInputToUtcIso(e.target.value);
                                // Write flashSaleEndAt only — flashSaleEndDate is the legacy
                                // zone-less field kept solely as a fallback for old data, so
                                // it must not be re-written with a new value here.
                                saveField('flashSaleEndAt', iso, siteContent);
                            }}
                        />
                        <p className="text-[10px] text-gray-400 mt-2">The sale switches off automatically at this moment — no need to come back and untick anything.</p>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Announce Sale (Days Before Start)</label>
                            <SaveIndicator field="flashSaleTeaseDays" saving={saving} saved={saved} />
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-gray-200 font-bold mt-2"
                            value={siteContent?.flashSaleTeaseDays ?? 3}
                            onChange={e => updateField('flashSaleTeaseDays', e.target.value === '' ? '' : Number(e.target.value))}
                            onBlur={e => saveField('flashSaleTeaseDays', e.target.value === '' ? 3 : Number(e.target.value), siteContent)}
                        />
                        <p className="text-[10px] text-gray-400 mt-2">How early the "coming soon" banner appears before Start Date, counting down to the opening.</p>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Announcement Line</label>
                            <SaveIndicator field="flashSaleTeaser" saving={saving} saved={saved} />
                        </div>
                        <input
                            type="text"
                            placeholder="e.g. 20% off the Harmattan Collection"
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-gray-200 font-bold mt-2"
                            value={siteContent?.flashSaleTeaser || ''}
                            onChange={e => updateField('flashSaleTeaser', e.target.value)}
                            onBlur={e => saveField('flashSaleTeaser', e.target.value, siteContent)}
                        />
                        <p className="text-[10px] text-gray-400 mt-2">Short extra line shown only in the "coming soon" banner, next to the Sale Title.</p>
                    </div>
                </div>

                {/* Live preview — ticks off the same clock the storefront reads, so what
                    Vera sees here is exactly what a customer sees right now. */}
                <div className="mt-8 p-6 rounded-[32px] border border-dashed border-gray-200 bg-gray-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Eye size={12} /> Customers see right now
                    </p>
                    {salePreview.phase === 'idle' && (
                        <p className="text-sm font-bold text-gray-400">Nothing shown — sale is off, or more than {siteContent?.flashSaleTeaseDays ?? 3} day(s) from its start date.</p>
                    )}
                    {salePreview.phase === 'upcoming' && (
                        <div className="rounded-2xl bg-[#34271f] px-5 py-4 text-[#f8f1e6] text-xs font-black uppercase tracking-[0.2em] flex flex-wrap items-center justify-between gap-2">
                            <span><span className="text-[#d9b05d]">Coming soon — </span>{siteContent?.flashSaleTitle || "Mother's Day Sales"}{siteContent?.flashSaleTeaser ? ` — ${siteContent.flashSaleTeaser}` : ''}</span>
                            <span className="text-[#d9b05d]">Opens in {formatTimeLeft(salePreview.timeLeft)}</span>
                        </div>
                    )}
                    {salePreview.phase === 'live' && (
                        <div className="rounded-2xl bg-[#211b17] px-5 py-4 text-[#f8f1e6] text-xs font-black uppercase tracking-[0.2em] flex flex-wrap items-center justify-between gap-2">
                            <span>{siteContent?.flashSaleTitle || "Mother's Day Sales"} is live</span>
                            {salePreview.timeLeft.total > 0 && <span className="text-[#d9b05d]">Ends in {formatTimeLeft(salePreview.timeLeft)}</span>}
                        </div>
                    )}
                    {salePreview.phase === 'ended' && (
                        <p className="text-sm font-bold text-gray-400">Sale window has passed — banner and discounted pricing are already off. Set a new Start/End Date to run another.</p>
                    )}
                </div>

                {/* Awareness & reach — email is automatic; WhatsApp is a deliberate,
                    admin-triggered action since it reaches past customers who never
                    explicitly opted in to sale announcements. */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-[32px] border border-gray-100 bg-white">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Mail size={12} /> Email — Sent Automatically
                        </p>
                        <p className="text-2xl font-black text-gray-900">
                            {subscriberCount === null ? '—' : subscriberCount}
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">
                                {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                            </span>
                        </p>
                        <p className="text-[11px] text-gray-400 mt-2">People who tapped "Notify Me" on the coming-soon banner. They get one email automatically the moment Start Date arrives — no action needed here.</p>
                    </div>
                    <WhatsAppBroadcastPanel siteContent={siteContent} customers={customers} />
                </div>
            </div>

            {/* ⭐ FEATURED PRODUCTS */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100 mt-8">
                <SectionHeader
                    icon={Sliders}
                    title="Featured Products Settings"
                    colorClass="text-amber-400"
                    subtitle="Homepage showcase, right below the hero"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-black text-gray-700 uppercase tracking-widest text-[10px]">Show on Homepage</label>
                            <SaveIndicator field="featuredEnabled" saving={saving} saved={saved} />
                        </div>
                        <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-[25px] mt-2">
                            <input
                                type="checkbox"
                                className="h-6 w-6 cursor-pointer"
                                checked={siteContent?.featuredEnabled !== false}
                                onChange={e => {
                                    updateField('featuredEnabled', e.target.checked);
                                    saveField('featuredEnabled', e.target.checked, siteContent);
                                }}
                            />
                            <span className="font-bold text-sm text-gray-700">Turn on Featured Products section</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 px-1">
                            Choose which products appear by turning on "Feature on Homepage" for up to 4 items in Our Products. If none are marked, the 4 newest products show automatically.
                        </p>
                    </div>
                </div>
            </div>

            {/* 🖼️ ASSETS & TEXT */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <SectionHeader icon={Sliders} title="Visual Assets & Headlines" colorClass="text-blue-400" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {['logo', 'heroImage', 'craftImage', 'heritageHeroImage'].map(field => (
                        <div key={field}>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">{field.replace(/([A-Z])/g, ' $1')}</label>
                                <SaveIndicator field={field} saving={saving} saved={saved} />
                            </div>
                            <ImageUpload
                                image={siteContent[field]}
                                onUpload={img => handleImageUpload(field, img)}
                                label={`Upload ${field}`}
                                height={field === 'logo' ? "h-32" : "h-48"}
                                primaryColor={siteContent?.primaryColor}
                            />
                        </div>
                    ))}
                </div>

                {/* Gallery Layout Setting */}
                <div className="mb-8 max-w-xs">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Gallery Layout</label>
                    <SaveIndicator field="galleryLayout" saving={saving} saved={saved} />
                  </div>
                  <select
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-400/20"
                    value={siteContent?.galleryLayout || 'bento'}
                    onChange={e => {
                      updateField('galleryLayout', e.target.value);
                      saveField('galleryLayout', e.target.value, siteContent);
                    }}
                  >
                    <option value="bento">Classic Bento Box</option>
                    <option value="parallax">Parallax Storyboard</option>
                  </select>
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

            {/* 🧵 HOMEPAGE SECTION COPY — every string here previously lived hardcoded in
                PremiumHome.jsx, requiring a developer for even a one-word wording change.
                Ordered top-to-bottom exactly as they appear on the page. */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <SectionHeader icon={FileText} title="Homepage Copy" colorClass="text-amber-500" subtitle="In page order, top to bottom" />
                <div className="space-y-6">
                    {[
                        { id: 'loaderEyebrow', label: 'Loading Screen — Eyebrow', placeholder: 'e.g. Ghanaian Heritage House' },
                        { id: 'loaderTagline', label: 'Loading Screen — Tagline', placeholder: 'e.g. Weaving your story' },
                        { id: 'heroEyebrow', label: 'Hero — Eyebrow', placeholder: 'e.g. KenteHaul / Ghanaian Heritage House' },
                        { id: 'homeCollectionsEyebrow', label: 'Collections — Eyebrow', placeholder: 'e.g. Shop by collection' },
                        { id: 'homeCollectionsHeadline', label: 'Collections — Headline', placeholder: 'e.g. Heritage categories, edited like a wardrobe.' },
                        { id: 'homeCollectionsBody', label: 'Collections — Body', placeholder: 'Supporting sentence under the headline', textarea: true },
                        { id: 'homeFeaturedEyebrow', label: 'Featured Products — Eyebrow', placeholder: 'e.g. The Kente edit' },
                        { id: 'homeFeaturedHeadline', label: 'Featured Products — Headline', placeholder: 'e.g. Featured pieces with room to breathe.' },
                        { id: 'homeSaleEyebrow', label: 'Sale Pieces — Eyebrow', placeholder: 'e.g. Limited offering' },
                        { id: 'homeSaleHeadline', label: 'Sale Pieces — Headline', placeholder: 'e.g. Current sale pieces, still presented with restraint.' },
                        { id: 'homeCraftEyebrow', label: 'Craft Story — Eyebrow', placeholder: 'e.g. Craftsmanship' },
                        { id: 'homeCraftHeadline', label: 'Craft Story — Headline', placeholder: 'e.g. A quieter page, built around the weight of the cloth.' },
                        { id: 'homeCraftCaption', label: 'Craft Story — Image Caption', placeholder: 'e.g. Pattern, thread, provenance' },
                        { id: 'homeGalleryHeadline', label: 'Gallery — Headline', placeholder: 'e.g. Large moments for texture, drape, and ceremony.' },
                        { id: 'homeTestimonialsHeadline', label: 'Testimonials — Headline', placeholder: 'e.g. Proof in the wearing.' },
                        { id: 'trustLabel0', label: 'Trust Badge 1', placeholder: 'e.g. Authentic Ghanaian craft' },
                        { id: 'trustLabel1', label: 'Trust Badge 2', placeholder: 'e.g. Nationwide delivery options' },
                        { id: 'trustLabel2', label: 'Trust Badge 3', placeholder: 'e.g. Custom and partnership orders' }
                    ].map(field => (
                        <div key={field.id}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                                <SaveIndicator field={field.id} saving={saving} saved={saved} />
                            </div>
                            {field.textarea ? (
                                <textarea
                                    className="w-full p-5 bg-gray-50 border-none rounded-[25px] h-28 font-medium text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300 resize-none"
                                    value={siteContent[field.id] || ''}
                                    placeholder={field.placeholder}
                                    onChange={e => updateField(field.id, e.target.value)}
                                    onBlur={e => saveField(field.id, e.target.value, siteContent)}
                                />
                            ) : (
                                <input
                                    className="w-full p-5 bg-gray-50 border-none rounded-[25px] font-bold outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
                                    value={siteContent[field.id] || ''}
                                    placeholder={field.placeholder}
                                    onChange={e => updateField(field.id, e.target.value)}
                                    onBlur={e => saveField(field.id, e.target.value, siteContent)}
                                />
                            )}
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

                    {/* Heritage Page Images */}
                    <div className="pt-10 border-t border-gray-100 space-y-8">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Heritage Page Images</label>

                        {/* Hero Image */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Heritage Hero Image</label>
                                <SaveIndicator field="heritageHeroImage" saving={saving} saved={saved} />
                            </div>
                            <ImageUpload
                                image={siteContent?.heritageHeroImage}
                                onUpload={img => handleImageUpload('heritageHeroImage', img)}
                                label="Upload Heritage Hero"
                                height="h-48"
                                primaryColor={siteContent?.primaryColor}
                            />
                        </div>

                        {/* Craft Section Image (Home page) */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Craftsmanship Section Image</label>
                                <SaveIndicator field="craftImage" saving={saving} saved={saved} />
                            </div>
                            <p className="text-[10px] text-gray-400 mb-3">The photo shown in the Craftsmanship section on the homepage. Use a Kente weaver / loom photo.</p>
                            <ImageUpload
                                image={siteContent?.craftImage}
                                onUpload={img => handleImageUpload('craftImage', img)}
                                label="Upload Craft Photo"
                                height="h-56"
                                primaryColor={siteContent?.primaryColor}
                            />
                        </div>

                        {/* Weaving Slideshow Images */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Kente Weaving Process Slides (Heritage Page)</label>
                            <p className="text-[10px] text-gray-400 mb-6">5 photos telling the story of how Kente is made — from thread to finished cloth. Each is optional; defaults are used if empty.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { field: 'weavingSlide1', label: 'Step 1 — The Thread Begins' },
                                    { field: 'weavingSlide2', label: 'Step 2 — Building the Loom' },
                                    { field: 'weavingSlide3', label: 'Step 3 — Hands at the Shuttle' },
                                    { field: 'weavingSlide4', label: 'Step 4 — The Pattern Emerges' },
                                    { field: 'weavingSlide5', label: 'Step 5 — The Finished Cloth' },
                                ].map(({ field, label }) => (
                                    <div key={field}>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
                                            <SaveIndicator field={field} saving={saving} saved={saved} />
                                        </div>
                                        <ImageUpload
                                            image={siteContent?.[field]}
                                            onUpload={img => handleImageUpload(field, img)}
                                            label={`Upload ${label}`}
                                            height="h-36"
                                            primaryColor={siteContent?.primaryColor}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Heritage Page Copy */}
                    <div className="pt-10 border-t border-gray-100 space-y-6">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Heritage Page Copy</label>
                        {[
                            { id: 'heritageEyebrow', label: 'Hero Eyebrow', placeholder: 'e.g. Ghanaian Heritage House' },
                            { id: 'heritageStoryEyebrow', label: 'Story Section Eyebrow', placeholder: 'e.g. Our Story' },
                            { id: 'heritageColorsEyebrow', label: 'Color Meanings Eyebrow', placeholder: 'e.g. A Language in Color' },
                            { id: 'heritageColorsHeadline', label: 'Color Meanings Headline', placeholder: 'e.g. Every Thread Carries Meaning' },
                        ].map(f => (
                            <div key={f.id}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f.label}</label>
                                    <SaveIndicator field={f.id} saving={saving} saved={saved} />
                                </div>
                                <input className="w-full p-5 bg-gray-50 border-none rounded-[25px] font-bold outline-none focus:ring-2 focus:ring-amber-100 placeholder:text-gray-300"
                                    value={siteContent?.[f.id] || ''} placeholder={f.placeholder}
                                    onChange={e => updateField(f.id, e.target.value)} onBlur={e => saveField(f.id, e.target.value, siteContent)} />
                            </div>
                        ))}
                    </div>

                    {/* Weaving Step Titles & Captions */}
                    <div className="pt-10 border-t border-gray-100 space-y-8">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Weaving Process Steps — Titles & Captions</label>
                        {[
                            { i: 0, defaultTitle: 'The Thread Begins' },
                            { i: 1, defaultTitle: 'Building the Loom' },
                            { i: 2, defaultTitle: 'Hands at the Shuttle' },
                            { i: 3, defaultTitle: 'The Pattern Emerges' },
                            { i: 4, defaultTitle: 'The Finished Cloth' },
                        ].map(({ i, defaultTitle }) => (
                            <div key={i} className="space-y-3 p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step {i + 1} — {defaultTitle}</p>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] text-gray-400 font-bold">Title</label>
                                        <SaveIndicator field={`weavingTitle${i}`} saving={saving} saved={saved} />
                                    </div>
                                    <input className="w-full p-3 bg-white border-none rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-100 placeholder:text-gray-300"
                                        value={siteContent?.[`weavingTitle${i}`] || ''} placeholder={defaultTitle}
                                        onChange={e => updateField(`weavingTitle${i}`, e.target.value)} onBlur={e => saveField(`weavingTitle${i}`, e.target.value, siteContent)} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] text-gray-400 font-bold">Caption</label>
                                        <SaveIndicator field={`weavingCaption${i}`} saving={saving} saved={saved} />
                                    </div>
                                    <textarea className="w-full p-3 bg-white border-none rounded-xl font-medium text-sm leading-relaxed outline-none focus:ring-2 focus:ring-amber-100 resize-none h-20 placeholder:text-gray-300"
                                        value={siteContent?.[`weavingCaption${i}`] || ''} placeholder="Caption text…"
                                        onChange={e => updateField(`weavingCaption${i}`, e.target.value)} onBlur={e => saveField(`weavingCaption${i}`, e.target.value, siteContent)} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Collection Cards Copy */}
                    <div className="pt-10 border-t border-gray-100 space-y-8">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Homepage Collection Cards</label>
                        {[
                            { i: 0, name: 'Kente Cloth' },
                            { i: 1, name: 'Smocks' },
                            { i: 2, name: 'Sashes' },
                            { i: 3, name: 'Corporate Wears' },
                        ].map(({ i, name }) => (
                            <div key={i} className="space-y-3 p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{name}</p>
                                {[
                                    { key: `collectionTitle${i}`, label: 'Card Title', placeholder: name },
                                    { key: `collectionLabel${i}`, label: 'Label Tag', placeholder: 'e.g. Royal woven cloth' },
                                    { key: `collectionCopy${i}`, label: 'Description', placeholder: 'Card copy…' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] text-gray-400 font-bold">{f.label}</label>
                                            <SaveIndicator field={f.key} saving={saving} saved={saved} />
                                        </div>
                                        <input className="w-full p-3 bg-white border-none rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-100 placeholder:text-gray-300"
                                            value={siteContent?.[f.key] || ''} placeholder={f.placeholder}
                                            onChange={e => updateField(f.key, e.target.value)} onBlur={e => saveField(f.key, e.target.value, siteContent)} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Craft Steps Copy */}
                    <div className="pt-10 border-t border-gray-100 space-y-8">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Craftsmanship Section Cards</label>
                        {[
                            { i: 0, name: 'Color Carries Meaning' },
                            { i: 1, name: 'The Cloth Stays Large' },
                            { i: 2, name: 'Ownership Feels Direct' },
                        ].map(({ i, name }) => (
                            <div key={i} className="space-y-3 p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Card {i + 1}</p>
                                {[
                                    { key: `craftStep${i}Title`, label: 'Title', placeholder: name },
                                    { key: `craftStep${i}Body`, label: 'Body', placeholder: 'Card description…' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] text-gray-400 font-bold">{f.label}</label>
                                            <SaveIndicator field={f.key} saving={saving} saved={saved} />
                                        </div>
                                        <input className="w-full p-3 bg-white border-none rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-100 placeholder:text-gray-300"
                                            value={siteContent?.[f.key] || ''} placeholder={f.placeholder}
                                            onChange={e => updateField(f.key, e.target.value)} onBlur={e => saveField(f.key, e.target.value, siteContent)} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Institute Page Copy */}
                    <div className="pt-10 border-t border-gray-100 space-y-6">
                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Institute Page Copy</label>
                        {[
                            { id: 'instituteEyebrow', label: 'Hero Eyebrow', placeholder: 'e.g. Weaving Community & Culture' },
                            { id: 'statValue0', label: 'Stat 1 — Value', placeholder: 'e.g. 200+' },
                            { id: 'statLabel0', label: 'Stat 1 — Label', placeholder: 'e.g. Artisans Supported' },
                            { id: 'statValue1', label: 'Stat 2 — Value', placeholder: 'e.g. 5+' },
                            { id: 'statLabel1', label: 'Stat 2 — Label', placeholder: 'e.g. Regions of Ghana' },
                            { id: 'statValue2', label: 'Stat 3 — Value', placeholder: 'e.g. 100%' },
                            { id: 'statLabel2', label: 'Stat 3 — Label', placeholder: 'e.g. Handwoven & Authentic' },
                            { id: 'partnerTag', label: 'Partner Section Tag', placeholder: 'e.g. Collaborate' },
                        ].map(f => (
                            <div key={f.id}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f.label}</label>
                                    <SaveIndicator field={f.id} saving={saving} saved={saved} />
                                </div>
                                <input className="w-full p-5 bg-gray-50 border-none rounded-[25px] font-bold outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
                                    value={siteContent?.[f.id] || ''} placeholder={f.placeholder}
                                    onChange={e => updateField(f.id, e.target.value)} onBlur={e => saveField(f.id, e.target.value, siteContent)} />
                            </div>
                        ))}
                    </div>

                    {/* Contact Page Copy */}
                    <div className="pt-10 border-t border-gray-100 space-y-6">
                        <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">Contact Page Copy</label>
                        {[
                            { id: 'contactEyebrow', label: 'Page Eyebrow', placeholder: 'e.g. Connect With Royalty' },
                            { id: 'contactHeadline', label: 'Page Headline', placeholder: 'e.g. Get in Touch' },
                            { id: 'contactSubheadline', label: 'Page Sub-headline', placeholder: 'e.g. Your journey into heritage begins…' },
                            { id: 'tiktokLink', label: 'TikTok URL', placeholder: 'https://tiktok.com/@kentehaul' },
                        ].map(f => (
                            <div key={f.id}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f.label}</label>
                                    <SaveIndicator field={f.id} saving={saving} saved={saved} />
                                </div>
                                <input className="w-full p-5 bg-gray-50 border-none rounded-[25px] font-bold outline-none focus:ring-2 focus:ring-teal-100 placeholder:text-gray-300"
                                    value={siteContent?.[f.id] || ''} placeholder={f.placeholder}
                                    onChange={e => updateField(f.id, e.target.value)} onBlur={e => saveField(f.id, e.target.value, siteContent)} />
                            </div>
                        ))}
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

            {/* ⚡ INTEGRATIONS & API KEYS */}
            <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-xl border border-gray-100">
                <SectionHeader icon={Zap} title="Integrations & API Keys" colorClass="text-violet-500" />
                <div className="p-5 bg-violet-50 rounded-[24px] border border-violet-100 mb-8">
                    <p className="text-[11px] font-bold text-violet-700 leading-relaxed">
                        API keys are stored securely in a private Firestore document — never in client code or the public bundle.
                        These keys are only readable by the admin account.
                    </p>
                </div>

                {/* Kwik Delivery */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Key size={12} /> Kwik Delivery API Key
                        </label>
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black">
                            {savingPrivate.kwikApiKey && <RefreshCw size={10} className="animate-spin text-blue-500" />}
                            {savedPrivate.kwikApiKey && !savingPrivate.kwikApiKey && (
                                <>
                                    <CheckCircle size={10} className="text-green-500" />
                                    <span className="text-green-500 uppercase tracking-widest">Saved & LIVE</span>
                                </>
                            )}
                        </span>
                    </div>
                    <input
                        type="password"
                        className="w-full p-4 bg-gray-950 text-green-400 rounded-2xl font-mono text-xs outline-none tracking-widest"
                        placeholder="Paste your Kwik API key here..."
                        value={privateSettings.kwikApiKey || ''}
                        onChange={e => setPrivateSettings(prev => ({ ...prev, kwikApiKey: e.target.value }))}
                        onBlur={e => savePrivateField('kwikApiKey', e.target.value)}
                    />
                    <p className="text-[10px] text-gray-400 font-bold ml-1">
                        Sign up at kwikdelivery.com → Dashboard → API Keys. Required for "Book Rider via Kwik" in order management.
                    </p>
                </div>

                {/* Arkesel SMS */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 flex items-center gap-2">
                        <Key size={12} /> Arkesel API Key (SMS)
                        {savingPrivate.arkeselApiKey && <RefreshCw size={10} className="animate-spin text-blue-500" />}
                        {savedPrivate.arkeselApiKey && !savingPrivate.arkeselApiKey && (
                            <span className="text-[9px] text-green-500 font-black">SAVED</span>
                        )}
                    </label>
                    <input
                        type="password"
                        placeholder="Arkesel API key"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-violet-500/20"
                        value={privateSettings.arkeselApiKey || ''}
                        onChange={e => setPrivateSettings(prev => ({ ...prev, arkeselApiKey: e.target.value }))}
                        onBlur={e => savePrivateField('arkeselApiKey', e.target.value)}
                    />
                    <p className="text-[10px] text-gray-400 font-bold ml-1">
                        Get from arkesel.com → API Settings. Enables SMS order confirmations and status updates.
                    </p>
                </div>

                {/* Admin Phone for SMS alerts */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 flex items-center gap-2">
                        <Key size={12} /> Admin Phone (for SMS order alerts)
                        {savingPrivate.adminPhone && <RefreshCw size={10} className="animate-spin text-blue-500" />}
                        {savedPrivate.adminPhone && !savingPrivate.adminPhone && (
                            <span className="text-[9px] text-green-500 font-black">SAVED</span>
                        )}
                    </label>
                    <input
                        type="tel"
                        placeholder="+233540000000"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-violet-500/20"
                        value={privateSettings.adminPhone || ''}
                        onChange={e => setPrivateSettings(prev => ({ ...prev, adminPhone: e.target.value }))}
                        onBlur={e => savePrivateField('adminPhone', e.target.value)}
                    />
                    <p className="text-[10px] text-gray-400 font-bold ml-1">
                        Store owner phone to receive an SMS for every new order (E.164 format: +233...).
                    </p>
                </div>
            </div>
        </div>
    );
}
