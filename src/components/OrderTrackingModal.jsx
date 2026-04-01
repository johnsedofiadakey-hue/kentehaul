import React from 'react';
import { X, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ORDER_STATUSES } from '../data/constants';

export default function OrderTrackingModal({
  isOpen,
  onClose,
  trackingInput,
  setTrackingInput,
  trackingResult,
  handleTrackOrder,
  siteContent
}) {

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 p-8"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: siteContent.primaryColor }}>
              Track Your Order
            </h2>

            {/* Input Section */}
            <div className="flex gap-2 mb-8">
              <input
                type="text"
                placeholder="Enter Order ID (e.g., 123456...)"
                className="flex-grow p-3 border rounded-xl focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': siteContent.primaryColor }}
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
              />
              <button
                onClick={handleTrackOrder}
                className="px-6 py-3 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition"
                style={{ backgroundColor: siteContent.primaryColor }}
              >
                Track
              </button>
            </div>

            {/* Tracking Result */}
            {trackingResult && (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <span className="font-bold text-lg">Order #{trackingResult.id}</span>
                  <span className="text-sm text-gray-500">{trackingResult.date}</span>
                </div>

                {/* Status Timeline */}
                <div className="space-y-6 relative">
                  {/* Vertical Line Connector (Visual decoration) */}
                  <div className="absolute left-4 top-2 bottom-4 w-0.5 bg-gray-200 -z-10"></div>

                  {ORDER_STATUSES.filter(s => s !== 'Cancelled').map((step, index) => {
                    const currentStatusIndex = ORDER_STATUSES.indexOf(trackingResult.status);
                    const stepIndex = ORDER_STATUSES.indexOf(step);
                    const isCompleted = currentStatusIndex >= stepIndex;
                    const isCurrent = currentStatusIndex === stepIndex;

                    return (
                      <div key={step} className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${isCompleted ? 'text-white border-transparent' : 'bg-white border-2 border-gray-200 text-gray-300'
                            }`}
                          style={{
                            backgroundColor: isCompleted ? (isCurrent ? siteContent.secondaryColor : '#10b981') : undefined,
                            boxShadow: isCurrent ? `0 0 20px ${siteContent.secondaryColor}40` : 'none',
                            transform: isCurrent ? 'scale(1.2)' : 'scale(1)'
                          }}
                        >
                          {isCompleted ? <CheckCircle size={16} /> : <Clock size={16} />}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <span className={`font-black text-[11px] uppercase tracking-wider transition-colors ${isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                              {step}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Current Status</span>
                            )}
                          </div>
                          {isCurrent && (
                            <p className="text-[10px] text-gray-400 font-medium">We are currently at this stage of your order journey.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Special Case for Cancelled */}
                  {trackingResult.status === 'Cancelled' && (
                    <div className="flex items-center gap-4 mt-4">
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                        <X size={16} />
                      </div>
                      <span className="font-bold text-red-500">Order Cancelled</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}