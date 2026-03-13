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

  const iMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

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
              <h2 className="font-extrabold text-sm md:text-base leading-none tracking-tight uppercase">Corporate Document</h2>
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
              <Printer size={16} /> <span className="hidden sm:inline">Print / Save PDF</span>
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
        <div className="flex-1 overflow-auto bg-[#f0f2f5] p-2 md:p-12 flex justify-center custom-scrollbar relative">
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
              transform: `scale(${iMobile ? 0.38 : 1})`,
              fontFamily: "'Inter', sans-serif",
              backgroundColor: 'white',
              color: '#1e293b'
            }}
          >
            {/* 1. CORPORATE GRID HEADER */}
            <div className="w-full">
              <div className="grid grid-cols-[1fr_auto] gap-8 mb-12 items-start">
                <div className="space-y-6">
                  {siteContent.logo ? (
                    <img src={siteContent.logo} alt="Logo" className="h-[75px] w-auto object-contain" />
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-2xl shadow-lg" style={{ backgroundColor: siteContent.primaryColor }}>K</div>
                      <h1 className="text-3xl font-black tracking-tighter text-gray-950 uppercase">{siteContent.title}</h1>
                    </div>
                  )}
                  <div className="space-y-1 text-sm font-medium text-gray-500 leading-relaxed max-w-[320px]">
                    <p className="font-black text-gray-950 uppercase tracking-widest text-[10px] mb-1">Our Headquarters</p>
                    <p>Accra Digital Hub, Box 404</p>
                    <p>Greater Accra Region, Ghana</p>
                    <p className="mt-2 text-gray-900 font-bold">{siteContent.contactPhone || '+233 24 555 0000'}</p>
                    <p className="text-gray-900 font-bold">{siteContent.contactEmail || 'office@kentehaul.com'}</p>
                  </div>
                </div>

                <div className="text-right space-y-4">
                  <h2 className="text-5xl font-black tracking-tighter text-gray-950 uppercase leading-none mb-2">Invoice</h2>
                  <div className="space-y-1">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Number</span>
                      <span className="text-xl font-bold text-gray-950 tracking-tight">#INV-{order.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div className="flex flex-col items-end pt-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date of Issue</span>
                      <span className="text-sm font-bold text-gray-800">{order.date}</span>
                    </div>
                    <div className="pt-4">
                      <span className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[2px] border-2"
                        style={{
                          borderColor: order.status === 'Paid' ? '#22c55e' : siteContent.primaryColor + '40',
                          backgroundColor: order.status === 'Paid' ? '#f0fdf4' : siteContent.primaryColor + '05',
                          color: order.status === 'Paid' ? '#166534' : siteContent.primaryColor
                        }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SHIP / BILL SPLIT GRID */}
              <div className="grid grid-cols-2 gap-24 mb-16 border-t border-b border-gray-100 py-10">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-[3px]">Billed To</h4>
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-gray-950 tracking-tight">{order.customer?.name || 'Valued Client'}</p>
                    <div className="text-sm font-medium text-gray-500 space-y-0.5 pt-2 leading-relaxed">
                      <p>{order.customer?.address || 'Global Fulfillment Zone'}</p>
                      <p>Phone: {order.customer?.phone}</p>
                      <p>Email: {order.customer?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-[3px]">Payment Summary</h4>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Gateway Method</span>
                      <span className="text-sm font-bold text-gray-900">{order.method || 'Processing'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Audit Ref</span>
                      <span className="text-sm font-bold text-gray-900">REF-{order.id.toString().slice(-4)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Base Currency</span>
                      <span className="text-sm font-bold text-gray-900">GHS (₵)</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Due Date</span>
                      <span className="text-sm font-bold text-gray-900">On Receipt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. FULL-WIDTH MODERN TABLE */}
              <div className="w-full overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: siteContent.primaryColor }}>
                      <th className="py-4 px-6 text-left text-[11px] font-black uppercase tracking-[2px] text-white">Item Description</th>
                      <th className="py-4 px-6 text-center text-[11px] font-black uppercase tracking-[2px] text-white w-24">Qty</th>
                      <th className="py-4 px-6 text-right text-[11px] font-black uppercase tracking-[2px] text-white w-40">Unit Price</th>
                      <th className="py-4 px-6 text-right text-[11px] font-black uppercase tracking-[2px] text-white w-48">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items?.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? "bg-[#fafafa]" : "bg-white"}>
                        <td className="py-6 px-6">
                          <p className="font-black text-gray-950 text-base leading-tight">{item.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{item.category}</p>
                        </td>
                        <td className="py-6 px-6 text-center font-bold text-gray-700 text-sm">{item.quantity}</td>
                        <td className="py-6 px-6 text-right font-bold text-gray-700 text-sm font-mono whitespace-nowrap">₵{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-6 px-6 text-right font-black text-gray-950 text-base font-mono tracking-tight whitespace-nowrap">₵{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. TOTALS & TERMS SPLIT GRID */}
            <div className="w-full mt-auto">
              <div className="grid grid-cols-[1fr_320px] gap-12 pt-12 items-end">
                {/* Notes (Left) */}
                <div className="space-y-6">
                  <div className="p-6 bg-[#fafafa] rounded-[24px] border-2 border-dashed border-gray-100 relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-full" style={{ backgroundColor: siteContent.primaryColor }} />
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[3px] mb-3">Document Terms</h4>
                    <p className="text-[10px] leading-relaxed text-gray-500 font-medium italic">
                      By accepting this invoice, you agree to the heritage quality guarantee of {siteContent.title}. Any inquiries regarding this transaction must be sent to our support desk within 48 hours for authorized review. This is an official digital record.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 opacity-30 no-print">
                    <Share2 size={12} />
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-[4px]">Verified Authentic Transaction #2026-KH</span>
                  </div>
                </div>

                {/* Right Aligned Totals */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-4">
                    <span className="uppercase tracking-[2px]">Subtotal</span>
                    <span className="text-gray-950 font-mono">₵{(order.total - (order.shippingFee || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-4">
                    <span className="uppercase tracking-[2px]">VAT (0.00%)</span>
                    <span className="text-gray-950 font-mono">₵0.00</span>
                  </div>
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-4">
                      <span className="uppercase tracking-[2px]">Logistics</span>
                      <span className="text-gray-950 font-mono">₵{order.shippingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="mt-8 p-8 rounded-[32px] shadow-2xl shadow-gray-200/50 flex flex-col items-end gap-1 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${siteContent.primaryColor}08, ${siteContent.primaryColor}15)` }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-5 rounded-full -translate-y-12 translate-x-12" style={{ color: siteContent.primaryColor }} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[4px] mb-1">Total Due</span>
                    <div className="flex items-baseline gap-1" style={{ color: siteContent.primaryColor }}>
                      <span className="text-xl font-bold opacity-40">₵</span>
                      <span className="text-5xl font-black tracking-tighter leading-none">
                        {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. PROFESSIONAL FOOTER (Pinned to Bottom) */}
              <div className="mt-16 pt-10 border-t border-gray-100 flex justify-between items-end">
                <div className="space-y-1.5">
                  <p className="text-[13px] font-black text-gray-950 tracking-wide uppercase">{siteContent.title} Digital Ecosystem</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[4px]">Approved by Heritage Board — Document Audit Grade A</p>
                </div>
                <div className="text-right flex flex-col items-end gap-3 opacity-30">
                  <div className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center font-black text-[10px] text-gray-300">KH</div>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Global Certified Record</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}