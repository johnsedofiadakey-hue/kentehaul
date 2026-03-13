import React, { useRef } from 'react';
import { X, Printer, Download, Share2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function InvoiceModal({ isOpen, onClose, order, siteContent }) {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef, // Updated for latest version compatibility
    content: () => componentRef.current, // Fallback for older versions
    documentTitle: order ? `Invoice-${order.id}` : 'Invoice',
  });

  if (!isOpen || !order) return null;

  // Logic: If status is 'Paid' or 'Delivered', it's a RECEIPT. Otherwise, INVOICE.
  const isPaid = ['Paid', 'Delivered', 'Shipped'].includes(order.status);
  const docType = isPaid ? "OFFICIAL RECEIPT" : "PAYMENT BILL";
  const docColor = isPaid ? "#22c55e" : siteContent.primaryColor || "#000";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${order.id} - KenteHaul`,
          text: `Invoice ${order.id} for ${order.total}. Status: ${order.status}`,
          url: window.location.origin,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      alert("Sharing not supported on this browser.");
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-md overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-5xl h-full md:h-auto md:max-h-[96vh] md:rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-fade-in relative ring-1 ring-white/20">

        {/* --- UI HEADER (Browser Controls) --- */}
        <div className="bg-gray-900 text-white p-5 md:p-6 flex justify-between items-center shrink-0 border-b border-white/5 relative z-[310] no-print">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Printer size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm md:text-base leading-none tracking-tight">Business Invoice</h2>
              <p className="text-[10px] text-gray-400 mt-1.5 uppercase font-bold tracking-widest leading-none opacity-60">A4 Document Preview</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-95 text-blue-400 border border-white/5"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2.5 px-6 py-3 bg-white text-black hover:bg-gray-100 rounded-2xl transition-all active:scale-95 text-xs font-black uppercase tracking-widest shadow-xl"
            >
              <Printer size={16} /> <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-95 border border-red-500/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* --- PRINTABLE DOCUMENT AREA --- */}
        <div className="flex-1 overflow-auto bg-[#f8fafc] p-2 md:p-12 flex justify-center custom-scrollbar relative">
          <style>
            {`
              @page {
                size: A4;
                margin: 0;
              }

              @media print {
                html, body {
                  width: 210mm;
                  height: 297mm;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print { display: none !important; }
                .invoice-container { 
                  box-shadow: none !important; 
                  margin: 0 !important; 
                  width: 210mm !important; 
                  height: 297mm !important;
                  max-height: 297mm !important;
                  min-width: 210mm !important;
                  overflow: hidden !important;
                  background: white !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  padding: 15mm !important;
                }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                table, tr, td, th { page-break-inside: avoid !important; }
              }
            `}
          </style>

          <div
            ref={componentRef}
            className="invoice-container bg-white shadow-2xl mx-auto origin-top transition-all"
            style={{
              width: '210mm',
              height: '297mm',
              padding: '15mm',
              boxSizing: 'border-box',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transform: `scale(${isMobile ? 0.38 : 1})`,
              fontFamily: "'Inter', sans-serif",
              backgroundColor: 'white',
              color: '#1e293b'
            }}
          >
            {/* 1. CORPORATE HEADER */}
            <div className="w-full">
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-6">
                  {siteContent.logo ? (
                    <img src={siteContent.logo} alt="Logo" className="h-[70px] w-auto object-contain" />
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-2xl" style={{ backgroundColor: siteContent.primaryColor }}>K</div>
                      <h1 className="text-3xl font-black tracking-tighter text-gray-900">{siteContent.title}</h1>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[12px] font-black uppercase tracking-[3px] text-gray-400">Merchant Services</p>
                    <div className="text-sm font-bold text-gray-500 leading-relaxed">
                      Accra Digital Hub, Ghana<br />
                      {siteContent.contactPhone || '+233 24 000 0000'}<br />
                      {siteContent.contactEmail || 'admin@kentehaul.com'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-6xl font-black tracking-[10px] uppercase text-gray-100 absolute -right-2 top-10 pointer-events-none select-none">INVOICE</h2>
                  <div className="relative pt-8 space-y-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Invoice Number</span>
                      <span className="text-3xl font-black text-gray-950 tracking-tighter uppercase">#KH-{order.id}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Issue Date</span>
                      <span className="text-md font-bold text-gray-700">{order.date}</span>
                    </div>
                    <div className="inline-block mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2" style={{ borderColor: siteContent.primaryColor + '40', color: siteContent.primaryColor, backgroundColor: siteContent.primaryColor + '05' }}>
                      Payment {order.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. BILLING GRID (2-COLUMN) */}
              <div className="grid grid-cols-2 gap-24 mb-16">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-[2px] border-b-2 pb-2 inline-block">Billed To</h4>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-gray-950 tracking-tight">{order.customer?.name || 'Authorized Client'}</p>
                    <p className="text-sm font-medium text-gray-500 mt-2 leading-relaxed">
                      {order.customer?.address || 'Default Delivery Zone'}<br />
                      {order.customer?.phone}<br />
                      {order.customer?.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-[2px] border-b-2 pb-2 inline-block">Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Method</span>
                      <span className="text-sm font-bold text-gray-800">{order.method || 'Processing'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Reference</span>
                      <span className="text-sm font-bold text-gray-800">TXN-{order.id.toString().slice(-4)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Terms</span>
                      <span className="text-sm font-bold text-gray-800">Due on receipt</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Currency</span>
                      <span className="text-sm font-bold text-gray-800">GHS (₵)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CORPORATE LINE ITEMS TABLE */}
              <div className="w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-[3px]" style={{ borderColor: siteContent.primaryColor }}>
                      <th className="py-4 text-left text-[11px] font-black uppercase tracking-[2.5px] text-gray-900 pr-8">Product Description</th>
                      <th className="py-4 text-center text-[11px] font-black uppercase tracking-[2.5px] text-gray-900 w-24">Qty</th>
                      <th className="py-4 text-right text-[11px] font-black uppercase tracking-[2.5px] text-gray-900 w-32">Unit Price</th>
                      <th className="py-4 text-right text-[11px] font-black uppercase tracking-[2.5px] text-gray-900 w-40">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items?.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="py-6 pr-8">
                          <p className="font-extrabold text-gray-900 text-[15px] leading-tight mb-1">{item.name}</p>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</span>
                        </td>
                        <td className="py-6 text-center font-bold text-gray-600 text-sm">{item.quantity}</td>
                        <td className="py-6 text-right font-bold text-gray-600 text-sm font-mono">₵{item.price.toFixed(2)}</td>
                        <td className="py-6 text-right font-black text-gray-950 text-[15px] font-mono tracking-tight">₵{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. TOTALS & NOTES (Sticks to Bottom) */}
            <div className="w-full mt-auto">
              <div className="flex justify-between items-start gap-12 pt-12 border-t-2 border-gray-100">
                {/* Terms / Notes Block (Max 45%) */}
                <div className="max-w-[45%] space-y-4">
                  <div className="p-6 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: siteContent.primaryColor }} />
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 flex items-center gap-2">
                      Terms & Authorization
                    </h4>
                    <p className="text-[10px] leading-relaxed text-gray-500 font-medium">
                      This document serves as an official business record for the transaction between {siteContent.title} and the billed party. By processing this invoice, you acknowledge receipt of heritage quality goods. Any disputes must be raised within 48 hours.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 no-print opacity-30 group h-8">
                    <Share2 size={12} className="group-hover:text-blue-500 transition-colors" />
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-[3px] group-hover:text-gray-500 transition-colors">Digital Verification KH-2026</span>
                  </div>
                </div>

                {/* Corporate Totals Section (Right Aligned) */}
                <div className="w-72 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-4">
                    <span className="uppercase tracking-widest">Subtotal</span>
                    <span className="text-gray-900 font-mono">₵{(order.total - (order.shippingFee || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-4">
                    <span className="uppercase tracking-widest">Tax (0%)</span>
                    <span className="text-gray-900 font-mono">₵0.00</span>
                  </div>
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-4">
                      <span className="uppercase tracking-widest">Delivery</span>
                      <span className="text-gray-900 font-mono">₵{order.shippingFee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="mt-6 p-6 rounded-[24px] shadow-2xl shadow-gray-200/50 flex flex-col items-end gap-1 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${siteContent.primaryColor}08, ${siteContent.primaryColor}15)` }}>
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5" style={{ backgroundColor: siteContent.primaryColor }} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[4px] mb-1">Total Amount Due</span>
                    <span className="text-4xl font-black tracking-tighter" style={{ color: siteContent.primaryColor }}>
                      ₵{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. PROFESSIONAL FOOTER */}
              <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center bg-[#fafafa]/50 -mx-[15mm] px-[15mm] py-8">
                <div className="space-y-1">
                  <p className="text-[12px] font-black text-gray-950 tracking-wide uppercase">{siteContent.title} Heritage Platform</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Authorized Distributor of Authentic West African Kente</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-gray-950/5 rounded-lg border border-gray-200" />
                    <div className="w-8 h-8 bg-gray-950/5 rounded-lg border border-gray-200" />
                  </div>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Electronic Verified Original</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}