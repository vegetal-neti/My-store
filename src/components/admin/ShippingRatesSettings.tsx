import React, { useState, useEffect } from 'react';
import { getShippingRates, updateShippingRate } from '../../firebase';
import { ShippingRate } from '../../types';
import { algeriaWilayas, Wilaya as StaticWilaya } from '../../data/algeriaCities';
import { Loader2, Search, Save, Check, Ban, Globe, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminShippingRatesSettings: React.FC = () => {
  const [rates, setRates] = useState<Record<number, ShippingRate>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status for inline saves to provide beautiful visual feedback
  const [saveStatus, setSaveStatus] = useState<Record<number, 'success' | 'error' | null>>({});

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        const firestoreRates = await getShippingRates();
        
        // Build a lookup map of rates from Firestore
        const ratesMap: Record<number, ShippingRate> = {};
        
        // Pre-populate with all 58 Wilayas from static data so they are all present
        algeriaWilayas.forEach((w) => {
          ratesMap[w.id] = {
            wilayaId: w.id,
            wilayaName: w.name,
            wilayaNameEn: w.nameEn,
            homePrice: w.shippingHome,
            deskPrice: w.shippingPickup,
            enabled: true, // Enabled by default
          };
        });

        // Overlay with Firestore customized rates if available
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

        setRates(ratesMap);
      } catch (err) {
        console.error('Error fetching shipping rates:', err);
        setError('تعذر تحميل أسعار التوصيل من قاعدة البيانات. يرجى التحقق من اتصال الإنترنت.');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const handlePriceChange = (wilayaId: number, field: 'homePrice' | 'deskPrice', value: string) => {
    const numVal = value === '' ? 0 : Number(value);
    if (isNaN(numVal)) return;

    setRates(prev => ({
      ...prev,
      [wilayaId]: {
        ...prev[wilayaId],
        [field]: numVal
      }
    }));

    // Reset row save status on modification
    if (saveStatus[wilayaId]) {
      setSaveStatus(prev => ({ ...prev, [wilayaId]: null }));
    }
  };

  const handleToggleEnabled = (wilayaId: number) => {
    setRates(prev => ({
      ...prev,
      [wilayaId]: {
        ...prev[wilayaId],
        enabled: !prev[wilayaId].enabled
      }
    }));

    // Reset row save status on modification
    if (saveStatus[wilayaId]) {
      setSaveStatus(prev => ({ ...prev, [wilayaId]: null }));
    }
  };

  const handleSaveRow = async (wilayaId: number) => {
    try {
      setSavingId(wilayaId);
      setError(null);
      setSuccessMsg(null);
      setSaveStatus(prev => ({ ...prev, [wilayaId]: null }));

      const rateToSave = rates[wilayaId];
      if (!rateToSave) return;

      await updateShippingRate({
        wilayaId: rateToSave.wilayaId,
        wilayaName: rateToSave.wilayaName,
        wilayaNameEn: rateToSave.wilayaNameEn,
        homePrice: rateToSave.homePrice,
        deskPrice: rateToSave.deskPrice,
        enabled: rateToSave.enabled
      });

      setSaveStatus(prev => ({ ...prev, [wilayaId]: 'success' }));
      setSuccessMsg(`تم حفظ وتحديث أسعار ولاية (${rateToSave.wilayaName}) بنجاح.`);
      
      // Auto-clear success check after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [wilayaId]: null }));
      }, 3000);
      
    } catch (err) {
      console.error('Error saving rate:', err);
      setSaveStatus(prev => ({ ...prev, [wilayaId]: 'error' }));
      setError(`خطأ أثناء حفظ أسعار الولاية المحددة.`);
    } finally {
      setSavingId(null);
    }
  };

  const handleResetToDefaults = () => {
    const resetMap: Record<number, ShippingRate> = {};
    algeriaWilayas.forEach((w) => {
      resetMap[w.id] = {
        wilayaId: w.id,
        wilayaName: w.name,
        wilayaNameEn: w.nameEn,
        homePrice: w.shippingHome,
        deskPrice: w.shippingPickup,
        enabled: true,
      };
    });
    setRates(resetMap);
    setSaveStatus({});
    setSuccessMsg('تمت إعادة تعيين القيم المعروضة للقيم الافتراضية بنجاح.');
  };

  // Filter 58 Wilayas based on Arabic name, English name, or Code
  const filteredWilayas = algeriaWilayas.filter(staticW => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    const rateMeta = rates[staticW.id];
    const codeStr = String(staticW.id).padStart(2, '0');
    
    return (
      staticW.name.includes(searchLower) ||
      staticW.nameEn.toLowerCase().includes(searchLower) ||
      codeStr.includes(searchLower) ||
      String(staticW.id).includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-brand-text">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500 mb-2" />
        <span className="text-[14px] text-neutral-500 font-medium">جاري تحميل ولايات الجزائر وأسعار التوصيل الفعّالة...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-semibold text-brand-text flex items-center gap-2">
          <span>إدارة أسعار التوصيل الولائية (Dynamic Shipping Rates)</span>
        </h2>
        <p className="text-[13px] text-neutral-500 mt-1">تحديد تكاليف التوصيل للمنزل أو الاستلام من المكتب لكل ولاية من ولايات الجزائر الـ 58، أو إيقاف التوصيل لبعض الولايات تماماً.</p>
      </div>

      <div className="max-w-4xl bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        
        {/* Banner notification space */}
        {(error || successMsg) && (
          <div className="p-4 border-b border-neutral-100">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px] font-medium flex items-center gap-2.5 animate-fade-in">
                <CheckCircle size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Actions and Search */}
        <div className="p-5 bg-neutral-50/50 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="ابحث باسم الولاية (مثال. وهران) أو رقم الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-neutral-200 rounded-xl text-[14px] outline-none focus:border-brand-text transition-colors"
            />
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-2 text-[12px] font-semibold text-neutral-500 bg-white border border-neutral-250 hover:bg-neutral-50 active:scale-95 transition-all rounded-xl flex items-center justify-center gap-2 self-start sm:self-center"
          >
            <RefreshCw size={13} />
            استعادة الأسعار الافتراضية للكود
          </button>
        </div>

        {/* Wilayas List / Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto no-scrollbar">
          {filteredWilayas.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 text-[14px]">
              لم يتم العثور على ولايات تطابق استعلام البحث المكتوب.
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-neutral-50/70 border-b border-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wider sticky top-0 bg-white z-10 select-none">
                  <th className="py-3 px-5 text-center w-16">الكود</th>
                  <th className="py-3 px-4">الولاية</th>
                  <th className="py-3 px-4 w-32">توصيل المنزل (دج)</th>
                  <th className="py-3 px-4 w-32">استلام المكتب (دج)</th>
                  <th className="py-3 px-4 text-center w-28">حالة التوصيل</th>
                  <th className="py-3 px-5 text-center w-16">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredWilayas.map((staticW) => {
                  const rate = rates[staticW.id] || {
                    wilayaId: staticW.id,
                    wilayaName: staticW.name,
                    wilayaNameEn: staticW.nameEn,
                    homePrice: staticW.shippingHome,
                    deskPrice: staticW.shippingPickup,
                    enabled: true
                  };

                  const isSaving = savingId === staticW.id;
                  const rowStatus = saveStatus[staticW.id];
                  const codePadded = String(staticW.id).padStart(2, '0');

                  return (
                    <tr 
                      key={staticW.id} 
                      className={`hover:bg-neutral-50/30 transition-colors text-[13px] ${
                        !rate.enabled ? 'bg-red-50/20 opacity-75' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-5 font-mono text-center text-neutral-400 font-bold">
                        {codePadded}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-brand-text">
                        <span>{rate.wilayaName}</span>
                        <span className="text-[11px] text-neutral-400 mr-1.5 font-normal">({rate.wilayaNameEn})</span>
                      </td>

                      {/* Home price */}
                      <td className="py-3.5 px-4">
                        <input
                          type="number"
                          min="0"
                          disabled={!rate.enabled}
                          value={rate.homePrice === 0 ? '' : rate.homePrice}
                          placeholder="0"
                          onChange={(e) => handlePriceChange(staticW.id, 'homePrice', e.target.value)}
                          className="w-full text-center px-2 py-1.5 border border-neutral-200 focus:border-brand-text rounded-lg bg-white outline-none font-medium disabled:bg-neutral-50 disabled:opacity-60"
                        />
                      </td>

                      {/* Desk price */}
                      <td className="py-3.5 px-4">
                        <input
                          type="number"
                          min="0"
                          disabled={!rate.enabled}
                          value={rate.deskPrice === 0 ? '' : rate.deskPrice}
                          placeholder="0"
                          onChange={(e) => handlePriceChange(staticW.id, 'deskPrice', e.target.value)}
                          className="w-full text-center px-2 py-1.5 border border-neutral-200 focus:border-brand-text rounded-lg bg-white outline-none font-medium disabled:bg-neutral-50 disabled:opacity-60"
                        />
                      </td>

                      {/* Status switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(staticW.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            rate.enabled ? 'bg-brand-text' : 'bg-neutral-200'
                          }`}
                          role="switch"
                          aria-checked={rate.enabled}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              rate.enabled ? '-translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-bold block mt-1 ${
                          rate.enabled ? 'text-emerald-600' : 'text-neutral-400'
                        }`}>
                          {rate.enabled ? 'متوفرة التوصيل' : 'مغلق'}
                        </span>
                      </td>

                      {/* Inline actions */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveRow(staticW.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
                            rowStatus === 'success'
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              : rowStatus === 'error'
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-brand-text hover:bg-neutral-800 text-white disabled:opacity-50'
                          }`}
                          title="حفظ تعديل هذه الولاية"
                        >
                          {isSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : rowStatus === 'success' ? (
                            <Check size={14} strokeWidth={3} />
                          ) : rowStatus === 'error' ? (
                            <Ban size={14} />
                          ) : (
                            <Save size={14} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info counts */}
        <div className="p-4 bg-neutral-50/70 border-t border-neutral-100 text-[12px] text-neutral-500 flex justify-between items-center px-6 font-medium">
          <div>
            <span>إجمالي الولايات المدرجة: </span>
            <span className="font-bold text-brand-text">58 ولاية كاملة</span>
          </div>
          <div>
            <span>مصدر البيانات: </span>
            <span className="font-bold text-brand-text">الديوان الوطني للإحصائيات (المرجع الجزائري الرسمي)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
