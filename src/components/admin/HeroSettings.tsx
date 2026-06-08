import React, { useState, useEffect, useRef } from 'react';
import { getHeroSettings, updateHeroSettings, uploadHeroImage } from '../../firebase';
import { HeroSettings } from '../../types';
import { Upload, Save, Loader2, Sparkles, Trash2, ArrowRight, Image as ImageIcon } from 'lucide-react';

export const AdminHeroSettings: React.FC = () => {
  const [settings, setSettings] = useState<HeroSettings>({
    badge: 'Spring / Summer 26',
    title: 'The Linen Collection',
    description: 'Crafting premium garments with elegant silhouettes.',
    ctaText: 'Shop New Season',
    ctaLink: 'all',
    imageUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        setLoading(true);
        const data = await getHeroSettings();
        if (data) {
          setSettings(prev => ({
            ...prev,
            ...data
          }));
        }
      } catch (err) {
        console.error('Error fetching hero settings', err);
        setError('فشل في تحميل إعدادات البانر من قاعدة البيانات.');
      } finally {
        setLoading(false);
      }
    };
    fetchHero();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      setSuccess(false);
      const url = await uploadHeroImage(file);
      setSettings(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error('Error uploading image', err);
      setError('فشل رفع الصورة إلى التخزين السحابي. يرجى المحاولة لاحقاً.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering file selection
    setSettings(prev => ({ ...prev, imageUrl: '' }));
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await updateHeroSettings(settings);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4500);
    } catch (err) {
      console.error('Error saving hero settings', err);
      setError('فشل في حفظ الإعدادات في قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-brand-text">
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent mb-2" />
        <span className="text-[14px] text-neutral-500 font-medium mr-2">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-semibold text-brand-text flex items-center gap-2">
          <span>تخصيص البانر الرئيسي (Hero Banner)</span>
          <Sparkles size={16} className="text-yellow-500 animate-pulse" />
        </h2>
        <p className="text-[13px] text-neutral-500 mt-1">تعديل الإعلانات والصورة الرئيسية التي تظهر للمتسوقين أعلى الشاشة للتطبيق.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-semibold animate-fade-in">
            تم حفظ وتفعيل البانر الإعلاني بنجاح واهتز بثبات في جميع واجهات التطبيق!
          </div>
        )}

        {/* Dynamic & Interactive Banner visual editor */}
        <div className="space-y-2">
          <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider">
            صورة ومظهر البانر التفاعلي (انقر على الصورة للتغيير أو الرفع)
          </label>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="h-[380px] rounded-[2rem] p-8 flex flex-col justify-end relative overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer group select-none text-right"
            style={{
              backgroundColor: settings.imageUrl ? 'transparent' : '#d4c0ab',
              backgroundImage: settings.imageUrl ? `url('${settings.imageUrl}')` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Dark overlay for contrast */}
            <div className={`absolute inset-0 bg-neutral-950/25 transition-opacity group-hover:bg-neutral-950/35 z-0`} />

            {/* Quick Helper Overlay for upload indicator */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {uploading ? (
                <div className="bg-brand-text/90 backdrop-blur-md text-white rounded-full px-4 py-2 text-[12px] font-medium flex items-center gap-1.5 shadow-sm">
                  <Loader2 size={14} className="animate-spin" />
                  <span>جاري رفع الصورة...</span>
                </div>
              ) : (
                <div className="bg-brand-text/80 backdrop-blur-md text-white rounded-full px-4 py-2 text-[12px] font-medium flex items-center gap-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={14} />
                  <span>انقر لتغيير الصورة العامة</span>
                </div>
              )}
              {settings.imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-sm z-30 flex items-center justify-center transition-colors hover:scale-105"
                  title="حذف الصورة والعودة للخلفية الافتراضية"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Dynamic visual preview values mapped directly to text overlay */}
            <div className="relative z-10 flex flex-col items-start max-w-full">
              {settings.badge && (
                <p className="text-[10px] tracking-[0.22em] font-semibold text-white/95 mb-3 uppercase drop-shadow-sm">
                  {settings.badge}
                </p>
              )}
              <h2 className="font-serif italic text-[2rem] md:text-[2.5rem] leading-[1.1] text-white mb-4 drop-shadow-sm max-w-xl break-words">
                {settings.title || 'العنوان الرئيسي للبانر'}
              </h2>
              {settings.description && (
                <p className="text-[13px] text-white/90 mb-6 leading-relaxed max-w-[280px] drop-shadow-sm break-words line-clamp-3">
                  {settings.description}
                </p>
              )}
              <div 
                className="bg-white/95 hover:bg-white transition-all text-brand-text rounded-full py-3 px-5 flex items-center justify-between w-[220px] shadow-sm"
              >
                <span className="text-[13px] font-semibold tracking-wide">{settings.ctaText || 'تسوق الآن'}</span>
                <ArrowRight size={16} strokeWidth={1.5} />
              </div>
            </div>

            {/* Hint overlay when absolutely no image is set */}
            {!settings.imageUrl && !uploading && (
              <div className="absolute inset-x-0 top-0 bottom-24 flex items-center justify-center pointer-events-none z-10 transition-transform group-hover:-translate-y-1">
                <div className="bg-white/90 text-brand-text border border-neutral-200/40 rounded-2xl px-5 py-3 shadow-md text-center max-w-xs backdrop-blur-sm">
                  <ImageIcon className="mx-auto w-6 h-6 mb-1.5 text-neutral-500 animate-pulse" />
                  <p className="text-xs font-semibold">بإمكانك رفع صورة مخصصة كخلفية للبانر</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">انقر لرفع ملف الصورة</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inputs section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              العنوان الرئيسي للبانر (Title) *
            </label>
            <input
              type="text"
              name="title"
              required
              value={settings.title || ''}
              onChange={handleChange}
              placeholder="مثال: تشكيلة الكتان الصيفية"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors font-serif"
            />
          </div>

          {/* Subtitle/Badge */}
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              الملصق العلوي الصغير للبانر (Badge)
            </label>
            <input
              type="text"
              name="badge"
              value={settings.badge || ''}
              onChange={handleChange}
              placeholder="مثال: ربيع / صيف 26"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors"
            />
          </div>

          {/* CTA Link ID */}
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              رابط التوجيه أو معرّف الفئة (CTA Link)
            </label>
            <input
              type="text"
              name="ctaLink"
              value={settings.ctaLink || ''}
              onChange={handleChange}
              placeholder="مثال: all أو معرّف الفئة أو رابط خارجي مثل https://..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              الوصف التفصيلي (Description)
            </label>
            <textarea
              name="description"
              rows={3}
              value={settings.description || ''}
              onChange={handleChange}
              placeholder="مثال: ننسج خيوط الطبيعة لنوفر لك إطلالة صيفية مريحة وأنيقة مستوحاة من البساطة..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Buttons Setup */}
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              نص زر التوجيه (CTA Text)
            </label>
            <input
              type="text"
              name="ctaText"
              value={settings.ctaText || ''}
              onChange={handleChange}
              placeholder="مثال: تسوق الموسم الجديد"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-100 flex justify-end">
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-6 py-3.5 bg-brand-text text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors rounded-xl text-[14px] font-semibold flex items-center gap-2 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري الحفظ والتفعيل...
              </>
            ) : (
              <>
                <Save size={16} />
                حفظ وتفعيل البانر الإعلاني
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
