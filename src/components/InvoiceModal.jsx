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

        {/* --- DYNAMIC APP-LIKE HEADER --- */}
        <div className="bg-gray-900 text-white p-5 md:p-6 flex justify-between items-center shrink-0 border-b border-white/5 relative z-[310]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white font-black text-xs">INV</div>
            <div>
              <h2 className="font-extrabold text-sm md:text-base leading-none">Official Invoice</h2>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest leading-none">Order #{order.id}</p>
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
              <Download size={16} /> <span className="hidden sm:inline">Save PDF</span>
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
        <div className="flex-1 overflow-y-auto bg-gray-100/50 p-2 md:p-12 flex justify-center custom-scrollbar relative">
          <style>
            {`
              @media print {
                @page { 
                  size: A4 portrait; 
                  margin: 0 !important; 
                }
                body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
                .invoice-container { 
                  box-shadow: none !important; 
                  margin: 0 !important; 
                  width: 210mm !important; 
                  height: 297mm !important;
                  max-height: 297mm !important;
                  min-width: 210mm !important;
                  padding: 15mm !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                  background: white !important;
                }
                .no-print { display: none !important; }
                .break-avoid { break-inside: avoid; }
                .row-alt:nth-child(even) { background-color: #f9fafb !important; }
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
              transform: `scale(${isMobile ? 0.38 : 1})`,
              fontFamily: "'Inter', system-ui, sans-serif",
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            {/* TOP SECTION: Header & Branding */}
            <div className="space-y-8">
              <div className="flex justify-between items-start border-b-2 pb-8" style={{ borderColor: siteContent.primaryColor + '20' }}>
                <div className="space-y-4">
                  {siteContent.logo ? (
                    <img src={siteContent.logo} alt="Logo" className="h-16 w-auto object-contain" />
                  ) : (
                    <h1 className="text-3xl font-black tracking-tighter" style={{ color: siteContent.primaryColor }}>
                      {siteContent.title}
                    </h1>
                  )}
                  <div className="space-y-1">
                    <p className="text-[12px] font-black uppercase tracking-widest text-gray-400">Authorized Merchant</p>
                    <p className="text-sm font-bold text-gray-600 max-w-[250px] leading-relaxed">
                      {order.customer?.address || 'Digital Order'}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <h2 className="text-5xl font-black tracking-tighter opacity-10 absolute right-12 top-12 pointer-events-none uppercase">{docType}</h2>
                  <div className="space-y-1 pt-4">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Receipt Number</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">#{order.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Date Issued</p>
                    <p className="text-sm font-bold text-gray-700">{order.date}</p>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-12 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Customer Information
                  </h4>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-gray-900">{order.customer?.name || 'Guest'}</p>
                    <p className="text-sm font-medium text-gray-500">{order.customer?.email}</p>
                    <p className="text-sm font-medium text-gray-500">{order.customer?.phone}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Payment Summary
                  </h4>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-700">Method: <span className="text-gray-900">{order.method || 'Processing'}</span></p>
                    <p className="text-sm font-bold text-gray-700">Status:
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 uppercase font-black tracking-wider">
                        {order.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-grow">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-900">Description</th>
                      <th className="py-4 text-center text-[11px] font-black uppercase tracking-widest text-gray-900">Qty</th>
                      <th className="py-4 text-right text-[11px] font-black uppercase tracking-widest text-gray-900">Unit Price</th>
                      <th className="py-4 text-right text-[11px] font-black uppercase tracking-widest text-gray-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items?.map((item, idx) => (
                      <tr key={idx} className="row-alt group">
                        <td className="py-5">
                          <p className="font-black text-gray-900">{item.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.category}</p>
                        </td>
                        <td className="py-5 text-center font-bold text-gray-700">{item.quantity}</td>
                        <td className="py-5 text-right font-bold text-gray-700">₵{item.price.toFixed(2)}</td>
                        <td className="py-5 text-right font-black text-gray-900">₵{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOTTOM SECTION: Totals & Footer */}
            <div className="space-y-8 pt-8 border-t border-gray-100 break-avoid">
              <div className="flex justify-between items-start gap-12">
                <div className="flex-1 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Notes & Policy</h4>
                    <p className="text-[10px] leading-relaxed text-gray-500 font-medium">
                      Thank you for choosing {siteContent.title}. This document serves as your official proof of purchase. For returns or support, please quote the receipt number above.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Share2 className="w-4 h-4 text-gray-300 no-print" />
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic no-print">Original Digital Document</p>
                  </div>
                </div>

                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm font-bold text-gray-500">
                    <span>Subtotal</span>
                    <span>₵{(order.total - (order.shippingFee || 0)).toFixed(2)}</span>
                  </div>
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between text-sm font-bold text-gray-500">
                      <span>Delivery Fee</span>
                      <span>₵{order.shippingFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-wider">Total</span>
                    <span className="text-3xl font-black tracking-tighter" style={{ color: siteContent.primaryColor }}>
                      ₵{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                <div className="space-y-1">
                  <p className="text-xs font-black text-gray-900 tracking-tight">{siteContent.title} Heritage</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kente Culture & Innovation</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Scan to Verify</p>
                  <div className="mt-2 w-12 h-12 ml-auto bg-gray-900 rounded-lg flex items-center justify-center p-2 opacity-10">
                    <div className="w-full h-full border-2 border-white/50 border-dashed rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}