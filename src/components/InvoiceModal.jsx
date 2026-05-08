import React, { useRef, useState } from 'react';
import { X, Printer, Download, Share2, Mail, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function InvoiceModal({ isOpen, onClose, order, siteContent }) {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef, // Updated for latest version compatibility
    content: () => componentRef.current, // Fallback for older versions
    documentTitle: order ? `Invoice-${order.id}` : 'Invoice',
  });

  const [shareStatus, setShareStatus] = useState(null); // 'generating' | 'uploading' | 'emailing' | 'whatsapp' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !order) return null;

  const sc = {
    title: siteContent?.title || 'KenteHaul',
    primaryColor: siteContent?.primaryColor || '#5b0143',
    secondaryColor: siteContent?.secondaryColor || '#f97316',
    logo: siteContent?.logo || null,
    contactPhone: siteContent?.contactPhone || '+233 54 024 9684',
    contactEmail: siteContent?.contactEmail || 'info@kentehaul.com',
    invoiceEmailSubject: siteContent?.invoiceEmailSubject,
    invoiceEmailBody: siteContent?.invoiceEmailBody,
    invoiceWhatsAppMsg: siteContent?.invoiceWhatsAppMsg
  };

  const isPaid = ['Paid', 'Delivered', 'Shipped'].includes(order.status);
  const docType = isPaid ? "Payment Receipt" : "Invoice";
  const docColor = isPaid ? "#22c55e" : sc.primaryColor;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Helper: Replace Template Placeholders
  const fillTemplate = (text, url) => {
    if (!text) return "";
    const totalVal = Number(order.total) || 0;
    
    // Calculate weaving details if applicable
    const leadTimes = order.items?.map(it => it.preorderDays || 14) || [14];
    const maxLeadTime = order.maxLeadTime || Math.max(...leadTimes);
    const orderDate = new Date(order.date);
    const completionDate = new Date(orderDate);
    completionDate.setDate(orderDate.getDate() + maxLeadTime);

    return text
      .replace(/\[customerName\]/g, order.customer?.name || "Valued Client")
      .replace(/\[orderId\]/g, order.id || "N/A")
      .replace(/\[total\]/g, totalVal.toLocaleString())
      .replace(/\[invoiceUrl\]/g, url || "")
      .replace(/\[completionDate\]/g, completionDate.toLocaleDateString())
      .replace(/\[weavingDays\]/g, maxLeadTime.toString());
  };

  const generateAndUploadPDF = async () => {
    setShareStatus('generating');
    try {
      const element = componentRef.current;
      
      // Settle delay: ensures React has finished any final layout shifts
      await new Promise(resolve => setTimeout(resolve, 800));

      // Use a lower scale on mobile to prevent memory-related blank canvases
      const captureScale = typeof window !== 'undefined' && window.innerWidth < 768 ? 1.5 : 2.5;

      const canvas = await html2canvas(element, {
        scale: captureScale, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Robust selector for the specific cloned invoice
          const clonedElement = clonedDoc.body.querySelector('.invoice-container');
          if (clonedElement) {
            // Remove transitions and transformations during capture
            clonedElement.style.transition = 'none';
            clonedElement.style.transform = 'none';
            clonedElement.style.margin = '0';
            clonedElement.style.width = '210mm';
            clonedElement.style.height = '297mm';
            clonedElement.style.position = 'relative';
          }
        }
      });
      
      setShareStatus('uploading');
      const imgData = canvas.toDataURL('image/jpeg', 0.9); // Slight compression to reduce size
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      const blob = pdf.output('blob');

      const fileRef = ref(storage, `invoices/Invoice-${order.id}.pdf`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (err) {
      console.error("PDF Error:", err);
      throw new Error("Invoice generation failed. Please try again from a desktop if the problem persists.");
    }
  };

  const handleEmailInvoice = async () => {
    let targetEmail = order.customer?.email;
    if (!targetEmail || !targetEmail.includes('@')) {
      targetEmail = prompt("The customer didn't provide a valid email. Enter email to send to:", "");
      if (!targetEmail) return;
    }

    try {
      const url = await generateAndUploadPDF();
      setShareStatus('emailing');
      
      const subject = fillTemplate(siteContent?.invoiceEmailSubject || "Invoice for Order #[orderId]", url);
      const body = fillTemplate(siteContent?.invoiceEmailBody || "Hello, please find your invoice attached.", url);

      await addDoc(collection(db, "mail"), {
        to: targetEmail,
        message: {
          subject: subject,
          text: body,
          html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: ${siteContent?.primaryColor || '#5b0143'}; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Invoice</h1>
            </div>
            <div style="padding: 40px; background-color: #ffffff;">
              <p style="font-size: 16px; font-weight: bold;">Dear ${order.customer?.name || 'Valued Client'},</p>
              <p style="white-space: pre-wrap;">${body}</p>
              <div style="margin-top: 30px; text-align: center;">
                <a href="${url}" style="background-color: ${siteContent?.secondaryColor || '#f97316'}; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Download PDF Invoice</a>
              </div>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">© ${new Date().getFullYear()} ${siteContent?.title || 'KenteHaul'}. All rights reserved.</p>
            </div>
          </div>`,
          attachments: [
            {
              filename: `Invoice-${order.id}.pdf`,
              path: url
            }
          ]
        },
        createdAt: serverTimestamp()
      });

      setShareStatus('success');
      setTimeout(() => setShareStatus(null), 3000);
    } catch (err) {
      setShareStatus('error');
      setErrorMsg(err.message);
      setTimeout(() => setShareStatus(null), 5000);
    }
  };

  const handleWhatsAppInvoice = async () => {
    try {
      const url = await generateAndUploadPDF();
      setShareStatus('whatsapp');
      
      const message = fillTemplate(siteContent?.invoiceWhatsAppMsg || "Hello, here is your invoice: [invoiceUrl]", url);
      const phone = order.customer?.phone?.replace(/[^0-9]/g, '');
      
      if (!phone) {
        alert("Customer phone number is missing.");
        setShareStatus(null);
        return;
      }

      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      
      setShareStatus('success');
      setTimeout(() => setShareStatus(null), 3000);
    } catch (err) {
      setShareStatus('error');
      setErrorMsg(err.message);
      setTimeout(() => setShareStatus(null), 5000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${order.id} - ${sc.title}`,
          text: `Invoice ${order.id} for ${Number(order.total).toLocaleString()}. Status: ${order.status}`,
          url: window.location.origin + `/track/${order.id}`,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      handleWhatsAppInvoice();
    }
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
              <h2 className="font-extrabold text-sm md:text-base leading-none tracking-tight uppercase">Billing Detail</h2>
              <p className="text-[10px] text-gray-400 mt-1.5 uppercase font-bold tracking-widest leading-none opacity-60">Invoice Summary</p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-3 flex-wrap justify-end">
            {shareStatus && shareStatus !== 'success' && shareStatus !== 'error' && (
              <div className="flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-2xl border border-blue-500/20 animate-pulse transition-all">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {shareStatus === 'generating' && "Generating PDF..."}
                  {shareStatus === 'uploading' && "Uploading..."}
                  {shareStatus === 'emailing' && "Sending Email..."}
                  {shareStatus === 'whatsapp' && "Opening WhatsApp..."}
                </span>
              </div>
            )}

            {shareStatus === 'success' && (
              <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-2xl border border-green-500/20 animate-bounce transition-all">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Success!</span>
              </div>
            )}

            {!shareStatus && (
              <>
                <button
                  onClick={handleEmailInvoice}
                  className="p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-2xl transition-all active:scale-95 text-blue-500 border border-blue-500/10 flex items-center gap-2"
                  title="Share via Email"
                >
                  <Mail size={20} /> <span className="hidden lg:inline text-[10px] font-black uppercase">Email</span>
                </button>
                <button
                  onClick={handleWhatsAppInvoice}
                  className="p-3 bg-green-500/10 hover:bg-green-500/20 rounded-2xl transition-all active:scale-95 text-green-500 border border-green-500/10 flex items-center gap-2"
                  title="Share via WhatsApp"
                >
                  <Smartphone size={20} /> <span className="hidden lg:inline text-[10px] font-black uppercase">WhatsApp</span>
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-95 text-blue-400 border border-white/5"
                  title="Native Share"
                >
                  <Share2 size={20} />
                </button>
              </>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2.5 px-4 md:px-6 py-3 bg-white text-black hover:bg-gray-100 rounded-2xl transition-all active:scale-95 text-xs font-black uppercase tracking-widest shadow-xl"
            >
              <Printer size={16} /> <span className="hidden sm:inline">Print / Save</span>
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
                  {sc.logo ? (
                    <img src={sc.logo} alt="Logo" className="h-[75px] w-auto object-contain" />
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto" style={{ backgroundColor: siteContent?.primaryColor || '#5b0143' }}>
{sc.title.charAt(0)}</div>
                      <h1 className="text-3xl font-black tracking-tighter text-gray-950 uppercase">{sc.title}</h1>
                    </div>
                  )}
                  <div className="space-y-1 text-sm font-medium text-gray-500 leading-relaxed max-w-[320px]">
                    <p className="font-black text-gray-950 uppercase tracking-widest text-[10px] mb-1">Our Workshop</p>
                    <p>Accra Digital Hub, Box 404</p>
                    <p>Greater Accra Region, Ghana</p>
                    <p className="mt-2 text-gray-900 font-bold">{sc.contactPhone}</p>
                    <p className="text-gray-900 font-bold">{sc.contactEmail}</p>
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
                          borderColor: order.status === 'Paid' ? '#22c55e' : (siteContent?.primaryColor || '#5b0143') + '40',
                          backgroundColor: order.status === 'Paid' ? '#f0fdf4' : (siteContent?.primaryColor || '#5b0143') + '05',
                          color: order.status === 'Paid' ? '#166534' : (siteContent?.primaryColor || '#5b0143')
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
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-[3px]">Bill To</h4>
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
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Order Ref</span>
                      <span className="text-sm font-bold text-gray-900">#{order.id.toString().slice(-6)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Currency</span>
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
                    <tr style={{ backgroundColor: siteContent?.primaryColor || '#5b0143' }}>
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
                                    <p className="text-xl font-bold" style={{ color: siteContent?.secondaryColor || '#f97316' }}>{siteContent?.companyName || "KenteHaul"}</p>
                        </td>
                        <td className="py-6 px-6 text-center font-bold text-gray-700 text-sm">{item.quantity}</td>
                        <td className="py-6 px-6 text-right font-bold text-gray-700 text-sm font-mono whitespace-nowrap">₵{(Number(item.price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-6 px-6 text-right font-black text-gray-950 text-base font-mono tracking-tight whitespace-nowrap">₵{((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
                    <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-full" style={{ backgroundColor: siteContent?.primaryColor || '#5b0143' }} />
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[3px] mb-3">Terms & Conditions</h4>
                    <p className="text-[10px] leading-relaxed text-gray-500 font-medium">
                      Thank you for choosing {sc.title}. If you have any questions about this invoice, please contact us within 48 hours. This is an official digital record of your transaction.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 opacity-30 no-print">
                    <Share2 size={12} />
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-[4px]">Verified Transaction #{new Date().getFullYear()}</span>
                  </div>
                </div>

                {/* Right Aligned Totals */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-4">
                    <span className="uppercase tracking-[2px]">Subtotal</span>
                    <span className="text-gray-950 font-mono">₵{( (Number(order.total) || 0) - (Number(order.shippingFee) || 0) ).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-4">
                    <span className="uppercase tracking-[2px]">Tax (0.00%)</span>
                    <span className="text-gray-950 font-mono">₵0.00</span>
                  </div>
                  {(Number(order.shippingFee) || 0) > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-4">
                      <span className="uppercase tracking-[2px]">Shipping</span>
                      <span className="text-gray-950 font-mono">₵{(Number(order.shippingFee) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="mt-8 p-8 rounded-[32px] shadow-2xl shadow-gray-200/50 flex flex-col items-end gap-1 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${(siteContent?.primaryColor || '#5b0143')}08, ${(siteContent?.primaryColor || '#5b0143')}15)` }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-5 rounded-full -translate-y-12 translate-x-12" style={{ color: siteContent?.primaryColor || '#5b0143' }} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[4px] mb-1">Total Due</span>
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-8 mb-8" style={{ color: siteContent?.primaryColor || '#5b0143' }}>
                      <span className="text-xl font-bold opacity-40">₵</span>
                      <span className="text-5xl font-black tracking-tighter leading-none">
                        {(Number(order.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. PROFESSIONAL FOOTER (Pinned to Bottom) */}
              <div className="mt-16 pt-10 border-t border-gray-100 flex justify-between items-end">
                <div className="space-y-1.5">
                  <p className="text-[13px] font-black text-gray-950 tracking-wide uppercase">{sc.title} Shop</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[4px]">Thank you for your order — we appreciate your business</p>
                </div>
                <div className="text-right flex flex-col items-end gap-3 opacity-30">
                  <div className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center font-black text-[10px] text-gray-300">KH</div>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Official Digital Record</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}