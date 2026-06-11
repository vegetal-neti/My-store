import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  useEffect(() => {
    // Elegant SEO Title
    document.title = "Terms of Service - شروط الاستخدام | Shoplix";
    
    // Smooth scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="flex-1 bg-brand-bg px-5 py-6" dir="rtl">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-brand-text hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
          aria-label="العودة للرئيسية"
        >
          <ArrowLeft size={18} className="transform rotate-180" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-text">Terms of Service</h1>
          <p className="text-[12px] text-neutral-400">شروط واستخدام الخدمة لمتجر Shoplix</p>
        </div>
      </div>

      {/* SEO metadata emulation */}
      <meta name="description" content="اتفاقية شروط الخدمة والاستخدام الخاصة بمتجر Shoplix الإلكتروني في الجزائر. يرجى قراءة الشروط بعناية قبل شراء أي منتج من منصتنا." />

      {/* Legal Content */}
      <div className="space-y-8 text-right bg-white rounded-3xl border border-neutral-100 p-6 md:p-8 shadow-xs">
        
        {/* Title and Updated Date */}
        <div className="border-b border-neutral-100 pb-5">
          <h2 className="text-2xl font-bold text-brand-text leading-tight mb-2">اتفاقية شروط الخدمة والاستخدام</h2>
          <div className="flex items-center gap-2 text-neutral-400 text-[11px] font-mono leading-none">
            <span>آخر تحديث:</span>
            <span dir="ltr">11 يونيو 2026</span>
          </div>
        </div>

        {/* Section 1: Introduction */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>1. مقدمة عامة</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            مرحباً بكم في متجر <strong>Shoplix</strong> الإلكتروني. يسري استخدامكم للموقع وكافة الخدمات والمنتجات المعروضة فيه بموجب هذه الاتفاقية. عند تصفحكم للموقع أو تقديم طلب شراء، فإنكم توافقون ضمنياً وبشكل كامل على شروط الخدمة الموضحة أدناه. إذا كنتم لا توافقون على هذه البنود، يرجى التوقف عن استخدام المنصة.
          </p>
        </div>

        {/* Section 2: Website usage */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>2. شروط استخدام المتجر</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            يشترط لاستخدام المتجر أن تتوفر في العميل الأهلية القانونية اللازمة للتعاقد والشراء وفق القوانين المعمول بها في الجمهورية الجزائرية الديمقراطية الشعبية. يُمنع استغلال الموقع لأغراض غير قانونية أو انتهاك حقوق الملكية الفكرية الخاصة بالموقع ومحتوياته من صور، تصاميم، أو نصوص.
          </p>
        </div>

        {/* Section 3: User Responsibility over Data */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>3. صحة البيانات المدخلة ومسؤولية العميل</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            بصفتك مستخدماً أو مشترياً، فإنك تقر وتضمن بأن جميع المعلومات المدخلة في استمارة الطلب (الاسم الكامل، رقم الهاتف النشط، الولاية، والبلدية) صحيحة ودقيقة ومحدثة تماماً.
            أي خطأ أو نقص في هذه البيانات قد يؤدي إلى تأخر تسليم الطلب أو إلحاق تكاليف إضافية بعملية الشحن، ويتحمل العميل كامل المسؤولية المترتبة على ذلك.
          </p>
        </div>

        {/* Section 4: Ordering process and verification */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>4. آلية إنشاء وتأكيد الطلبات</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            بعد تعبئة نموذج الطلب وإرساله عبر الموقع، يتلقى العميل إشعاراً باستلام الطلب. يعتبر الطلب أولياً وغير نهائي حتى يتم إجراء اتصال هاتفي أو إرسال رسالة لتأكيد الطلب من قبل قسم خدمة العملاء الخاص بـ Shoplix.
            نحتفظ بطلبك معلقاً حتى تأكيده هاتفياً. في حال عدم الرد على مكالمات التأكيد المتكررة خلال 48 ساعة، سيتم إلغاء الطلب تلقائياً لضمان توفير المنتجات للمشترين الجادين الأخرين.
          </p>
        </div>

        {/* Section 5: COD (Cash on Delivery) Policies */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>5. سياسة الدفع عند الاستلام (COD)</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            تعتمد منصتنا بشكل رئيسي على نظام <strong>الدفع عند الاستلام (Cash on Delivery)</strong> في الجزائر. هذا يعني أن العميل لا يقوم بدفع أي مبالغ مالية عبر الإنترنت، بل يقوم بتسديد القيمة الإجمالية للطلب (ثمن المنتج + رسوم الشحن) نقداً لوسيط شركة التوصيل فور جلب الطلبية ومعاينتها واحتلامها يداً بيد.
          </p>
        </div>

        {/* Section 6: Shipping & Delivery */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>6. سياسة الشحن والتوصيل داخل الجزائر</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            يتم توفير خدمات التوصيل بالتعاون مع شركات شحن متخصصة تغطي مختلف الولايات والبلديات الجزائرية. تختلف تكلفة الشحن ومدة التوصيل بحسب الولاية المحددة (سواء التوصيل للمنزل أو لمكتب شركة التوصيل).
            نلتزم ببذل كل الجهود الممكنة لتسليم الطلبات في غضون الآجال المعلنة، غير أننا غير مسؤولين عن أي تأخير خارج عن إرادتنا ناجم عن ظروف لوجستية أو قاهرة خاصة بجهة التوصيل.
          </p>
        </div>

        {/* Section 7: Rejection for Fake/Unserious orders */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>7. معالجة الطلبات الوهمية والمشبوهة</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            بهدف حماية أعمالنا وضمان استمرارية الخدمة بأعلى جودة، يحتفظ متجر Shoplix بالحق الكامل في رفض، تجميد أو إلغاء أي طلب شراء يثبت أو يُشتبه أنه وهمي، غير جاد، أو يحتوي على بيانات تالفة أو احتيالية.
            قد نقوم بحظر أرقام الهواتف أو العناوين التي تكرر تقديم طلبات وهمية أو ترفض استلام الطرود المؤكدة دون عذر مسبق مقبول.
          </p>
        </div>

        {/* Section 8: Limitations and Modifications */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>8. إخلاء المسؤولية وكافة التعديلات</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            نحن نبذل قصارى جهدنا لضمان دقة معلومات المنتجات المعروضة، مواصفاتها وصورها. ومع ذلك، قد تظهر اختلافات طفيفة جداً في الألوان أو درجاتها نتيجة لإعدادات شاشات العرض المختلفة.
            يحتفظ الموقع بالحق في تعديل أو تغيير أي بند من بنود هذه الشروط في أي وقت دون إشعار مسبق، وتصبح الشروط المعدلة سارية بمجرد نشرها على هذه الصفحة.
          </p>
        </div>

        {/* Section 9: Team Contact */}
        <div className="border-t border-neutral-100 pt-5 space-y-2">
          <h3 className="text-[14px] font-bold text-brand-text">هل لديك أي استفسار قانوني؟</h3>
          <p className="text-[13px] text-neutral-500 leading-relaxed">
            إذا كان لديكم أي أسئلة أو بحاجة لشروحات بخصوص شروط الخدمة الخاصة بنا، يسعدنا تواصلكم المباشر مع فريق الدعم الفني وخدمة عملاء Shoplix عبر حساباتنا.
          </p>
        </div>

      </div>
    </div>
  );
};
