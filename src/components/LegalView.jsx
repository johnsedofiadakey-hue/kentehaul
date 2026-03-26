import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ShieldCheck, Scale, RefreshCw, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const FormattedText = ({ text }) => {
  if (!text) return null;
  
  const formatText = (content) => {
    return content.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-gray-900 font-black">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-8">
      {text.split(/\n\s*\n/).filter(p => p.trim() !== '').map((para, i) => {
        if (para.startsWith('### ')) {
          return <h3 key={i} className="text-2xl font-black text-gray-900 uppercase tracking-tight mt-12 mb-4">{para.replace('### ', '')}</h3>;
        }
        return <p key={i} className="text-gray-600 leading-relaxed font-medium">{formatText(para)}</p>;
      })}
    </div>
  );
};

export default function LegalView({ title, content, siteContent, type }) {
  const icons = {
    privacy: <ShieldCheck size={40} />,
    terms: <Scale size={40} />,
    refund: <RefreshCw size={40} />
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24 px-6">
      <Helmet>
        <title>{title} | KenteHaul</title>
        <meta name="description" content={`Read our ${title} to understand how KenteHaul operates.`} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-10 group">
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[3px]">Back to Home</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[50px] shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Header Banner */}
          <div className="p-12 md:p-16 border-b border-gray-50 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-white to-gray-50/50">
            <div 
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl"
              style={{ backgroundColor: siteContent.primaryColor }}
            >
              {icons[type] || <Scale size={40} />}
            </div>
            <div className="text-center md:text-left">
              <span className="text-amber-500 font-black text-[10px] uppercase tracking-[5px] mb-2 block">KenteHaul Royal Protocol</span>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tighter leading-tight">
                {title}
              </h1>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-12 md:p-20">
            <div className="prose prose-lg max-w-none">
              {content ? (
                <FormattedText text={content} />
              ) : (
                <div className="py-20 text-center">
                  <p className="text-gray-300 font-bold uppercase tracking-widest italic">Content for this policy is currently being updated by the curators.</p>
                </div>
              )}
            </div>

            <div className="mt-20 pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[4px]">Last Updated: {new Date().toLocaleDateString()}</p>
              <div className="flex gap-4">
                <Link to="/contact" className="text-[10px] font-black text-gray-500 hover:text-gray-900 uppercase tracking-[3px] transition-colors">Contact Support</Link>
                <span className="text-gray-200">|</span>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[3px]">KenteHaul Ghana</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
