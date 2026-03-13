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

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative border border-white/10">

        {/* --- DYNAMIC APP-LIKE HEADER --- */}
        <div className="bg-gray-900 text-white p-5 md:p-6 flex justify-between items-center shrink-0 border-b border-white/5 relative z-[310]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white font-black text-xs">INV</div>
            <div>
              <h2 className="font-extrabold text-sm md:text-base leading-none">View Bill</h2>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest leading-none">Order #{order.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Share Button (Mobile Priority) */}
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
        <div className="flex-1 overflow-y-auto bg-gray-100 p-2 md:p-12 flex justify-center custom-scrollbar relative">
          <style>
            {`
              @media print {
                @page { margin: 15mm; }
                body { -webkit-print-color-adjust: exact; background: white !important; }
                .invoice-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; min-width: auto !important; }
              }
              
              .invoice-container {
                min-width: 800px;
                transform-origin: top center;
              }

              @media (max-width: 768px) {
                /* AUTOMATIC SMART SCALING FOR MOBILE FULL VIEW */
                .invoice-container {
                   transform: scale(0.40); /* Slightly smaller to ensure fit */
                   transform-origin: top center;
                }
                .invoice-scroll-wrapper {
                  width: 100%;
                  display: flex;
                  justify-content: center;
                  margin: 10px auto;
                  min-height: 1000px; /* Compensation for scale */
                }
              }

              @media (max-width: 480px) {
                .invoice-container {
                   transform: scale(0.35);
                   transform-origin: top center;
                }
                 .invoice-scroll-wrapper {
                   min-height: 800px;
                 }
              }
            `}
          </style>

          <div className="invoice-scroll-wrapper shrink-0">
            <div
              ref={componentRef}
              className="invoice-container bg-white shadow-2xl p-10 md:p-16 text-gray-800 relative ring-1 ring-black/5"
            >
              <div className={`absolute top-0 right-0 p-8 font-black text-6xl opacity-5 pointer-events-none rotate-12`} style={{ color: docColor }}>
                {docType}
              </div>

              {/* 1. HEADER */}
              <div className="flex justify-between items-start border-b-2 border-gray-100 pb-10 mb-10">
                <div>
                  {siteContent.logo ? (
                    <img src={siteContent.logo} alt="Logo" className="h-20 w-auto object-contain mb-6" />
                  ) : (
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-black text-2xl" style={{ backgroundColor: docColor }}>K</div>
                      <h1 className="text-3xl font-black tracking-tighter text-gray-900">{siteContent.heroTitle || "KenteHaul"}</h1>
                    </div>
                  )}
                  <div className="text-sm text-gray-500 space-y-1">
                    <p className="font-extrabold text-gray-900 text-lg">{siteContent.heroTitle || "KenteHaul Stores"}</p>
                    <p className="font-medium">Accra, Ghana • Digital Hub</p>
                    <p className="font-medium">{siteContent.contactPhone}</p>
                    <p className="font-medium">{siteContent.contactEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4`} style={{ backgroundColor: `${docColor}15`, color: docColor }}>
                    {order.status}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Bill No.</p>
                      <p className="font-mono font-bold text-2xl text-gray-900 tracking-tighter">#{order.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Date Issued</p>
                      <p className="font-bold text-gray-700">{order.date}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. BILL TO */}
              <div className="mb-14">
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-4">Client Destination</h3>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <p className="font-black text-xl text-gray-900">{order.customer?.name || "Guest Customer"}</p>
                  <p className="text-gray-600 mt-2 font-medium max-w-xs leading-relaxed">{order.customer?.address || "No Address Provided"}</p>
                  <div className="flex gap-4 mt-4 text-sm font-bold text-gray-400">
                    <span>{order.customer?.phone}</span>
                    <span>•</span>
                    <span>{order.customer?.email}</span>
                  </div>
                </div>
              </div>

              {/* 3. LINE ITEMS */}
              <div className="mb-12">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="p-5 rounded-l-2xl">Product Description</th>
                      <th className="p-5 text-center">Qty</th>
                      <th className="p-5 text-right">Unit Price</th>
                      <th className="p-5 text-right rounded-r-2xl">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {order.items?.map((item, index) => (
                      <tr key={index} className="border-b border-gray-50 group">
                        <td className="p-5">
                          <p className="font-bold text-gray-900">{item.name}</p>
                          {item.subcategory && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.subcategory}</span>}
                        </td>
                        <td className="p-5 text-center font-mono font-bold text-gray-500">x{item.quantity}</td>
                        <td className="p-5 text-right font-mono font-bold tracking-tighter text-gray-500">₵{item.price}</td>
                        <td className="p-5 text-right font-black font-mono text-lg text-gray-900 tracking-tighter">₵{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. TOTALS */}
              <div className="flex justify-end mb-16 px-5">
                <div className="w-72 space-y-4">
                  <div className="flex justify-between text-gray-400 text-xs font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-gray-900">₵{order.total}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs font-bold uppercase tracking-widest">
                    <span>Shipping</span>
                    <span className="text-gray-900">₵0.00</span>
                  </div>
                  <div className="h-[2px] bg-gray-100 w-full" />
                  <div className="flex justify-between items-center">
                    <span className="font-black text-gray-400 uppercase text-xs tracking-[2px]">Total Amount</span>
                    <span className="font-black text-4xl tracking-tighter" style={{ color: docColor }}>₵{order.total}</span>
                  </div>
                </div>
              </div>

              {/* 5. FOOTER / BANK DETAILS */}
              <div className="grid grid-cols-2 gap-12 text-xs border-t-2 border-gray-100 pt-10">
                <div>
                  <h4 className="font-black text-gray-900 uppercase tracking-widest mb-3">Electronic Payment</h4>
                  <p className="text-gray-500 font-medium whitespace-pre-line leading-relaxed">
                    {siteContent.invoiceBankDetails || "MoMo: 0244123456\nBank: KenteHaul Digital\nGlobal Transfers: KH-2200"}
                  </p>
                </div>
                <div className="text-right">
                  <h4 className="font-black text-gray-900 uppercase tracking-widest mb-3">Official Notice</h4>
                  <p className="text-gray-500 font-medium whitespace-pre-line leading-relaxed">
                    {siteContent.invoiceTerms || "Thank you for choosing KenteHaul Heritage.\nPlease retain this document for delivery verification."}
                  </p>
                </div>
              </div>

              <div className="mt-20 pt-10 border-t border-gray-50 text-center">
                <p className="text-[10px] text-gray-300 font-black uppercase tracking-[5px]">KENTEHAUL ECOSYSTEM • 2026</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}