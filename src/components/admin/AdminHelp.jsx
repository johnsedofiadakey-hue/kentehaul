import React, { useState } from 'react';
import {
    HelpCircle, ChevronDown, ChevronRight, Package, Users, Edit, Settings,
    Boxes, Camera, MessageCircle, Truck, BarChart3, Heart, Wrench,
    MessageSquare, Save, MousePointer, AlertCircle, CheckCircle, Zap,
    Store, Eye, FileText, Star
} from 'lucide-react';

const SECTIONS = [
    {
        id: 'how-saving-works',
        icon: Save,
        color: 'bg-blue-50 text-blue-600 border-blue-100',
        badge: 'IMPORTANT',
        badgeColor: 'bg-blue-600 text-white',
        title: 'How saving works — read this first',
        summary: 'Fields save automatically when you click away. Press Enter or Tab to confirm.',
        content: [
            {
                type: 'callout',
                variant: 'blue',
                text: 'Every text field in Settings saves automatically when you click somewhere else on the page (called "blur"). You do NOT need to press a Save button — just click outside the field after typing.'
            },
            {
                type: 'steps',
                items: [
                    { icon: Edit, text: 'Click any text field and type your change.' },
                    { icon: MousePointer, text: 'Click anywhere outside the field (or press Tab or Enter) to confirm.' },
                    { icon: CheckCircle, text: 'A small ✓ checkmark appears next to the field — that means it\'s saved to the live site.' },
                ]
            },
            {
                type: 'callout',
                variant: 'amber',
                text: 'If you close the browser tab or navigate away WITHOUT clicking outside the field first, your last change may not be saved. Always click outside before leaving a page.'
            }
        ]
    },
    {
        id: 'settings',
        icon: Settings,
        color: 'bg-amber-50 text-amber-600 border-amber-100',
        badge: 'SITE COPY',
        badgeColor: 'bg-amber-500 text-white',
        title: 'Settings — edit all public text & colours',
        summary: 'Every word visible on the public website can be changed here.',
        content: [
            {
                type: 'text',
                text: 'The Settings tab is your content management system. Everything you see on the public site — headlines, button labels, colours, social links, prices, and more — is controlled from here.'
            },
            {
                type: 'table',
                rows: [
                    { section: 'Brand & Colors', what: 'Site name, primary/secondary colours, logo image' },
                    { section: 'Loading Screen', what: 'The eyebrow text and tagline shown during the intro video' },
                    { section: 'Homepage Copy', what: 'Hero headline, CTA button text ("Shop the collection"), hero eyebrow, featured section heading, testimonials headline, trust badges' },
                    { section: 'Heritage Page Copy', what: 'Section headings and colour meaning labels on the /heritage page' },
                    { section: 'Collection Cards', what: 'Title, label, and description of each category card on the homepage' },
                    { section: 'Craftsmanship Section', what: 'Step titles and descriptions in the craft story block' },
                    { section: 'Institute Page Copy', what: 'Stats (numbers + labels) and eyebrow text on /institute' },
                    { section: 'Contact Page Copy', what: 'Headline, subheadline, and TikTok link on /contact' },
                    { section: 'Flash Sale', what: 'Sale title, start/end time, teaser text — turn a sale on/off here' },
                    { section: 'Payments', what: 'Paystack public key for card payments' },
                    { section: 'Social & Contact', what: 'WhatsApp number, Instagram, TikTok, and other links' },
                ]
            }
        ]
    },
    {
        id: 'inventory',
        icon: Boxes,
        color: 'bg-green-50 text-green-600 border-green-100',
        badge: null,
        badgeColor: 'bg-green-600 text-white',
        title: 'Inventory — quick stock control',
        summary: 'Use Inventory for stock counts, live/hidden status, and movement history.',
        content: [
            {
                type: 'text',
                text: 'Inventory is intentionally simple. Products are created in Products. Inventory only changes quantity, visibility, and shows the stock ledger.'
            },
            {
                type: 'steps',
                items: [
                    { icon: Package, text: 'QUICK UPDATE — Select a product, enter the stock quantity, choose Live/Hidden/Archived, then save.' },
                    { icon: Store, text: 'STOCK LIST — Scan all products, current stock, price, and shop visibility in one compact list.' },
                    { icon: FileText, text: 'LEDGER — A read-only history of stock movement from sales and manual adjustments.' },
                ]
            },
            {
                type: 'callout',
                variant: 'green',
                text: 'Add photos, names, prices, and descriptions in Products. Use Inventory only when stock or visibility changes.'
            }
        ]
    },
    {
        id: 'products',
        icon: Edit,
        color: 'bg-purple-50 text-purple-600 border-purple-100',
        badge: null,
        title: 'Products — add and edit products',
        summary: 'Create products, upload photos, set price, stock, category, and feature products on the homepage.',
        content: [
            {
                type: 'text',
                text: 'Products is the main place to add new shop items. Fill in the product photo, name, sale price, stock, category, and visibility, then save.'
            },
            {
                type: 'table',
                rows: [
                    { section: 'Add a product', what: 'Use the form at the top of Products. Upload a photo, add name, price, stock, category, then click "Add to Shop".' },
                    { section: 'Edit a product', what: 'Click the pencil icon on any product row. The same form becomes edit mode. Make your changes then click "Sync Updates".' },
                    { section: 'Upload a photo', what: 'Click the image upload area in the form. Drag & drop or browse for a file. The photo saves as part of the product.' },
                    { section: 'Feature on homepage', what: 'Open More Options → toggle "Feature on Homepage". Up to 6 featured products show in the Featured Pieces section.' },
                    { section: 'Flash sale price', what: 'Open More Options → toggle "Include in Flash Sale". The product will appear in the sale section while a Flash Sale is active in Settings.' },
                    { section: 'Status', what: 'Active = live on shop. Draft = hidden. Archived = pulled from sale but kept in records.' },
                    { section: 'Delete', what: 'Red trash icon. This is permanent — archive instead if you might want to restore it later.' },
                ]
            }
        ]
    },
    {
        id: 'orders',
        icon: Package,
        color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        badge: null,
        title: 'Order Management — track & fulfil orders',
        summary: 'View all orders, update their status, and send invoices via WhatsApp.',
        content: [
            {
                type: 'table',
                rows: [
                    { section: 'View an order', what: 'Click on any row to expand the full order details.' },
                    { section: 'Update status', what: 'Change the order status (Pending → Processing → Shipped → Delivered) from the order detail view.' },
                    { section: 'Send invoice', what: 'Click the invoice icon to open the invoice and share it via WhatsApp to the customer.' },
                    { section: 'Create invoice manually', what: 'Use the "Create Invoice" button at the top right for phone orders or custom pieces.' },
                ]
            }
        ]
    },
    {
        id: 'customers',
        icon: Users,
        color: 'bg-rose-50 text-rose-600 border-rose-100',
        badge: null,
        title: 'Customers — CRM & buyer profiles',
        summary: 'See every customer, their order history, and contact them directly.',
        content: [
            {
                type: 'table',
                rows: [
                    { section: 'Customer list', what: 'All customers who have placed an order, sorted by latest activity.' },
                    { section: 'Contact via WhatsApp', what: 'Click the WhatsApp icon on any customer to open a pre-filled WhatsApp message.' },
                    { section: 'Create invoice from CRM', what: 'Click "New Invoice" next to a customer to pre-fill their details on the invoice.' },
                ]
            }
        ]
    },
    {
        id: 'gallery',
        icon: Camera,
        color: 'bg-pink-50 text-pink-600 border-pink-100',
        badge: null,
        title: 'Brand Gallery — manage the homepage photo grid',
        summary: 'Upload, reorder, and caption the photos shown in the gallery section.',
        content: [
            {
                type: 'table',
                rows: [
                    { section: 'Add photo', what: 'Click "Add Photo" and upload an image. Landscape photos (wider than tall) work best.' },
                    { section: 'Caption', what: 'Each photo can have a short caption that appears on hover.' },
                    { section: 'Delete', what: 'Hover over a photo and click the red trash icon.' },
                ]
            }
        ]
    },
    {
        id: 'testimonials',
        icon: MessageCircle,
        color: 'bg-teal-50 text-teal-600 border-teal-100',
        badge: null,
        title: 'Client Stories — manage testimonials',
        summary: 'Add and approve customer reviews shown on the homepage.',
        content: [
            {
                type: 'table',
                rows: [
                    { section: 'Add testimonial', what: 'Fill in the customer name, their quote, and optionally a photo or star rating.' },
                    { section: 'Approve / hide', what: 'Toggle a testimonial visible or hidden from the public homepage.' },
                ]
            }
        ]
    },
    {
        id: 'logistics',
        icon: Truck,
        color: 'bg-orange-50 text-orange-600 border-orange-100',
        badge: null,
        title: 'Delivery & Logistics — set regions and pickup points',
        summary: 'Manage delivery regions, prices, and pickup locations.',
        content: [
            {
                type: 'table',
                rows: [
                    { section: 'Workshop address', what: 'Your main address shown to customers when they pick "pickup" at checkout.' },
                    { section: 'Delivery regions', what: 'Add regions (e.g. Greater Accra) and their delivery fee. Customers choose from these at checkout.' },
                    { section: 'Pickup locations', what: 'Add alternative collection points with a name, address, and optional Google Maps link.' },
                ]
            },
            {
                type: 'callout',
                variant: 'blue',
                text: 'Remember to click outside each field after editing to save it.'
            }
        ]
    },
    {
        id: 'analytics',
        icon: BarChart3,
        color: 'bg-sky-50 text-sky-600 border-sky-100',
        badge: null,
        title: 'Market Insights — analytics overview',
        summary: 'View sales trends, top products, and customer behaviour.',
        content: [
            {
                type: 'text',
                text: 'Market Insights pulls data from your order history to surface trends — best-selling products, revenue by period, and customer return rates. All data is live and updates as new orders come in. No action needed here; it\'s read-only.'
            }
        ]
    }
];

function ContentBlock({ block }) {
    if (block.type === 'text') {
        return <p className="text-sm text-gray-600 leading-relaxed">{block.text}</p>;
    }

    if (block.type === 'callout') {
        const styles = {
            blue: 'bg-blue-50 border-blue-200 text-blue-800',
            amber: 'bg-amber-50 border-amber-200 text-amber-800',
            green: 'bg-green-50 border-green-200 text-green-800',
        };
        return (
            <div className={`flex gap-3 p-4 rounded-2xl border text-sm font-medium ${styles[block.variant]}`}>
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{block.text}</span>
            </div>
        );
    }

    if (block.type === 'steps') {
        return (
            <div className="space-y-3">
                {block.items.map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                        <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                            {i + 1}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-700 font-medium leading-relaxed">{step.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (block.type === 'table') {
        return (
            <div className="overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-1/3">What</th>
                            <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">How</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {block.rows.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                                <td className="p-4 font-black text-gray-800 align-top">{row.section}</td>
                                <td className="p-4 text-gray-600 align-top leading-relaxed">{row.what}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return null;
}

function HelpSection({ section }) {
    const [open, setOpen] = useState(section.id === 'how-saving-works');
    const Icon = section.icon;

    return (
        <div className={`bg-white rounded-[28px] border overflow-hidden transition-all ${open ? 'shadow-lg border-gray-200' : 'border-gray-100 shadow-sm'}`}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-4 p-6 text-left hover:bg-gray-50/50 transition-colors"
            >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${section.color}`}>
                    <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-900">{section.title}</span>
                        {section.badge && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${section.badgeColor}`}>
                                {section.badge}
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-medium text-gray-400 mt-0.5 truncate">{section.summary}</p>
                </div>
                <div className={`flex-shrink-0 text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} />
                </div>
            </button>

            {open && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-5">
                    {section.content.map((block, i) => (
                        <ContentBlock key={i} block={block} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminHelp() {
    return (
        <div className="space-y-6 animate-fade-in-up max-w-4xl">
            {/* Header */}
            <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-[22px] bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <HelpCircle size={26} className="text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Admin Guide</h2>
                    <p className="text-gray-400 font-bold text-sm mt-1">A plain-English walkthrough of every section in this panel. Click any section to expand it.</p>
                </div>
            </div>

            {/* Quick reference bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Edit site text', where: 'Settings', color: 'bg-amber-50 text-amber-700' },
                    { label: 'Add a new product', where: 'Inventory → Intake', color: 'bg-green-50 text-green-700' },
                    { label: 'Show/hide product', where: 'Inventory → Store Visibility', color: 'bg-green-50 text-green-700' },
                    { label: 'Upload photo', where: 'Products → edit pencil', color: 'bg-purple-50 text-purple-700' },
                ].map(q => (
                    <div key={q.label} className={`p-4 rounded-2xl ${q.color}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">To…</p>
                        <p className="font-black text-sm leading-snug">{q.label}</p>
                        <p className="text-xs font-bold mt-1 opacity-70">→ {q.where}</p>
                    </div>
                ))}
            </div>

            {/* Saving tip banner */}
            <div className="flex gap-4 items-center bg-blue-600 text-white p-5 rounded-2xl shadow-lg">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap size={20} />
                </div>
                <div>
                    <p className="font-black text-sm">Quick tip: fields save when you click away</p>
                    <p className="text-blue-100 text-xs font-medium mt-0.5">Type your change → click anywhere outside the box → done. Look for the ✓ to confirm it saved.</p>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-3">
                {SECTIONS.map(s => (
                    <HelpSection key={s.id} section={s} />
                ))}
            </div>

            <p className="text-center text-xs text-gray-300 font-bold pb-4">Need something that isn't here? Contact your developer.</p>
        </div>
    );
}
