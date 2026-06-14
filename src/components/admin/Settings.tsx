import React, { useState } from 'react';
import { AdminHeroSettings } from './HeroSettings';
import { AdminTelegramSettings } from './TelegramSettings';
import { AdminShippingRatesSettings } from './ShippingRatesSettings';
import { AdminSocialSettings } from './SocialSettings';
import { AdminDeliveryProvidersSettings } from './DeliveryProvidersSettings';
import { Image, ChevronDown, ChevronLeft, Send, Truck, Share2, MapPin } from 'lucide-react';

type SectionType = 'hero' | 'telegram' | 'shipping' | 'social' | 'delivery' | null;

export const AdminSettings = () => {
  const [expandedSection, setExpandedSection] = useState<SectionType>(null);

  const toggleSection = (section: SectionType) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-medium text-brand-text">إعدادات المتجر</h2>
        <p className="text-[13px] text-neutral-500 mt-1">تخصيص وإعداد واجهة المتجر والخيارات العامة والتشغيلية للمتجر.</p>
      </div>

      <div className="space-y-4 max-w-4xl">
        {/* SECTION: HERO BANNER SETTINGS */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => toggleSection('hero')}
            className="w-full flex items-center justify-between p-5 hover:bg-neutral-50/50 transition-colors text-right outline-none cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                expandedSection === 'hero' ? 'bg-brand-text text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                <Image size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-brand-text">البانر الإعلاني الرئيسي (Hero Banner)</h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">تعديل الصورة الكبيرة، والعنوان، والوصف، وزر التوجيه أعلى الصفحة الرئيسية.</p>
              </div>
            </div>
            <div className="text-neutral-400">
              {expandedSection === 'hero' ? (
                <ChevronDown size={20} className="transform rotate-180 transition-transform duration-200" />
              ) : (
                <ChevronLeft size={20} className="transition-transform duration-200" />
              )}
            </div>
          </button>

          {expandedSection === 'hero' && (
            <div className="border-t border-neutral-150 p-6 bg-neutral-50/30 animate-fade-in">
              <AdminHeroSettings />
            </div>
          )}
        </div>

        {/* SECTION: SHIPPING RATES */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => toggleSection('shipping')}
            className="w-full flex items-center justify-between p-5 hover:bg-neutral-50/50 transition-colors text-right outline-none cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                expandedSection === 'shipping' ? 'bg-brand-text text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                <Truck size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-brand-text">أسعار وخيارات التوصيل (Shipping Rates)</h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">تعديل تسعيرة التوصيل للمنزل أو المكتب وتغطية الولايات الجزائرية بالكامل.</p>
              </div>
            </div>
            <div className="text-neutral-400">
              {expandedSection === 'shipping' ? (
                <ChevronDown size={20} className="transform rotate-180 transition-transform duration-200" />
              ) : (
                <ChevronLeft size={20} className="transition-transform duration-200" />
              )}
            </div>
          </button>

          {expandedSection === 'shipping' && (
            <div className="border-t border-neutral-150 p-6 bg-neutral-50/30 animate-fade-in">
              <AdminShippingRatesSettings />
            </div>
          )}
        </div>

        {/* SECTION: DELIVERY PROVIDERS settings */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => toggleSection('delivery')}
            className="w-full flex items-center justify-between p-5 hover:bg-neutral-50/50 transition-colors text-right outline-none cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                expandedSection === 'delivery' ? 'bg-brand-text text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-brand-text">شركات التوصيل ومكاتب الاستلام (Delivery Providers)</h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">تحديد شركات التوصيل النشطة وتخصيص غطاء بلديات الاستلام من المكتب الكلي.</p>
              </div>
            </div>
            <div className="text-neutral-400">
              {expandedSection === 'delivery' ? (
                <ChevronDown size={20} className="transform rotate-180 transition-transform duration-200" />
              ) : (
                <ChevronLeft size={20} className="transition-transform duration-200" />
              )}
            </div>
          </button>

          {expandedSection === 'delivery' && (
            <div className="border-t border-neutral-150 p-6 bg-neutral-50/30 animate-fade-in">
              <AdminDeliveryProvidersSettings />
            </div>
          )}
        </div>

        {/* SECTION: TELEGRAM NOTIFICATIONS */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => toggleSection('telegram')}
            className="w-full flex items-center justify-between p-5 hover:bg-neutral-50/50 transition-colors text-right outline-none cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                expandedSection === 'telegram' ? 'bg-brand-text text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                <Send size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-brand-text">إشعارات تليجرام الفورية (Telegram Notifications)</h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">ضبط كود البوت لتلقي تنبيهات وتفاصيل جميع الطلبات الجديدة فور حدوثها.</p>
              </div>
            </div>
            <div className="text-neutral-400">
              {expandedSection === 'telegram' ? (
                <ChevronDown size={20} className="transform rotate-180 transition-transform duration-200" />
              ) : (
                <ChevronLeft size={20} className="transition-transform duration-200" />
              )}
            </div>
          </button>

          {expandedSection === 'telegram' && (
            <div className="border-t border-neutral-150 p-6 bg-neutral-50/30 animate-fade-in">
              <AdminTelegramSettings />
            </div>
          )}
        </div>

        {/* SECTION: SOCIAL SETTINGS */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => toggleSection('social')}
            className="w-full flex items-center justify-between p-5 hover:bg-neutral-50/50 transition-colors text-right outline-none cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                expandedSection === 'social' ? 'bg-brand-text text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                <Share2 size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-brand-text">روابط شبكات التواصل الاجتماعي (Social Links)</h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">تعديل روابط منصات الواتساب، فيسبوك، انستغرام، وتليجرام في فوتر المتجر.</p>
              </div>
            </div>
            <div className="text-neutral-400">
              {expandedSection === 'social' ? (
                <ChevronDown size={20} className="transform rotate-180 transition-transform duration-200" />
              ) : (
                <ChevronLeft size={20} className="transition-transform duration-200" />
              )}
            </div>
          </button>

          {expandedSection === 'social' && (
            <div className="border-t border-neutral-150 p-6 bg-neutral-50/30 animate-fade-in">
              <AdminSocialSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

