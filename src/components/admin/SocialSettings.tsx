import React, { useState, useEffect } from 'react';
import { getSocialSettings, updateSocialSettings } from '../../firebase';
import { SocialSettings } from '../../types';
import { Loader2, Save, AlertCircle, CheckCircle, Smartphone, Instagram, Facebook, Send } from 'lucide-react';

export const AdminSocialSettings: React.FC = () => {
  const [settings, setSettings] = useState<SocialSettings>({
    whatsapp: '',
    instagram: '',
    facebook: '',
    telegram: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getSocialSettings();
        if (data) {
          setSettings({
            whatsapp: data.whatsapp || '',
            instagram: data.instagram || '',
            facebook: data.facebook || '',
            telegram: data.telegram || '',
          });
        }
      } catch (err) {
        console.error('Error fetching social settings:', err);
        setError('فشل في تحميل إعدادات روابط التواصل الاجتماعي من قاعدة البيانات.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Clean WhatsApp format (keep digits only)
      const cleanWhatsapp = settings.whatsapp ? settings.whatsapp.replace(/\D/g, '') : '';
      const updatedData = {
        ...settings,
        whatsapp: cleanWhatsapp,
      };

      await updateSocialSettings(updatedData);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving social settings:', err);
      setError('فشل في حفظ إعدادات روابط التواصل في قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-brand-text">
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent mb-2" />
        <span className="text-[14px] text-neutral-500 font-medium mr-2">جاري تحميل إعدادات شبكات التواصل...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-semibold text-brand-text flex items-center gap-2">
          <span>روابط شبكات التواصل الاجتماعي (Social Links)</span>
        </h2>
        <p className="text-[13px] text-neutral-500 mt-1">تعديل وإدارة روابط منصات التواصل الاجتماعي للمتجر المعروضة في الفوتر.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle size={16} />
            <span>تم حفظ وتحديث روابط التواصل الاجتماعي بنجاح في النظام!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* WhatsApp Number */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Smartphone size={14} className="text-neutral-400" />
              <span>رقم الواتساب (WhatsApp Number)</span>
            </label>
            <input
              type="text"
              name="whatsapp"
              value={settings.whatsapp}
              onChange={handleChange}
              placeholder="مثال: 213550000000 (أدخل الأرقام فقط بدون رمز +)"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors text-left"
              dir="ltr"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed text-right">
              رقم الهاتف المرتبط بحساب الواتساب الخاص بالدعم للعملاء. يرجى البدء برمز الدولة (مثال الجزائر: 213).
            </p>
          </div>

          {/* Instagram Link */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Instagram size={14} className="text-neutral-400" />
              <span>رابط انستغرام (Instagram URL)</span>
            </label>
            <input
              type="text"
              name="instagram"
              value={settings.instagram}
              onChange={handleChange}
              placeholder="مثال: https://instagram.com/shoplix"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors text-left"
              dir="ltr"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed text-right">
              أدخل الرابط الكامل لصفحتك على منصة انستغرام.
            </p>
          </div>

          {/* Facebook Link */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Facebook size={14} className="text-neutral-400" />
              <span>رابط فيسبوك (Facebook URL)</span>
            </label>
            <input
              type="text"
              name="facebook"
              value={settings.facebook}
              onChange={handleChange}
              placeholder="مثال: https://facebook.com/shoplix.dz"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors text-left"
              dir="ltr"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed text-right">
              أدخل الرابط الكامل لصفحتك العامة على فيسبوك.
            </p>
          </div>

          {/* Telegram Link */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Send size={14} className="text-neutral-400" />
              <span>رابط تليجرام (Telegram URL)</span>
            </label>
            <input
              type="text"
              name="telegram"
              value={settings.telegram}
              onChange={handleChange}
              placeholder="مثال: https://t.me/shoplix_dz"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors text-left"
              dir="ltr"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed text-right">
              أدخل رابط قناتك أو حساب الدعم الخاص بك على منصة تليجرام.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6 border-t border-neutral-100 flex justify-end items-center">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-text text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save size={16} />
                حفظ الروابط الاجتماعية
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
