import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, MapPin, Truck, Landmark, Loader2, RefreshCw } from 'lucide-react';
import { getShippingRates } from '../firebase';
import { algeriaWilayas } from '../data/algeriaCities';
import { ShippingRate } from '../types';

interface ShippingRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShippingRatesModal: React.FC<ShippingRatesModalProps> = ({ isOpen, onClose }) => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchRates = async () => {
      if (!isOpen) return;
      try {
        setLoading(true);
        setError(null);
        
        // Fetch custom rates from Firestore (reads from cache if preloaded)
        const firestoreRates = await getShippingRates();
        
        // Lookup map
        const ratesMap: Record<number, ShippingRate> = {};
        
        // 1. Pre-populate with all 58 Wilayas using default static pricing
        algeriaWilayas.forEach((w) => {
          ratesMap[w.id] = {
            wilayaId: w.id,
            wilayaName: w.name,
            wilayaNameEn: w.nameEn,
            homePrice: w.shippingHome,
            deskPrice: w.shippingPickup,
            enabled: true, // Active by default
          };
        });

        // 2. Overlay custom firestore rates if present
        if (firestoreRates && firestoreRates.length > 0) {
          firestoreRates.forEach((fr: any) => {
            const wId = Number(fr.wilayaId);
            if (ratesMap[wId]) {
              ratesMap[wId] = {
                ...ratesMap[wId],
                homePrice: fr.homePrice !== undefined ? Number(fr.homePrice) : ratesMap[wId].homePrice,
                deskPrice: fr.deskPrice !== undefined ? Number(fr.deskPrice) : ratesMap[wId].deskPrice,
                enabled: fr.enabled !== undefined ? Boolean(fr.enabled) : ratesMap[wId].enabled,
              };
            }
          });
        }

        // Convert lookup map to list, filtering out any disabled wilayas
        const activeRates = Object.values(ratesMap).filter((rate) => rate.enabled);
        setRates(activeRates);
      } catch (err) {
        console.error('Error fetching shipping rates:', err);
        setError('عذراً، فشل تحميل أسعار التوصيل. يرجى التحقق من اتصالك بالإنترنت.');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();

    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Support Closing via Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Filter rates by Search Query (Arabic or English)
  const filteredRates = rates.filter((rate) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      rate.wilayaName.toLowerCase().includes(query) ||
      rate.wilayaNameEn.toLowerCase().includes(query) ||
      String(rate.wilayaId).includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="absolute inset-0 z-50 bg-brand-bg flex flex-col"
        dir="rtl"
      >
        {/* Elegant Sticky Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100 bg-brand-bg/95 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Truck size={20} className="text-brand-accent stroke-[1.5]" />
            <h3 className="font-serif text-lg font-bold text-brand-text">تكاليف واسعار التوصيل</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-1.5 rounded-full hover:bg-neutral-100 text-brand-text transition-colors flex items-center gap-1 cursor-pointer"
            aria-label="Close"
          >
            <span className="text-[11px] tracking-wider uppercase font-semibold text-neutral-400">إغلاق</span>
            <X strokeWidth={1.5} size={18} />
          </button>
        </div>

        {/* Elegant Search bar */}
        <div className="px-5 py-3">
          <div className="relative flex items-center">
            <span className="absolute right-4 text-neutral-400">
              <Search strokeWidth={1.5} size={17} />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث عن الولاية أو رقمها..."
              className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl pr-11 pl-4 py-3 text-[14px] text-brand-text font-serif leading-none outline-none focus:bg-white focus:ring-1 focus:ring-brand-accent/20 focus:border-brand-accent/50 transition-all placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-4 p-1 text-neutral-400 hover:text-brand-text rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer"
                aria-label="Clear"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Header Columns for Table */}
        <div className="px-5 py-2.5 bg-neutral-100/55 border-y border-neutral-200/40 text-[12px] font-bold text-neutral-500 uppercase tracking-wider grid grid-cols-12 gap-2 select-none">
          <div className="col-span-5 text-right flex items-center gap-1.5">
            <MapPin size={11} className="text-neutral-400 shrink-0" />
            <span>الولاية</span>
          </div>
          <div className="col-span-4 text-center flex items-center justify-center gap-1">
            <Truck size={11} className="text-neutral-400 shrink-0" />
            <span>إلى المنزل</span>
          </div>
          <div className="col-span-3 text-left flex items-center justify-end gap-1">
            <Landmark size={11} className="text-neutral-400 shrink-0" />
            <span>إلى المكتب</span>
          </div>
        </div>

        {/* List content with elegant scrolling */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 divide-y divide-neutral-100">
          {loading && rates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-accent stroke-[1.5]" />
              <p className="text-[12px] text-neutral-500 font-medium mt-3">جاري جلب أسعار التوصيل المحدثة...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 px-4">
              <p className="text-red-500 text-sm mb-3 flex items-center justify-center gap-1.5 font-medium">
                <span>{error}</span>
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  getShippingRates().then(fr => {
                    const ratesMap: Record<number, ShippingRate> = {};
                    algeriaWilayas.forEach((w) => {
                      ratesMap[w.id] = {
                        wilayaId: w.id,
                        wilayaName: w.name,
                        wilayaNameEn: w.nameEn,
                        homePrice: w.shippingHome,
                        deskPrice: w.shippingPickup,
                        enabled: true,
                      };
                    });
                    if (fr && fr.length > 0) {
                      fr.forEach((r: any) => {
                        const wId = Number(r.wilayaId);
                        if (ratesMap[wId]) {
                          ratesMap[wId] = {
                            ...ratesMap[wId],
                            homePrice: r.homePrice !== undefined ? Number(r.homePrice) : ratesMap[wId].homePrice,
                            deskPrice: r.deskPrice !== undefined ? Number(r.deskPrice) : ratesMap[wId].deskPrice,
                            enabled: r.enabled !== undefined ? Boolean(r.enabled) : ratesMap[wId].enabled,
                          };
                        }
                      });
                    }
                    setRates(Object.values(ratesMap).filter(r => r.enabled));
                    setLoading(false);
                  }).catch(() => setLoading(false));
                }}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-brand-text text-[13px] font-semibold rounded-xl border border-neutral-200/65 flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="font-serif italic text-[15px] text-neutral-500">لم يتم العثور على أي نتائج</p>
              <p className="text-[12px] text-neutral-400 mt-1">تأكد من كتابة اسم الولاية بشكل صحيح.</p>
            </div>
          ) : (
            filteredRates.map((rate) => (
              <div
                key={rate.wilayaId}
                className="py-3.5 grid grid-cols-12 gap-2 hover:bg-neutral-50/40 transition-colors"
              >
                {/* Wilaya Info */}
                <div className="col-span-5 text-right flex items-center font-medium pr-1">
                  <span className="text-[12px] font-mono text-neutral-400 w-6 shrink-0 inline-block text-right">
                    {String(rate.wilayaId).padStart(2, '0')}
                  </span>
                  <span className="text-[14px] text-brand-text truncate mr-1">
                    {rate.wilayaName}
                  </span>
                </div>

                {/* Home Shipping Fee */}
                <div className="col-span-4 text-center flex items-center justify-center font-mono font-medium text-[14px] text-brand-text bg-neutral-50/50 rounded-xl py-0.5 border border-neutral-100/30">
                  <span className="text-[11px] font-sans text-neutral-400 ml-1">دج</span>
                  <span>{rate.homePrice}</span>
                </div>

                {/* Desk Shipping Fee */}
                <div className="col-span-3 text-left flex items-center justify-end font-mono font-medium text-[14px] text-brand-text pl-1.5">
                  {rate.deskPrice > 0 ? (
                    <>
                      <span className="text-[11px] font-sans text-neutral-400 ml-1">دج</span>
                      <span>{rate.deskPrice}</span>
                    </>
                  ) : (
                    <span className="text-[11px] font-sans text-neutral-400 tracking-tight leading-none">مجانًا</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dynamic bottom hint regarding shipping services */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 text-[12px] text-neutral-500 leading-relaxed text-center select-none">
          يتم شحن الطلبيات بعناية فائقة وتوصيلها في غضون 24 إلى 48 ساعة كحد أقصى. الدفع عند الاستلام.
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
