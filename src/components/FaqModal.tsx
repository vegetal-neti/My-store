import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, ChevronDown, MessageSquare, Truck, CreditCard, RefreshCw, ShoppingBag } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FaqItem[];
}

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollRef = useRef<number>(0);

  // When opening, reset categories to closed and scroll content/window to top
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position so we can return to it later
      prevScrollRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      setExpandedCategories({});
      
      // Scroll the main page window and the internal container to the top immediately
      window.scrollTo(0, 0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }

      // Re-verify after rendering to ensure layout paint doesn't jump
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 30);
      return () => clearTimeout(timer);
    } else {
      // Safely restore original scroll position upon modal closure
      if (prevScrollRef.current > 0) {
        const targetScroll = prevScrollRef.current;
        window.scrollTo(0, targetScroll);
        prevScrollRef.current = 0;
      }
    }
  }, [isOpen]);

  // FAQ structured data exactly as requested
  const categories: FaqCategory[] = [
    {
      id: 'orders',
      title: 'الطلبـات',
      icon: <ShoppingBag size={16} className="text-brand-accent shrink-0" />,
      items: [
        {
          question: 'كيف أطلب منتجًا؟',
          answer: 'اختر المنتج، أدخل معلوماتك (الاسم، الهاتف، الولاية، البلدية، ونوع التوصيل)، ثم أكّد الطلب. سيتواصل معك فريقنا لتأكيد الطلب في أقرب وقت.'
        },
        {
          question: 'هل يمكنني تعديل أو إلغاء طلبي؟',
          answer: 'نعم، يمكن تعديل أو إلغاء الطلب قبل شحنه. تواصل معنا في أسرع وقت عبر وسائل التواصل المتاحة.'
        },
        {
          question: 'لماذا لم أتلقَّ مكالمة التأكيد؟',
          answer: 'عادةً يتم التواصل خلال أقل من 24 ساعة. تأكد من صحة رقم الهاتف وأنه متاح لاستقبل المكالمات.'
        }
      ]
    },
    {
      id: 'delivery',
      title: 'التوصيـل',
      icon: <Truck size={16} className="text-brand-accent shrink-0" />,
      items: [
        {
          question: 'ما هي مناطق التوصيل؟',
          answer: 'نوفر التوصيل إلى جميع ولايات الجزائر.'
        },
        {
          question: 'كم تستغرق مدة التوصيل؟',
          answer: 'تختلف مدة التوصيل حسب الولاية وشركة الشحن، وعادةً تتراوح بين 1 و5 أيام عمل.'
        },
        {
          question: 'كم تكلفة التوصيل؟',
          answer: 'تختلف تكلفة التوصيل حسب الولاية ونوع التوصيل. يمكنك الاطلاع عليها من صفحة أسعار التوصيل.'
        },
        {
          question: 'كيف أتابع طلبي؟',
          answer: 'بعد تأكيد الطلب سيتم تزويدك ومعلومات المتابعة عند توفرها، كما يمكنك التواصل معنا للاستفسار عن حالة الطلب.'
        }
      ]
    },
    {
      id: 'payment',
      title: 'الدفـع',
      icon: <CreditCard size={16} className="text-brand-accent shrink-0" />,
      items: [
        {
          question: 'هل الدفع عند الاستلام متاح؟',
          answer: 'نعم، الدفع عند الاستلام متوفر في جميع الولايات التي تشملها خدمة التوصيل.'
        },
        {
          question: 'هل توجد طرق دفع أخرى؟',
          answer: 'حالياً الدفع عند الاستلام فقط.'
        }
      ]
    },
    {
      id: 'returns',
      title: 'الاستبدال والإرجاع',
      icon: <RefreshCw size={16} className="text-brand-accent shrink-0" />,
      items: [
        {
          question: 'هل يمكنني استبدال أو إرجاع المنتج؟',
          answer: 'نعم، في حال وجود عيب في المنتج أو وصول منتج مختلف عن الطلب.'
        },
        {
          question: 'كيف أطلب الاستبدال أو الإرجاع؟',
          answer: 'تواصل معنا وسنقوم بمساعدتك حسب حالة الطلب والمنتج.'
        }
      ]
    },
    {
      id: 'contact',
      title: 'التواصـل',
      icon: <MessageSquare size={16} className="text-brand-accent shrink-0" />,
      items: [
        {
          question: 'كيف أتواصل مع خدمة العملاء؟',
          answer: 'يمكنك التواصل معنا عبر وسائل التواصل الاجتماعي الموجودة أسفل المتجر أو عبر وسائل الاتصال المتاحة.'
        }
      ]
    }
  ];

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle Close via Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        ref={containerRef}
      >
        {/* Sticky Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100 bg-brand-bg/95 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-brand-accent stroke-[1.5]" />
            <h3 className="font-serif text-lg font-bold text-brand-text">الأسئلة الشائعة (FAQ)</h3>
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

        {/* Vertical FAQ Accordions List */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-5 pb-8 space-y-4">
          {categories.map((category) => {
            const isExpanded = !!expandedCategories[category.id];
            return (
              <div
                key={category.id}
                className="bg-white border border-neutral-200/50 rounded-2xl overflow-hidden transition-all duration-200 hover:border-neutral-300/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                {/* Category Header Toggle Button */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full text-right px-4 py-4 flex items-center justify-between gap-4 cursor-pointer focus:outline-none bg-neutral-50/20 hover:bg-neutral-50/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-neutral-100/80 rounded-xl shrink-0 flex items-center justify-center">
                      {category.icon}
                    </span>
                    <span className="font-serif text-[15px] font-bold text-brand-text">
                      {category.title}
                    </span>
                  </div>
                  <span
                    className={`text-neutral-400 transform transition-transform duration-250 shrink-0 ${
                      isExpanded ? 'rotate-180 text-brand-accent' : ''
                    }`}
                  >
                    <ChevronDown size={18} strokeWidth={1.8} />
                  </span>
                </button>

                {/* Category Q&A List Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-neutral-100/60 divide-y divide-neutral-100/60">
                        {category.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="py-4 first:pt-2.5 last:pb-1">
                            <div className="font-serif text-[14px] leading-relaxed font-bold text-brand-text mb-1.5 flex items-start gap-1">
                              <span className="text-brand-accent ml-1 font-sans shrink-0">س:</span>
                              <span>{item.question}</span>
                            </div>
                            <div className="text-[13px] text-neutral-600 leading-relaxed font-medium flex items-start gap-1 pr-1">
                              <span className="text-neutral-400 ml-1 font-sans shrink-0">ج:</span>
                              <span className="flex-1">{item.answer}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Support Bottom Card */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100/60 text-center text-[12px] text-neutral-500 font-medium">
          لم تجد إجابة لسؤالك؟ نحن هنا للمساعدة، يمكنك التواصل معنا في أي وقت.
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
