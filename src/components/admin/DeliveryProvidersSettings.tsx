import React, { useState, useEffect } from 'react';
import { getDeliveryProvidersSettings, updateDeliveryProvidersSettings } from '../../firebase';
import { DeliveryProvider } from '../../types';
import { algeriaWilayas } from '../../data/algeriaCities';
import { algeriaCommunes } from '../../data/algeriaCommunes';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  Check, 
  Search, 
  X, 
  Truck, 
  Info, 
  AlertCircle,
  CheckSquare,
  MinusSquare,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

export const AdminDeliveryProvidersSettings: React.FC = () => {
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Editing state
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formSupportedCommunes, setFormSupportedCommunes] = useState<Record<string, string[]>>({});
  const [formActive, setFormActive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Search/Filters inside the Form
  const [selectedWilayaIdForm, setSelectedWilayaIdForm] = useState<number>(1); // default to Wilaya 1 (Adrar)
  const [communeSearchQuery, setCommuneSearchQuery] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getDeliveryProvidersSettings();
        if (data && Array.isArray(data.providers)) {
          setProviders(data.providers);
        } else {
          setProviders([]);
        }
      } catch (err) {
        console.error('Error fetching delivery settings:', err);
        setError('فشل في تحميل إعدادات شركات التوصيل.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const saveToFirebase = async (updatedProviders: DeliveryProvider[]) => {
    setSaving(true);
    setError(null);
    try {
      await updateDeliveryProvidersSettings({ providers: updatedProviders });
      setProviders(updatedProviders);
      showSuccess('تم حفظ التغييرات بنجاح!');
    } catch (err) {
      console.error('Error saving providers:', err);
      setError('فشل في حفظ البيانات في قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  // Open Form for Adding
  const handleAddNew = () => {
    setEditingProviderId(null);
    setFormName('');
    setFormSupportedCommunes({});
    setFormActive(providers.length === 0); // Active by default if it is the first provider
    setSelectedWilayaIdForm(16); // Default to Algiers (16) if available, or just keeping 1
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleEdit = (prov: DeliveryProvider) => {
    setEditingProviderId(prov.id);
    setFormName(prov.name);
    setFormSupportedCommunes(prov.supportedCommunes || {});
    setFormActive(prov.active || false);
    setIsFormOpen(true);
    // Focus or default Wilaya to first one who has selected communes
    const selectedWilayasKeys = Object.keys(prov.supportedCommunes || {});
    if (selectedWilayasKeys.length > 0) {
      setSelectedWilayaIdForm(Number(selectedWilayasKeys[0]));
    } else {
      setSelectedWilayaIdForm(16); // default to Algiers
    }
  };

  // Toggle Active directly from the list
  const handleToggleActiveDirect = async (id: string) => {
    const updated = providers.map(p => {
      if (p.id === id) {
        return { ...p, active: true };
      }
      return { ...p, active: false };
    });
    await saveToFirebase(updated);
  };

  // Delete Provider
  const handleDelete = async (provId: string) => {
    if (window.confirm('هل أنت متأكد من حذف شركة التوصيل هذه؟')) {
      const updated = providers.filter(p => p.id !== provId);
      // If we deleted the active one, mark the first other as active if exists
      if (providers.find(p => p.id === provId)?.active && updated.length > 0) {
        updated[0].active = true;
      }
      await saveToFirebase(updated);
    }
  };

  // Save/Submit Form (Edit or Add)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('الرجاء إدخال اسم شركة التوصيل.');
      return;
    }

    // Process Supported Communes: clean up empty wilayas
    const cleanedCommunes: Record<string, string[]> = {};
    Object.keys(formSupportedCommunes).forEach(key => {
      if (formSupportedCommunes[key] && formSupportedCommunes[key].length > 0) {
        cleanedCommunes[key] = formSupportedCommunes[key];
      }
    });

    const isAdding = !editingProviderId;
    let updated: DeliveryProvider[] = [];

    if (isAdding) {
      const newProv: DeliveryProvider = {
        id: String(Date.now()),
        name: formName.trim(),
        supportedCommunes: cleanedCommunes,
        active: formActive
      };

      if (formActive) {
        updated = providers.map(p => ({ ...p, active: false }));
      }
      updated.push(newProv);
    } else {
      updated = providers.map(p => {
        if (p.id === editingProviderId) {
          return {
            ...p,
            name: formName.trim(),
            supportedCommunes: cleanedCommunes,
            active: formActive
          };
        }
        if (formActive) {
          return { ...p, active: false };
        }
        return p;
      });
    }

    // Ensure there is at least one active provider if providers array is not empty
    const activeExists = updated.some(p => p.active);
    if (!activeExists && updated.length > 0) {
      updated[0].active = true;
    }

    await saveToFirebase(updated);
    setIsFormOpen(false);
  };

  // Toggle Single Commune check/uncheck
  const toggleCommune = (wilayaId: number, communeName: string) => {
    const wKey = String(wilayaId);
    setFormSupportedCommunes(prev => {
      const currentList = prev[wKey] || [];
      let nextList: string[];
      if (currentList.includes(communeName)) {
        nextList = currentList.filter(c => c !== communeName);
      } else {
        nextList = [...currentList, communeName];
      }

      return {
        ...prev,
        [wKey]: nextList
      };
    });
  };

  // Select all communes in current active Wilaya
  const handleSelectAllCommunes = () => {
    const wKey = String(selectedWilayaIdForm);
    const allCommunes = algeriaCommunes[selectedWilayaIdForm] || [];
    setFormSupportedCommunes(prev => ({
      ...prev,
      [wKey]: [...allCommunes]
    }));
  };

  // Deselect all communes in current active Wilaya
  const handleDeselectAllCommunes = () => {
    const wKey = String(selectedWilayaIdForm);
    setFormSupportedCommunes(prev => ({
      ...prev,
      [wKey]: []
    }));
  };

  // Helper: Count selected communes in a wilaya
  const getSelectedCountInWilaya = (wilayaId: number): number => {
    return (formSupportedCommunes[String(wilayaId)] || []).length;
  };

  // Helper: Count total supported communes in a provider representation
  const getTotalCommunesCount = (supported: Record<string, string[]>): number => {
    let count = 0;
    Object.values(supported || {}).forEach(arr => {
      count += (arr || []).length;
    });
    return count;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-3" dir="rtl">
        <svg className="animate-spin h-6 w-6 text-brand-text" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm">جاري تحميل إعدادات شركات التوصيل...</span>
      </div>
    );
  }

  const activeWilayaObj = algeriaWilayas.find(w => w.id === selectedWilayaIdForm);
  const communesOfActiveWilaya = algeriaCommunes[selectedWilayaIdForm] || [];
  const filteredCommunes = communesOfActiveWilaya.filter(c => 
    c.toLowerCase().includes(communeSearchQuery.trim().toLowerCase())
  );

  return (
    <div className="space-y-6 text-neutral-700" dir="rtl">
      
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-600 text-[13px] items-center animate-fade-in" dir="rtl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-emerald-700 text-[13px] items-center animate-fade-in animate-out fade-out" dir="rtl">
          <CheckCircle2 size={16} className="shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Info Warning Banner */}
      <div className="bg-[#f0f9ff] border border-[#e0f2fe] rounded-xl p-4 text-[13px] text-sky-800 leading-relaxed flex gap-3.5 items-start">
        <Info size={18} className="text-sky-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">توضيح طريقة عمل شركات التوصيل:</p>
          <p>
            تُستخدم قائمة البلديات المدعومة هنا لفلترة وتخصيص خيار <b>"استلام من المكتب"</b> في نموذج الطلب. 
            عند تفعيل شركة توصيل نشطة (Active)، لن تظهر للزبون عند اختياره "استلام من المكتب" سوى البلديات المحددة لهذه الشركة فقط.
            بينما خيار <b>"التوصيل للمنزل"</b> يعرض دائماً كامل البلديات الجزائرية (1541 بلدية) بصفة طبيعية دون أي تغيير لضمان تغطية كاملة.
          </p>
        </div>
      </div>

      {!isFormOpen ? (
        <div className="space-y-5">
          {/* List Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800">الشركات الحالية ({providers.length})</h3>
            <button
              type="button"
              onClick={handleAddNew}
              className="px-4 py-2 bg-brand-text text-white hover:bg-brand-text/90 active:bg-brand-text text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>إضافة شركة توصيل جديدة</span>
            </button>
          </div>

          {/* Providers List Grid/Cards */}
          {providers.length === 0 ? (
            <div className="border border-neutral-100 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white">
              <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400 mb-3 border border-neutral-100">
                <Truck size={20} />
              </div>
              <p className="text-[13px] font-semibold text-neutral-500">لا توجد شركات توصيل حتى الآن</p>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-sm">قم بإضافة أول شركة توصيل وتحديد بلدياتها لتفعيل فلترة "استلام من المكتب".</p>
              <button
                type="button"
                onClick={handleAddNew}
                className="mt-4 px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                إضافة الشركة الأولى
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map(prov => {
                const totalCommunes = getTotalCommunesCount(prov.supportedCommunes);
                const wilayasCount = Object.keys(prov.supportedCommunes || {}).length;

                return (
                  <div 
                    key={prov.id}
                    className={`bg-white rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden ${
                      prov.active 
                        ? 'border-brand-text shadow-sm ring-1 ring-brand-text/10' 
                        : 'border-neutral-150 hover:border-neutral-300 shadow-sm'
                    }`}
                  >
                    {prov.active && (
                      <div className="absolute top-0 right-0 bg-brand-text text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                        <Check size={10} strokeWidth={3} />
                        <span>نشطة حالياً / Active</span>
                      </div>
                    )}

                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Title & Stats */}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="w-8 h-8 rounded-xl bg-neutral-50 text-neutral-500 border border-neutral-100 flex items-center justify-center">
                            <Truck size={14} />
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-neutral-800 leading-tight">{prov.name}</h4>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-mono">
                              <span>{wilayasCount} ولايات</span>
                              <span>•</span>
                              <span>{totalCommunes} بلديات مدعومة</span>
                            </div>
                          </div>
                        </div>

                        {/* Breakdown preview of supported wilayas */}
                        <div className="mt-4 pt-4 border-t border-neutral-100/50">
                          <p className="text-[11px] text-neutral-400 font-semibold mb-2">توزيع التغطية للمكتب:</p>
                          {wilayasCount === 0 ? (
                            <p className="text-[11px] text-amber-600 font-medium">⚠️ لا توجد أي بلدية محددة (سيتم إيقاف "استلام من المكتب" للزبائن تلقائياً)</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {Object.entries(prov.supportedCommunes || {}).map(([wId, list]) => {
                                const wilayaName = algeriaWilayas.find(w => w.id === Number(wId))?.name || `ولاية ${wId}`;
                                return (
                                  <span 
                                    key={wId}
                                    className="px-2 py-0.5 bg-neutral-50 border border-neutral-100 text-neutral-600 text-[10px] rounded-md font-sans"
                                  >
                                    {wilayaName} ({((list as string[])?.length || 0)})
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card actions */}
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-100">
                        {!prov.active ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActiveDirect(prov.id)}
                            className="px-3 py-1.5 text-neutral-600 hover:text-brand-text bg-neutral-50 hover:bg-neutral-100 border border-neutral-150 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>تنشيط الشركة</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                            <span>مدعومة بال checkout</span>
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(prov)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-150 rounded-lg transition-colors cursor-pointer"
                            title="تعديل البيانات والبلديات"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prov.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 bg-neutral-50 hover:bg-red-50 border border-neutral-150 hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                            title="حذف الشركة"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= ADD / EDIT PROVIDER FORM ================= */
        <form onSubmit={handleSaveForm} className="bg-white rounded-2xl border border-neutral-150 p-6 space-y-6 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-[15px] font-bold text-neutral-800">
                {editingProviderId ? 'تعديل بيانات شركة التوصيل' : 'إضافة شركة توصيل جديدة'}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">قم بكتابة الاسم وتحميل الولايات والبلديات المدعومة للاستلام من المكتب.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 border border-neutral-150 rounded-xl transition-all cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Field: Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">اسم شركة التوصيل / Carrier Name</label>
              <input
                required
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="مثال: Yalidine Express, ZR Express..."
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-brand-text focus:ring-1 focus:ring-brand-text/15 transition-all text-right font-sans"
              />
            </div>

            {/* Field: Active Switch */}
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={e => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-text border-neutral-300 focus:ring-brand-text focus:ring-1"
                />
                <div className="text-right">
                  <span className="block text-[13px] font-bold text-neutral-700">تفعيل كشركة نشطة (Active Provider)</span>
                  <span className="block text-[10px] text-neutral-400 mt-0.5">صندوق "استلام من المكتب" في نموذج checkout سيعامِل شركة التوصيل هذه حصراً.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-5 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* LEFT COLUMN: Wilayas Quick Selection list (5 cols) */}
              <div className="lg:col-span-5 flex flex-col h-[400px] border border-neutral-150 rounded-xl overflow-hidden bg-neutral-50/20">
                <div className="bg-neutral-50 border-b border-neutral-150 p-3 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-neutral-700">تصفح الولايات (58 ولاية)</span>
                  <span className="px-2 py-0.5 bg-neutral-200/60 font-mono text-[10px] rounded text-neutral-500 font-extrabold">
                    {Object.keys(formSupportedCommunes).length} نشطة
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 p-1.5 divide-y divide-neutral-100/50">
                  {algeriaWilayas.map(w => {
                    const selCount = getSelectedCountInWilaya(w.id);
                    const isSelected = selectedWilayaIdForm === w.id;

                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setSelectedWilayaIdForm(w.id);
                          setCommuneSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 transition-colors rounded-lg text-right outline-none cursor-pointer ${
                          isSelected ? 'bg-white border border-neutral-200 font-bold text-brand-text shadow-sm' : 'border border-transparent'
                        }`}
                      >
                        <span className="text-xs">{w.code} - {w.name} ({w.nameEn})</span>
                        {selCount > 0 ? (
                          <span className="px-2 py-0.5 bg-brand-text text-white font-mono text-[9px] rounded-full font-bold">
                            {selCount} بلدية
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-300">غير مغطى</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: Municipalities checkbox selector (7 cols) */}
              <div className="lg:col-span-7 flex flex-col h-[400px] border border-neutral-150 rounded-xl overflow-hidden bg-white">
                {/* Search & Selector action bar */}
                <div className="bg-neutral-50 border-b border-neutral-150 p-3 shrink-0 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                      <span>البلديات في ولاية:</span>
                      <span className="text-brand-text font-black underline">{activeWilayaObj?.name}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllCommunes}
                        className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CheckSquare size={10} />
                        <span>تحديد الكل</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllCommunes}
                        className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <MinusSquare size={10} />
                        <span>إلغاء الكل</span>
                      </button>
                    </div>
                  </div>

                  {/* Commune search input bar */}
                  <div className="relative">
                    <input
                      type="text"
                      value={communeSearchQuery}
                      onChange={e => setCommuneSearchQuery(e.target.value)}
                      placeholder={`بحث في بلدية ولاية ${activeWilayaObj?.name}...`}
                      className="w-full bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-1.5 text-xs outline-none focus:border-brand-text transition-all font-sans"
                    />
                    <Search size={12} className="absolute right-3 top-2.5 text-neutral-400" />
                    {communeSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCommuneSearchQuery('')}
                        className="absolute left-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Commune Checkboxes grid */}
                <div className="overflow-y-auto flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-50/10">
                  {filteredCommunes.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-center py-10 text-neutral-400">
                      <AlertCircle size={14} className="mb-1" />
                      <p className="text-[11px]">لا توجد بلدية تطابق بحث "{communeSearchQuery}"</p>
                    </div>
                  ) : (
                    filteredCommunes.map(commune => {
                      const list = formSupportedCommunes[String(selectedWilayaIdForm)] || [];
                      const isChecked = list.includes(commune);

                      return (
                        <button
                          key={commune}
                          type="button"
                          onClick={() => toggleCommune(selectedWilayaIdForm, commune)}
                          className={`flex items-center text-right p-2.5 border rounded-lg transition-all text-xs cursor-pointer ${
                            isChecked
                              ? 'border-brand-text bg-brand-text/5 ring-1 ring-brand-text/5 font-semibold text-brand-text'
                              : 'border-neutral-150 bg-white hover:bg-neutral-50/50 hover:border-neutral-200 text-neutral-600'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ml-2.5 ${
                            isChecked ? 'bg-brand-text border-brand-text text-white' : 'border-neutral-300 bg-white'
                          }`}>
                            {isChecked && <Check size={10} strokeWidth={4} />}
                          </span>
                          <span className="font-sans leading-none">{commune}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Supported summary footer */}
          <div className="p-4 bg-neutral-50 border border-neutral-150 rounded-2xl">
            <span className="block text-xs font-bold text-neutral-500 mb-2.5 flex items-center gap-1.5">
              <ListFilter size={13} />
              <span>ملخص التغطية المختارة: ({getTotalCommunesCount(formSupportedCommunes)} بلديات في إجمالي {Object.keys(formSupportedCommunes).length} ولايات)</span>
            </span>

            {Object.keys(formSupportedCommunes).length === 0 ? (
              <p className="text-[11px] text-neutral-400">لم يتم تحديد ولايات أو بلديات بعد لمكتب التوصيل.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {Object.entries(formSupportedCommunes).map(([wId, list]) => {
                  const stringList = list as string[];
                  if (!stringList || stringList.length === 0) return null;
                  const wName = algeriaWilayas.find(w => w.id === Number(wId))?.name || `ولاية ${wId}`;

                  return (
                    <div 
                      key={wId}
                      className="px-2.5 py-1 bg-white border border-neutral-200 rounded-xl text-[11px] text-neutral-600 flex items-center gap-1.5 font-sans cursor-pointer hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all"
                      onClick={() => setSelectedWilayaIdForm(Number(wId))}
                      title="اضغط لتعديل بلديات هذه الولاية"
                    >
                      <span>{wName}</span>
                      <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-[9px] font-extrabold text-neutral-500">{stringList.length} بلدية</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form CTA Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              إلغاء التعديل
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-brand-text hover:bg-brand-text/90 active:bg-brand-text disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>حفظ شركة التوصيل والبلديات</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
