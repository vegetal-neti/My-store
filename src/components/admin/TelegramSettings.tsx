import React, { useState, useEffect } from 'react';
import { getTelegramSettings, updateTelegramSettings, sendTelegramMessage } from '../../firebase';
import { TelegramSettings } from '../../types';
import { Loader2, Save, Send, ShieldAlert, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

export const AdminTelegramSettings: React.FC = () => {
  const [settings, setSettings] = useState<TelegramSettings>({
    botToken: '',
    chatId: '',
    enabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getTelegramSettings();
        if (data) {
          setSettings({
            botToken: data.botToken || '',
            chatId: data.chatId || '',
            enabled: data.enabled || false,
          });
        }
      } catch (err) {
        console.error('Error fetching Telegram settings:', err);
        setError('فشل في تحميل إعدادات تليجرام من قاعدة البيانات.');
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
    setTestResult(null);
  };

  const handleToggle = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
    setSuccess(false);
    setTestResult(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      setTestResult(null);

      await updateTelegramSettings(settings);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving Telegram settings:', err);
      setError('فشل في حفظ إعدادات تليجرام في قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.botToken || !settings.chatId) {
      setTestResult({
        success: false,
        message: 'يرجى ملء حقل Bot Token و Chat ID أولاً لإجراء الاختبار.',
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      
      const testText = `🔌 <b>رسالة تجربة الاتصال من لوحة التحكم!</b>\n\n` +
        `✅ تم ربط البوت الهاتفي بنجاح مع متجرك الإلكتروني.\n` +
        `🔔 ستصلك الإشعارات هنا فوراً فور قيام أي زبون بتأكيد طلب جديد.\n\n` +
        `⏰ <b>وقت التجربة:</b> ${new Date().toLocaleTimeString('ar-DZ')}`;

      const isOk = await sendTelegramMessage(settings.botToken, settings.chatId, testText);
      
      if (isOk) {
        setTestResult({
          success: true,
          message: 'تم إرسال رسالة تجريبية بنجاح! يرجى التحقق من تطبيق تليجرام.',
        });
      } else {
        setTestResult({
          success: false,
          message: 'فشل إرسال الرسالة. يرجى التحقق من صحة الـ Bot Token ومعرّف Chat ID.',
        });
      }
    } catch (err) {
      console.error('Error testing Telegram connection:', err);
      setTestResult({
        success: false,
        message: 'خطأ أثناء الاتصال بخوادم تليجرام. يرجى التأكد من اتصال الإنترنت وصحة الرموز.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-brand-text">
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent mb-2" />
        <span className="text-[14px] text-neutral-500 font-medium mr-2">جاري تحميل إعدادات تليجرام...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-semibold text-brand-text flex items-center gap-2">
          <span>إعداد إشعارات تليجرام الفورية (Telegram Notifications)</span>
          <Sparkles size={16} className="text-brand-accent animate-pulse" />
        </h2>
        <p className="text-[13px] text-neutral-500 mt-1">تفعيل وصول تفاصيل الطلبات الجديدة مباشرةً إلى هاتفك عن طريق بوت تليجرام مخصص.</p>
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
            <span>تم حفظ خيارات إشعارات تليجرام وتعديلها بنجاح في النظام!</span>
          </div>
        )}

        {/* Enable / Disable Switch */}
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-150">
          <div>
            <h4 className="text-[14px] font-semibold text-brand-text">حالة الربط والإشعارات</h4>
            <p className="text-[11px] text-neutral-400 mt-0.5">عند تفعيل هذا الخيار، سيتم توجيه جميع الطلبات فوراً إلى حساب تليجرام الخاص بك.</p>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.enabled ? 'bg-brand-text' : 'bg-neutral-200'
            }`}
            role="switch"
            aria-checked={settings.enabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.enabled ? '-translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Form Fields Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Bot Token Entry */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              رمز البوت الفريد (Bot Token) *
            </label>
            <input
              type="text"
              name="botToken"
              required
              value={settings.botToken}
              onChange={handleChange}
              placeholder="مثال: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors font-mono tracking-widest text-left"
              dir="ltr"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed text-right">
              الرمز المميز الذي تحصل عليه من ميزة BotFather عند إنشاء بوت جديد على تطبيق تليجرام.
            </p>
          </div>

          {/* Chat ID Entry */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              معرّف المحادثة والمستقبل (Chat ID) *
            </label>
            <input
              type="text"
              name="chatId"
              required
              value={settings.chatId}
              onChange={handleChange}
              placeholder="مثال: 9876543210 أو -100123456789 (للقنوات والمجموعات)"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors font-mono tracking-wider text-left"
              dir="ltr"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed text-right">
              رقم المحادثة الفريد الخاص بك (يمكنك الحصول عليه عبر مراسلة <code>@userinfobot</code>) أو رقم المعرف الخاص بالجروب/القناة بعد إضافة البوت كمشرف.
            </p>
          </div>
        </div>

        {/* Test Result Info Frame */}
        {testResult && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-fade-in ${
            testResult.success ? 'bg-green-50 border-green-100 text-green-800' : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}>
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{testResult.success ? 'تنبيه اتصال ناجح' : 'خطأ في الربط والربط التجريبي'}</p>
              <p className="mt-1 leading-normal font-normal">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Interactive Actions Tray */}
        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
          {/* Test connection action */}
          <button
            type="button"
            disabled={testing || saving}
            onClick={handleTestConnection}
            className="w-full sm:w-auto px-5 py-3 border border-neutral-200 text-brand-text hover:bg-neutral-50 disabled:opacity-50 transition-colors rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            {testing ? (
              <>
                <Loader2 size={15} className="animate-spin text-neutral-500" />
                جاري فحص الاتصال التفاعلي...
              </>
            ) : (
              <>
                <Send size={15} />
                اختبار الربط الفوري (Test Connection)
              </>
            )}
          </button>

          {/* Normal save action */}
          <button
            type="submit"
            disabled={saving || testing}
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-text text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري الحفظ والتفعيل...
              </>
            ) : (
              <>
                <Save size={16} />
                حفظ وإلزام التغييرات لـ تليجرام
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
