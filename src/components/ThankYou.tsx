import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';

interface ThankYouProps {
  productName?: string;
  totalPrice?: number;
  phone?: string;
  onContinue: () => void;
}

export const ThankYou: React.FC<ThankYouProps> = ({ productName, totalPrice, phone, onContinue }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-brand-bg px-6 py-12 text-center min-h-screen">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white border border-neutral-100 rounded-3xl p-8 shadow-xl relative overflow-hidden"
      >
        {/* Success Icon Badge */}
        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100/50">
          <CheckCircle2 size={36} strokeWidth={1.5} className="animate-pulse" />
        </div>

        {/* Header Message */}
        <h2 className="font-serif italic text-2xl text-brand-text tracking-tight mb-2">
          Order Confirmed Successfully!
        </h2>
        <p className="text-[14px] text-neutral-500 leading-relaxed max-w-[280px] mx-auto mb-6">
          لقد تم تأكيد طلبك بنجاح. سنقوم بالتواصل معك لتأكيد الشحن قريباً.
          <br />
          Thank you for shopping with us!
        </p>

        {/* Order Details list */}
        <div className="bg-neutral-50 rounded-2xl p-4.5 text-left space-y-3 border border-neutral-200/30 mb-8">
          <h3 className="text-[11px] uppercase tracking-wider font-bold text-neutral-400 border-b border-neutral-200/50 pb-2">
            Order Details / تفاصيل الطلب
          </h3>

          <div className="flex justify-between text-[13px] text-neutral-700 leading-tight">
            <span className="text-neutral-400">Product:</span>
            <span className="font-medium truncate max-w-[180px]">{productName || 'Veg Garment'}</span>
          </div>

          {phone && (
            <div className="flex justify-between text-[13px] text-neutral-700 leading-tight">
              <span className="text-neutral-400">Phone:</span>
              <span className="font-mono font-medium">{phone}</span>
            </div>
          )}

          <div className="flex justify-between text-[13px] text-neutral-700 leading-tight">
            <span className="text-neutral-400">Payment:</span>
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
              الدفع عند الاستلام (COD)
            </span>
          </div>

          <div className="flex justify-between text-[14px] text-brand-text font-bold border-t border-dashed border-neutral-200 pt-2.5 mt-1">
            <span>Total Price / المجموع الإجمالي:</span>
            <span className="font-serif inline-flex gap-1" dir="ltr">
              <span>دج</span>
              <span>{(totalPrice || 0).toFixed(2)}</span>
            </span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-brand-text text-white hover:bg-neutral-800 transition-colors py-4 px-6 rounded-full font-medium text-[14px] flex items-center justify-center gap-2 shadow-sm"
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
          <span>Continue Shopping / متابعة التسوق</span>
        </button>
      </motion.div>
    </div>
  );
};
