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
      className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[95vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">

        {/* --- UI HEADER (Browser Only) --- */}
        <div className="bg-gray-900 text-white p-5 md:p-6 flex justify-between items-center shrink-0 border-b border-white/5 relative z-[310] no-print">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white font-black text-xs">A4</div>
            <div>
              <h2 className="font-extrabold text-sm md:text-base leading-none">Official Invoice</h2>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest leading-none">A4 Precision Print</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 text-blue-400"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-3 bg-white text-black hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-xs font-black uppercase tracking-tight"
            >
              <Download size={16} /> <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* --- PRINTABLE DOCUMENT AREA --- */}
        <div className="flex-1 overflow-auto bg-gray-100/50 p-2 md:p-12 flex justify-center custom-scrollbar relative">
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
                }
                table, tr, td, th {
                  page-break-inside: avoid !important;
                }
              }
            `}
          </style>

          <div
            ref={componentRef}
            className="invoice-container bg-white shadow-2xl mx-auto origin-top transition-transform"
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
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              backgroundColor: 'white'
            }}
          >
            {/* 1. HEADER SECTION (Logo & Identity) */}
            <div className="w-full">
              <div className="flex justify-between items-start mb-8 pb-8 border-b-2" style={{ borderColor: siteContent.primaryColor + '20' }}>
                <div className="space-y-4">
                  {siteContent.logo ? (
                    <img src={siteContent.logo} alt="Logo" className="h-16 w-auto object-contain" />
                  ) : (
                    <h1 className="text-3xl font-black tracking-tighter" style={{ color: siteContent.primaryColor }}>
                      {siteContent.title}
                    </h1>
                  )}
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[2px] text-gray-400">Authentic Kente Hub</p>
                    <p className="text-sm font-bold text-gray-600 max-w-[300px] leading-snug">
                      Ghana's Heritage, Delivered Globally.
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <h2 className="text-4xl font-black tracking-tighter text-gray-900 uppercase leading-none">Invoice</h2>
                  <div className="pt-4 space-y-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Receipt #</span>
                      <span className="text-xl font-black text-gray-950 tracking-tight">KHT-{order.id}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date Issued</span>
                      <span className="text-sm font-bold text-gray-800">{order.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. PARTY INFO (Bill To / Pay Method) */}
              <div className="grid grid-cols-2 gap-12 mb-10">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[1.5px] border-b border-gray-100 pb-1">Billed To</h4>
                  <div className="space-y-0.5">
                    <p className="text-lg font-black text-gray-950">{order.customer?.name || 'Guest Customer'}</p>
                    <p className="text-sm font-medium text-gray-500">{order.customer?.email}</p>
                    <p className="text-sm font-medium text-gray-500">{order.customer?.phone}</p>
                    <p className="text-sm font-bold text-gray-700 mt-2 max-w-[250px] leading-normal">{order.customer?.address || 'Digital Fulfillment'}</p>
                  </div>
                </div>
                <div className="space-y-3 text-right">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[1.5px] border-b border-gray-100 pb-1">Payment & Status</h4>
                  <div className="space-y-2">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Method</span>
                      <span className="text-sm font-black text-gray-950">{order.method || 'Not Specified'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Current Status</span>
                      <span className="mt-1 px-3 py-1 rounded-lg text-[10px] bg-green-50 text-green-700 border border-green-100 uppercase font-black tracking-wider">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ITEMS TABLE */}
              <div className="w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2" style={{ borderColor: siteContent.primaryColor }}>
                      <th className="py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-950" style={{ color: siteContent.primaryColor }}>Product Description</th>
                      <th className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-950" style={{ color: siteContent.primaryColor }}>Qty</th>
                      <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-950" style={{ color: siteContent.primaryColor }}>Price</th>
                      <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-950" style={{ color: siteContent.primaryColor }}>Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.items?.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="py-5 pr-4">
                          <p className="font-black text-gray-950 text-sm leading-tight">{item.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight italic">{item.category}</p>
                        </td>
                        <td className="py-5 text-center font-bold text-gray-700 text-sm">{item.quantity}</td>
                        <td className="py-5 text-right font-bold text-gray-700 text-sm">₵{item.price.toFixed(2)}</td>
                        <td className="py-5 text-right font-black text-gray-950 text-sm">₵{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. TOTALS SECTION (Pinned to Bottom Part 1) */}
            <div className="w-full mt-auto">
              <div className="flex justify-between items-end gap-16 pt-8 border-t-2 border-gray-100">
                {/* Notes & Verification */}
                <div className="flex-1 space-y-4">
                  <div className="p-5 bg-gray-50/80 rounded-2xl border-l-4" style={{ borderColor: siteContent.primaryColor }}>
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5">Official Terms</h4>
                    <p className="text-[10px] leading-relaxed text-gray-600 font-medium">
                      This is a computer-generated document from {siteContent.title}. No signature is required. Please retain this receipt for warranty and heritage verification. Delivery fees are non-refundable.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 no-print">
                    <Share2 size={12} className="text-gray-300" />
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Verify Authenticity Online</span>
                  </div>
                </div>

                {/* Subtotals & Grand Total */}
                <div className="w-64 space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-gray-500 px-2">
                    <span>Subtotal</span>
                    <span>₵{(order.total - (order.shippingFee || 0)).toFixed(2)}</span>
                  </div>
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between text-xs font-bold text-gray-500 px-2">
                      <span>Shipping Fee</span>
                      <span>₵{order.shippingFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="py-5 px-6 rounded-2xl flex flex-col items-end gap-1 shadow-sm" style={{ backgroundColor: '#f5f7fb', borderTop: `3px solid ${siteContent.primaryColor}` }}>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Grand Total Paid</span>
                    <span className="text-3xl font-black tracking-tighter" style={{ color: siteContent.primaryColor }}>
                      ₵{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. FOOTER SECTION (Pinned to Bottom Part 2) */}
              <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs font-black text-gray-950 tracking-tight">{siteContent.title} Heritage System</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Kente Culture & Weaver Guild Approved</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="w-10 h-10 bg-gray-950/5 rounded-lg flex items-center justify-center p-2">
                    <div className="w-full h-full border border-gray-300 border-dashed rounded-sm opacity-50" />
                  </div>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-[2px]">Valid Global Document</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}