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
  const docType = isPaid ? "PAYMENT RECEIPT" : "INVOICE";
  const docColor = isPaid ? "#22c55e" : siteContent.primaryColor || "#000";

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">

        {/* --- ACTIONS HEADER --- */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-base md:text-lg">Document Viewer</h2>
            <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${isPaid ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
              {order.status.toUpperCase()}
            </span>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-xs md:text-sm font-bold">
              <Printer size={16} /> <span>PDF</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-red-600 rounded-lg transition"><X size={20} /></button>
          </div>
        </div>

        {/* --- PRINTABLE DOCUMENT AREA --- */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-2 md:p-8">
          <style>
            {`
              @media print {
                @page { margin: 15mm; }
                body { -webkit-print-color-adjust: exact; }
              }
              .invoice-container {
                min-width: 800px;
              }
              @media (max-width: 768px) {
                .invoice-scroll-wrapper {
                  overflow-x: auto;
                  -webkit-overflow-scrolling: touch;
                }
              }
            `}
          </style>

          <div className="invoice-scroll-wrapper">
            <div ref={componentRef} className="invoice-container bg-white mx-auto min-h-[1000px] shadow-lg p-8 md:p-12 text-gray-800 relative">

              {/* 1. HEADER */}
              <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                <div>
                  {siteContent.logo ? (
                    <img src={siteContent.logo} alt="Logo" className="h-16 md:h-24 w-auto object-contain mb-4" />
                  ) : (
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{siteContent.heroTitle || "KenteHaul"}</h1>
                  )}
                  <div className="text-xs md:text-sm text-gray-500 space-y-1 mt-4">
                    <p className="font-bold text-gray-900">{siteContent.heroTitle || "KenteHaul Stores"}</p>
                    <p>Accra, Ghana</p>
                    <p>{siteContent.contactPhone}</p>
                    <p>{siteContent.contactEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl md:text-5xl font-black tracking-widest opacity-10" style={{ color: docColor }}>{docType}</h1>
                  <div className="mt-4 space-y-1">
                    <p className="text-gray-500 text-xs md:text-sm">Reference ID</p>
                    <p className="font-mono font-bold text-lg md:text-xl">#{order.id}</p>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-gray-500 text-xs md:text-sm">Date Issued</p>
                    <p className="font-bold text-sm md:text-base">{order.date}</p>
                  </div>
                </div>
              </div>

              {/* 2. BILL TO */}
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-12">
                <div className="flex-1">
                  <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Billed To</h3>
                  <div className="border-l-4 pl-4" style={{ borderColor: docColor }}>
                    <p className="font-bold text-lg md:text-xl text-gray-900">{order.customer?.name || "Guest Customer"}</p>
                    <p className="text-sm md:text-base text-gray-600 mt-1">{order.customer?.address || "No Address Provided"}</p>
                    <p className="text-sm md:text-base text-gray-600">{order.customer?.phone}</p>
                    <p className="text-sm md:text-base text-gray-600">{order.customer?.email}</p>
                  </div>
                </div>
              </div>

              {/* 3. LINE ITEMS */}
              <div className="mb-12">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-[10px] md:text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3 md:p-4 rounded-l-lg">Description</th>
                      <th className="p-3 md:p-4 text-center">Qty</th>
                      <th className="p-3 md:p-4 text-right">Unit Price</th>
                      <th className="p-3 md:p-4 text-right rounded-r-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="p-3 md:p-4 font-medium text-gray-900">
                          {item.name}
                          {item.subcategory && <span className="block text-[10px] text-gray-400 font-normal">{item.subcategory}</span>}
                        </td>
                        <td className="p-3 md:p-4 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 md:p-4 text-right font-mono">₵{item.price}</td>
                        <td className="p-3 md:p-4 text-right font-bold font-mono">₵{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. TOTALS */}
              <div className="flex justify-end mb-12">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-gray-500 text-xs md:text-sm">
                    <span>Subtotal</span>
                    <span>₵{order.total}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs md:text-sm">
                    <span>Tax (0%)</span>
                    <span>₵0.00</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total Due</span>
                    <span className="font-black text-xl md:text-2xl" style={{ color: docColor }}>₵{order.total}</span>
                  </div>
                </div>
              </div>

              {/* 5. FOOTER / BANK DETAILS */}
              <div className="border-t-2 border-gray-100 pt-8 flex flex-col md:flex-row gap-8 text-[11px] md:text-sm">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">Payment Methods</h4>
                  <p className="text-gray-500 whitespace-pre-line leading-relaxed">
                    {siteContent.invoiceBankDetails || "Bank: GCB\nAcc: 1234567890\nName: KenteHaul"}
                  </p>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions</h4>
                  <p className="text-gray-500 whitespace-pre-line leading-relaxed">
                    {siteContent.invoiceTerms || "Payment is due within 7 days. Thank you for your business."}
                  </p>
                </div>
              </div>

              {/* Brand Footer */}
              <div className="mt-16 text-center">
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Generated by KenteHaul Admin System</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}