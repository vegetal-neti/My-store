import React, { useState, useEffect } from 'react';
import { getTelegramSettings, updateTelegramSettings, sendTelegramMessage } from '../../firebase';
import { TelegramSettings, TelegramBot } from '../../types';
import { Loader2, Save, Send, ShieldAlert, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

export const AdminTelegramSettings: React.FC = () => {
  const [settings, setSettings] = useState<TelegramSettings>({
    botToken: '',
    chatId: '',
    enabled: false,
    contactBotToken: '',
    contactChatId: '',
    contactEnabled: false,
    bots: [{ id: '1', botToken: '', chatId: '' }],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingContact, setTestingContact] = useState(false);
  const [testingBotId, setTestingBotId] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [testResultContact, setTestResultContact] = useState<{ success: boolean; message: string } | null>(null);
  const [testResultBotId, setTestResultBotId] = useState<{[key: string]: { success: boolean; message: string } | null}>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getTelegramSettings();
        if (data) {
          const initialBots = data.bots || [];
          if (initialBots.length === 0 && (data.botToken || data.chatId)) {
            initialBots.push({
              id: '1',
              botToken: data.botToken || '',
              chatId: data.chatId || '',
            });
          }
          if (initialBots.length === 0) {
            initialBots.push({
              id: String(Date.now()),
              botToken: '',
              chatId: '',
            });
          }

          setSettings({
            botToken: data.botToken || '',
            chatId: data.chatId || '',
            enabled: data.enabled || false,
            contactBotToken: data.contactBotToken || '',
            contactChatId: data.contactChatId || '',
            contactEnabled: data.contactEnabled || false,
            bots: initialBots,
            lastUsedBotIndex: data.lastUsedBotIndex || 0,
          });
        } else {
          setSettings({
            botToken: '',
            chatId: '',
            enabled: false,
            contactBotToken: '',
            contactChatId: '',
            contactEnabled: false,
            bots: [{ id: '1', botToken: '', chatId: '' }],
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
  };

  const handleBotChange = (id: string, field: 'botToken' | 'chatId', value: string) => {
    setSettings(prev => {
      const updated = (prev.bots || []).map(b => b.id === id ? { ...b, [field]: value } : b);
      return { ...prev, bots: updated };
    });
    setSuccess(false);
  };

  const handleAddBot = () => {
    setSettings(prev => {
      const current = prev.bots || [];
      return {
        ...prev,
        bots: [...current, { id: String(Date.now()), botToken: '', chatId: '' }]
      };
    });
    setSuccess(false);
  };

  const handleRemoveBot = (id: string) => {
    setSettings(prev => {
      const current = prev.bots || [];
      if (current.length <= 1) return prev;
      return {
        ...prev,
        bots: current.filter(b => b.id !== id)
      };
    });
    setSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      setTestResultContact(null);
      setTestResultBotId({});

      const activeBots = settings.bots || [];
      if (settings.enabled && activeBots.some(b => !b.botToken || !b.chatId)) {
        setError('يرجى ملء حقل Bot Token و Chat ID لجميع البوتات النشطة المضافة.');
        setSaving(false);
        return;
      }

      const firstBot = activeBots[0];
      const payload: TelegramSettings = {
        ...settings,
        botToken: firstBot?.botToken || '',
        chatId: firstBot?.chatId || '',
      };

      await updateTelegramSettings(payload);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4500);
    } catch (err) {
      console.error('Error saving Telegram settings:', err);
      setError('فشل في حفظ إعدادات تليجرام في قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestBotConnection = async (bot: TelegramBot) => {
    if (!bot.botToken || !bot.chatId) {
      setTestResultBotId(prev => ({
        ...prev,
        [bot.id]: {
          success: false,
          message: 'يرجى ملء حقل Bot Token و Chat ID أولاً لإجراء الاختبار.',
        }
      }));
      return;
    }

    try {
      setTestingBotId(bot.id);
      setTestResultBotId(prev => ({ ...prev, [bot.id]: null }));
      
      const testText = `🔌 <b>رسالة تجربة اتصال إشعارات الطلبات (البوت المتعدد)!</b>\n\n` +
        `✅ تم ربط هذا البوت بنجاح لتلقي الإشعارات في توزيع Round Robin من متجرك.\n` +
        `⏰ <b>وقت التجربة:</b> ${new Date().toLocaleTimeString('ar-DZ')}`;

      const isOk = await sendTelegramMessage(bot.botToken, bot.chatId, testText);
      
      if (isOk) {
        setTestResultBotId(prev => ({
          ...prev,
          [bot.id]: {
            success: true,
            message: 'تم إرسال رسالة تجريبية بنجاح! يرجى التحقق من تطبيق تليجرام لهذا البوت.',
          }
        }));
      } else {
        setTestResultBotId(prev => ({
          ...prev,
          [bot.id]: {
            success: false,
            message: 'فشل إرسال الرسالة. يرجى التحقق من صحة الـ Bot Token ومعرّف Chat ID.',
          }
        }));
      }
    } catch (err) {
      console.error('Error testing bot connection:', err);
      setTestResultBotId(prev => ({
        ...prev,
        [bot.id]: {
          success: false,
          message: 'خطأ أثناء الاتصال بخوادم تليجرام. يرجى التأكد من اتصال الإنترنت وصحة الرموز.',
        }
      }));
    } finally {
      setTestingBotId(null);
    }
  };

  const handleTestConnection = async (type: 'order' | 'contact') => {
    if (type !== 'contact') return;
    const token = settings.contactBotToken;
    const cid = settings.contactChatId;

    if (!token || !cid) {
      setTestResultContact({
        success: false,
        message: 'يرجى ملء حقل Bot Token و Chat ID أولاً لإجراء الاختبار.',
      });
      return;
    }

    try {
      setTestingContact(true);
      setTestResultContact(null);
      
      const testText = `🔌 <b>رسالة تجربة اتصال إشعارات تواصل معنا!</b>\n\n` +
        `✅ تم ربط البوت بنجاح لتلقي رسائل نموذج تواصل معنا / Contact Us.\n` +
        `⏰ <b>وقت التجربة:</b> ${new Date().toLocaleTimeString('ar-DZ')}`;

      const isOk = await sendTelegramMessage(token, cid, testText);
      
      if (isOk) {
        setTestResultContact({
          success: true,
          message: 'تم إرسال رسالة تجريبية بنجاح! يرجى التحقق من تطبيق تليجرام.',
        });
      } else {
        setTestResultContact({
          success: false,
          message: 'فشل إرسال الرسالة. يرجى التحقق من صحة الـ Bot Token ومعرّف Chat ID.',
        });
      }
    } catch (err) {
      console.error('Error testing Telegram connection:', err);
      setTestResultContact({
        success: false,
        message: 'خطأ أثناء الاتصال بخوادم تليجرام. يرجى التأكد من اتصال الإنترنت وصحة الرموز.',
      });
    } finally {
      setTestingContact(false);
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
        <p className="text-[13px] text-neutral-500 mt-1">تعبئة إعدادات البوت والدردشة لتلقي إشعارات منفصلة ومخصصة للطلبات والتواصل معنا فور حدوثها.</p>
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

        {/* ======================================================== */}
        {/* SUBSECTION 1: ORDER NOTIFICATIONS */}
        {/* ======================================================== */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <h3 className="text-[15px] font-bold text-brand-text">إشعارات الطلبات (Order Telegram Notifications)</h3>
          </div>

          {/* Enable / Disable Switch */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-150">
            <div>
              <h4 className="text-[14px] font-semibold text-brand-text">حالة ربط إشعارات الطلبات</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">عند تفعيل هذا الخيار، سيتم توجيه جميع الطلبات وتحديثاتها فوراً لـ بوت الطلبات.</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
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

          {/* List of configured Bots */}
          <div className="space-y-6 pt-2">
            {(settings.bots || []).map((bot, index) => (
              <div key={bot.id} className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-4 relative">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                  <span className="text-[13px] font-bold text-neutral-600 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[11px] font-mono">
                      {index + 1}
                    </span>
                    البوت الموزع رقم {index + 1}
                  </span>
                  
                  {/* Delete button if there is more than 1 bot */}
                  {(settings.bots || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBot(bot.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                    >
                      حذف هذا البوت
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bot Token */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                      رمز البوت الفريد (Bot Token) *
                    </label>
                    <input
                      type="text"
                      required={settings.enabled}
                      value={bot.botToken}
                      onChange={(e) => handleBotChange(bot.id, 'botToken', e.target.value)}
                      placeholder="مثال: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[13px] transition-colors font-mono tracking-widest text-left"
                      dir="ltr"
                    />
                  </div>

                  {/* Chat ID */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                      معرّف المحادثة والمستقبل (Chat ID) *
                    </label>
                    <input
                      type="text"
                      required={settings.enabled}
                      value={bot.chatId}
                      onChange={(e) => handleBotChange(bot.id, 'chatId', e.target.value)}
                      placeholder="مثال: 9876543210 أو -100123456789"
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[13px] transition-colors font-mono tracking-wider text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Connection Test for this Bot */}
                <div className="flex flex-col sm:flex-row gap-3 justify-start items-center pt-1.5">
                  <button
                    type="button"
                    disabled={testingBotId !== null || saving}
                    onClick={() => handleTestBotConnection(bot)}
                    className="px-4 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {testingBotId === bot.id ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-neutral-500" />
                        جاري فحص هذا الاتصال...
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        اختبار اتصال هذا البوت (Test Bot #{index + 1})
                      </>
                    )}
                  </button>
                </div>

                {testResultBotId[bot.id] && (
                  <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-fade-in ${
                    testResultBotId[bot.id]?.success ? 'bg-green-50 border-green-100 text-green-800' : 'bg-amber-50 border-amber-100 text-amber-800'
                  }`}>
                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{testResultBotId[bot.id]?.success ? 'تنبيه اتصال ناجح' : 'خطأ في الربط التجريبي'}</p>
                      <p className="mt-1 leading-normal font-normal">{testResultBotId[bot.id]?.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Bot Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAddBot}
                className="px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 text-neutral-600 hover:text-brand-text hover:border-brand-text hover:bg-neutral-50 text-[13px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                + إضافة بوت إشعارات إضافي (Round Robin Bot)
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed text-right">
              * عند إضافة أكثر من بوت، سيقوم النظام تلقائياً بتوزيع الطلبات الجديدة المتلقاة لضمان التوزيع المتوازن (Round Robin) دون الضغط على بوت واحد أو لتقسيم المتابعة.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-200/80 my-8" />

        {/* ======================================================== */}
        {/* SUBSECTION 2: CONTACT NOTIFICATIONS */}
        {/* ======================================================== */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="text-[15px] font-bold text-brand-text">إشعارات تواصل معنا (Contact Telegram Notifications)</h3>
          </div>

          {/* Enable / Disable Switch */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-150">
            <div>
              <h4 className="text-[14px] font-semibold text-brand-text">حالة ربط إشعارات تواصل معنا</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">عند تفعيل هذا الخيار، سيتم إرسال رسائل استفسارات العملاء فوراً لـ بوت التواصل.</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, contactEnabled: !prev.contactEnabled }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.contactEnabled ? 'bg-brand-text' : 'bg-neutral-200'
              }`}
              role="switch"
              aria-checked={settings.contactEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.contactEnabled ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="md:col-span-2">
              <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                رمز البوت الفريد (Contact Bot Token) *
              </label>
              <input
                type="text"
                name="contactBotToken"
                required={settings.contactEnabled}
                value={settings.contactBotToken}
                onChange={handleChange}
                placeholder="مثال: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors font-mono tracking-widest text-left"
                dir="ltr"
              />
              <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed text-right">
                رمز البوت الفريد الخاص باستلام استفسارات ورسائل العملاء القادمة من نموذج تواصل معنا.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                معرّف المحادثة والمستقبل (Contact Chat ID) *
              </label>
              <input
                type="text"
                name="contactChatId"
                required={settings.contactEnabled}
                value={settings.contactChatId}
                onChange={handleChange}
                placeholder="مثال: 9876543210 أو -100123456789 (للقنوات والمجموعات)"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-brand-text text-[14px] transition-colors font-mono tracking-wider text-left"
                dir="ltr"
              />
              <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed text-right">
                المعرف الفريد لاستقبال الاستفسارات (قد يكون مجموعتكم الإدارية أو حسابكم الشخصي المستقل).
              </p>
            </div>
          </div>

          {/* Independent Test Action for Contact */}
          <div className="flex flex-col sm:flex-row gap-3 justify-start items-center pt-2">
            <button
              type="button"
              disabled={testingContact || saving}
              onClick={() => handleTestConnection('contact')}
              className="w-full sm:w-auto px-5 py-2.5 border border-neutral-200 text-brand-text hover:bg-neutral-50 disabled:opacity-50 transition-colors rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {testingContact ? (
                <>
                  <Loader2 size={15} className="animate-spin text-neutral-500" />
                  جاري فحص اتصال التواصل معنا...
                </>
              ) : (
                <>
                  <Send size={15} />
                  اختبار ربط تواصل معنا (Test Contact Connection)
                </>
              )}
            </button>
          </div>

          {testResultContact && (
            <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-fade-in ${
              testResultContact.success ? 'bg-green-50 border-green-100 text-green-800' : 'bg-amber-50 border-amber-100 text-amber-800'
            }`}>
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{testResultContact.success ? 'تنبيه اتصال ناجح لبوت التواصل' : 'خطأ في الربط التجريبي لبوت التواصل'}</p>
                <p className="mt-1 leading-normal font-normal">{testResultContact.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Global Save Button at the Bottom */}
        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row gap-3 justify-end items-center">
          <button
            type="submit"
            disabled={saving || testingBotId !== null || testingContact}
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-text text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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

