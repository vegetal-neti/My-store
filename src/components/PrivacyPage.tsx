import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  useEffect(() => {
    // Elegant SEO Title
    document.title = "Privacy Policy - سياسة الخصوصية | Shoplix";
    
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
          <h1 className="text-xl font-bold text-brand-text">Privacy Policy</h1>
          <p className="text-[12px] text-neutral-400">سياسة الخصوصية وحماية البيانات لـ Shoplix</p>
        </div>
      </div>

      {/* SEO metadata emulation */}
      <meta name="description" content="سياسة الخصوصية وسرية حماية البيانات الشخصية لزبائن متجر Shoplix الإلكتروني في الجزائر. نتعرف على كيفية جمع واستخدام وتأمين معلوماتكم الشخصية." />

      {/* Legal Content */}
      <div className="space-y-8 text-right bg-white rounded-3xl border border-neutral-100 p-6 md:p-8 shadow-xs">
        
        {/* Title and Updated Date */}
        <div className="border-b border-neutral-100 pb-5">
          <h2 className="text-2xl font-bold text-brand-text leading-tight mb-2">سياسة الخصوصية وسرية المعلومات</h2>
          <div className="flex items-center gap-2 text-neutral-400 text-[11px] font-mono leading-none">
            <span>آخر تحديث:</span>
            <span dir="ltr">11 يونيو 2026</span>
          </div>
        </div>

        {/* Section 1: Data collected */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>1. البيانات التي نقوم بجمعها</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            عند تفاعلكم مع متجر Shoplix أو تقديم طلب شراء لمنتج ما، فإننا نقوم بجمع معلومات شخصية أساسية ومحددة لدقة التوصيل، وتشمل:
          </p>
          <ul className="list-disc list-inside text-[13px] text-neutral-600 space-y-1.5 pr-4">
            <li><strong>الاسم الكامل:</strong> للتعريف بالهوية الصحيحة للمستلم عند التسليم.</li>
            <li><strong>رقم الهاتف المحمول:</strong> للاتصال بكم لتأكيد الطلبية وتنسيق موعد جلب الطرد من قبل وكيل شركة التوصيل.</li>
            <li><strong>الولاية والبلدية:</strong> لتحديد عنوان الشحن وتعيين قيم رسوم الشحن والتسليم المناسبة لها بدقة.</li>
            <li><strong>معلومات وتفاصيل الطلبية:</strong> (المنتجات المطلوبة، المقاس واللون المختارين، السعر الإجمالي، وتاريخ الشراء) لمتابعة التسليم والأمور المالية.</li>
          </ul>
        </div>

        {/* Section 2: Purpose of collection */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>2. سبب استخدام وجمع هذه البيانات</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            إن جمع بياناتكم الشخصية يتم حصراً وبشكل مباشر للأغراض المهمة التالية:
          </p>
          <ul className="list-disc list-inside text-[13px] text-neutral-600 space-y-1.5 pr-4">
            <li>معالجة طلبات الشراء، تحضير الطرود وتغليفها بشكل احترافي.</li>
            <li>تمكين فريق خدمة العملاء لدينا من الاتصال الهاتفي لطلب تأكيد الرغبة في الشراء لتفادي الطرود المهجورة.</li>
            <li>إمكانية إبلاغكم بأي مستجدات قد تطرأ على عملية الشحن أو حالة المخزون.</li>
            <li>توفير وتحسين تجربة التسوق والتصفح الإجمالية وتطوير واجهة متجر Shoplix.</li>
          </ul>
        </div>

        {/* Section 3: Third party restriction */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>3. سرية البيانات ومشاركتها مع أطراف خارجية</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            خصوصيتكم هي من أهم أولوياتنا المباشرة في Shoplix. نحن مجبرون ومسؤولون قانونياً على <strong>عدم بيع، تأجير، أو مشاركة معلوماتكم الشخصية</strong> مع أي جهة ترويجية أو إعلانية خارجية بهدف الربح أو الاستغلال.
            إن مشاركة جزء مميز ومحدد من بياناتكم (الاسم، العنوان الكامل، رقم الهاتف) تتم حصرياً وبشكل قسري ومبرر مع <strong>شركات التوصيل والشحن المتعاقد معها</strong> في الجزائر لتمكينهم من الوصول إليكم مباشرة وتسليمكم طلبياتكم والدفع نقداً عند الاستلام.
          </p>
        </div>

        {/* Section 4: Data protection */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>4. حماية البيانات وتأمين التخزين لدينا</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            يتم تخزين ومعالجة وتأمين جميع السجلات والبيانات المدخلة في نظام آمن ومحمي بالكامل (نظام Firestore السحابي المشفر) لضمان منع الوصول غير المصرح به أو تعديل أو كشف أو تخريب تفاصيل العملاء.
            نطبق مجموعة من الإجراءات الأمنية والتقنية الصارمة لضمان خصوصية بياناتكم من العبث طوال دورة معالجة الطلبات وحتى إتمام التسليم والأرشفة الأمنية.
          </p>
        </div>

        {/* Section 5: Cookies usage */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>5. ملفات تعريف الارتباط والذاكرة المحلية Cookies</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            يستخدم المتجر ملفات تعريف الارتباط (Cookies) والذاكرة التخزينية المحلية للمتصفح لحفظ بعض تفضيلات الزوار البسيطة (مثل تفضيل اللغة أو الاحتفاظ بالعناصر النشطة داخل سلة التسوق عند التصفح).
            هذا الاستعمال هدفه تقني بحت ولا يشكل أي تهديد لسلامتكم، كما يتيح تصفحاً أسرع ومريحاً مع كل زيارة للمنصة.
          </p>
        </div>

        {/* Section 6: User rights */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text"></span>
            <span>6. حقوقكم المتعلقة بالبيانات الشخصية</span>
          </h3>
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            بصفتكم مالكين لهذه البيانات، فإنه يحق لكم بالكامل التقدم بطلب للاستعلام عن طبيعة بياناتكم الشخصية المخزنة لدينا، أو طلب تعديلها أو تحديثها في حال طرأ عليها أي تغيير، كما يحق لكم طلب حذفها المسجل بشكل نهائي من خوادم قاعدة البيانات بمجرد اكتمال واستلام الطلبية الخاصة بكم.
          </p>
        </div>

        {/* Section 7: Support Contact info */}
        <div className="border-t border-neutral-100 pt-5 space-y-2">
          <h3 className="text-[14px] font-bold text-brand-text">لديك استفسار بخصوص سياسة الخصوصية؟</h3>
          <p className="text-[13px] text-neutral-500 leading-relaxed">
            أنتم تملكون كامل الصلاحية ولكم مطلق الحرية في التواصل مع إدارة حماية البيانات وسرية العملاء لـ Shoplix عبر حسابات الدعم الخاصة بنا والمنشورة في أسفل الموقع أو من خلال وسيلة الاتصال السريع.
          </p>
        </div>

      </div>
    </div>
  );
};
