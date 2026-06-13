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
        <div className="mb-6 space-y-1" dir="rtl">
          <h2 className="font-amiri font-normal text-[28px] text-neutral-900 leading-snug">
            لقد تم تأكيد طلبك بنجاح!
          </h2>
          <p className="font-amiri text-[15.5px] text-neutral-500 leading-relaxed max-w-[290px] mx-auto pt-1">
            سنقوم بالتواصل معك لتأكيد الشحن قريباً
          </p>
          <p className="text-[10px] text-neutral-400 leading-relaxed pt-1.5 font-bold tracking-wider select-none uppercase font-sans" dir="ltr">
            Thank you for shopping with us!
          </p>
        </div>

        {/* Order Details list */}
        <div className="bg-neutral-50 rounded-2xl p-4.5 space-y-3.5 border border-neutral-200/30 mb-8">
          <h3 className="text-[13px] font-bold text-neutral-500 border-b border-neutral-200/50 pb-2 text-right font-sans" dir="rtl">
            تفاصيل الطلب
          </h3>

          <div className="flex justify-between items-center text-[13px] text-neutral-700 leading-tight" dir="rtl">
            <span className="text-neutral-400 font-sans">المنتج:</span>
            <span className="font-medium truncate max-w-[180px] font-sans text-left" dir="auto">{productName || 'Veg Garment'}</span>
          </div>

          {phone && (
            <div className="flex justify-between items-center text-[13px] text-neutral-700 leading-tight" dir="rtl">
              <span className="text-neutral-400 font-sans">رقم الهاتف:</span>
              <span className="font-mono font-medium text-left" dir="ltr">{phone}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[13px] text-neutral-700 leading-tight" dir="rtl">
            <span className="text-neutral-400 font-sans">الدفع:</span>
            <span className="font-bold text-emerald-850 bg-emerald-50 px-2 py-0.5 rounded text-[11.5px] font-sans text-left">
              الدفع عند الاستلام (COD)
            </span>
          </div>

          <div className="flex justify-between items-center text-[14px] text-brand-text font-bold border-t border-dashed border-neutral-200 pt-2.5 mt-1" dir="rtl">
            <span className="font-sans">السعر الإجمالي:</span>
            <span className="font-serif inline-flex gap-1 text-left" dir="ltr">
              <span>دج</span>
              <span>{(totalPrice || 0).toFixed(0)}</span>
            </span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-brand-text text-white hover:bg-neutral-800 transition-colors py-3.5 px-6 rounded-full flex items-center justify-center gap-2.5 shadow-sm"
        >
          <ShoppingBag size={18} strokeWidth={1.5} className="shrink-0" />
          <span className="font-sans font-bold text-[16px] tracking-wide">متابعة التسوق</span>
        </button>
      </motion.div>
    </div>
  );
};
