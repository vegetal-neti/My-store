import React, { useEffect, useState, useMemo } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Calendar, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Layers,
  RefreshCw,
  AlertTriangle,
  Truck
} from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, ensureAnalyticsSeeded, emergencyRecalculateAnalytics } from '../../firebase';

export const AdminOverview = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalcState, setRecalcState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showRecalcConfirm, setShowRecalcConfirm] = useState(false);

  const handleRecalculate = async () => {
    if (recalcState === 'loading') return;
    setShowRecalcConfirm(true);
  };

  const handleConfirmRecalculate = async () => {
    setShowRecalcConfirm(false);
    setRecalcState('loading');
    try {
      await emergencyRecalculateAnalytics();
      setRecalcState('success');
      setTimeout(() => setRecalcState('idle'), 3000);
    } catch (err) {
      console.error("Recalculation failed:", err);
      setRecalcState('error');
      setTimeout(() => setRecalcState('idle'), 3000);
    }
  };

  useEffect(() => {
    let active = true;
    let unsubscribeAnalytics: (() => void) | undefined;

    const setupDashboard = async () => {
      try {
        await ensureAnalyticsSeeded();
      } catch (err) {
        console.error("Failed to seed initial stats:", err);
      }
      
      if (!active) return;
      
      unsubscribeAnalytics = onSnapshot(
        doc(db, 'analytics', 'dashboard'),
        (snapshot) => {
          if (snapshot.exists()) {
            setAnalytics(snapshot.data());
          }
          if (active) setLoading(false);
        },
        (error) => {
          console.error("Error subscribing to analytics:", error);
          if (active) setLoading(false);
        }
      );
    };

    setupDashboard();

    return () => {
      active = false;
      if (unsubscribeAnalytics) {
        unsubscribeAnalytics();
      }
    };
  }, []);

  // Convert JS Date to a clean YYYY-MM-DD string in Algiers timezone (UTC+1)
  const getAlgiersDateString = (date: Date): string => {
    try {
      const options = { timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
      const formatter = new Intl.DateTimeFormat('en-CA', options);
      return formatter.format(date);
    } catch (e) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };

  // Memoized statistics from pre-aggregated source
  const stats = useMemo(() => {
    if (!analytics) {
      return {
        ordersToday: 0,
        ordersThisWeek: 0,
        pendingOrdersToday: 0,
        pendingOrdersThisWeek: 0,
        shippedOrdersToday: 0,
        shippedOrdersThisWeek: 0,
        cancellationRate: 0,
        topWilaya: 'لا يوجد'
      };
    }

    const now = new Date();
    const algiersTodayStr = getAlgiersDateString(now);

    // Get today's stats counts
    const dailyToday = analytics.dailyStats?.[algiersTodayStr] || {};
    const pendingToday = Number(dailyToday.pendingCount) || 0;
    const processingToday = Number(dailyToday.processingCount) || 0;
    const shippedToday = Number(dailyToday.shippedCount) || 0;
    const deliveredToday = Number(dailyToday.deliveredCount) || 0;
    const ordersToday = pendingToday + processingToday + shippedToday + deliveredToday;

    // Get weekly / calendar stats summation over last 7 calendar days
    let ordersThisWeek = 0;
    let pendingOrdersThisWeek = 0;
    let shippedOrdersThisWeek = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = getAlgiersDateString(d);
      const ds = analytics.dailyStats?.[dateStr] || {};
      
      const pCount = Number(ds.pendingCount) || 0;
      const prCount = Number(ds.processingCount) || 0;
      const sCount = Number(ds.shippedCount) || 0;
      const dCount = Number(ds.deliveredCount) || 0;

      ordersThisWeek += (pCount + prCount + sCount + dCount);
      pendingOrdersThisWeek += pCount;
      shippedOrdersThisWeek += sCount;
    }

    // Cancellation rate = (Cancelled Orders ÷ Processing Orders) * 100
    const cancelledCount = Number(analytics.globalStats?.cancelledOrdersCount) || 0;
    const processingCount = Number(analytics.globalStats?.processingOrdersCount) || 0;
    const cancellationRate = processingCount > 0 ? (cancelledCount / processingCount) * 100 : 0;

    // Top Wilaya Today from non-cancelled orders only
    let topWilayaName = '';
    let topWilayaCount = 0;
    const todayWilayaCounts = dailyToday.wilayaCounts || {};
    Object.entries(todayWilayaCounts).forEach(([name, count]) => {
      const cnt = Number(count) || 0;
      if (cnt > topWilayaCount) {
        topWilayaCount = cnt;
        topWilayaName = name;
      }
    });

    const topWilayaStr = topWilayaName 
      ? `${topWilayaName} (${topWilayaCount})`
      : 'لا يوجد';

    return {
      ordersToday,
      ordersThisWeek,
      pendingOrdersToday: pendingToday,
      pendingOrdersThisWeek,
      shippedOrdersToday: shippedToday,
      shippedOrdersThisWeek,
      cancellationRate,
      topWilaya: topWilayaStr
    };
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-[3px] border-brand-text border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[13px] text-neutral-400 font-medium">جاري تحديث لوحة الإحصائيات في الوقت الفعلي...</span>
        </div>
      </div>
    );
  }

  // Simplified Dashboard layout showing only the requested 8 metrics
  const dashboardCards = [
    {
      id: "orders-today",
      title: "Orders Today (طلبات اليوم)",
      value: `${stats.ordersToday} طلب`,
      icon: ShoppingCart,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-250",
      description: "عدد الطلبات الجديدة غير الملغاة الواردة لهذا اليوم"
    },
    {
      id: "orders-week",
      title: "Orders This Week (طلبات هذا الأسبوع)",
      value: `${stats.ordersThisWeek} طلب`,
      icon: TrendingUp,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-250",
      description: "مجموع الطلبات المفعلة وغير الملغاة خلال الـ 7 أيام الماضية"
    },
    {
      id: "pending-today",
      title: "Pending Orders Today (الطلبات المعلقة اليوم)",
      value: `${stats.pendingOrdersToday} طلب`,
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-250",
      description: "عدد الطلبات المعلقة بانتظار التأكيد مع الزبائن اليوم"
    },
    {
      id: "pending-week",
      title: "Pending Orders This Week (المعلقة هذا الأسبوع)",
      value: `${stats.pendingOrdersThisWeek} طلب`,
      icon: Layers,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-250",
      description: "الطلبات المعلقة المسجلة خلال الـ 7 أيام الماضية"
    },
    {
      id: "shipped-today",
      title: "Shipped Orders Today (الطلبات المشحونة اليوم)",
      value: `${stats.shippedOrdersToday} طلب`,
      icon: Truck,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-250",
      description: "عدد الطلبات التي تم تسليمها لشركة الشحن للشحن اليوم"
    },
    {
      id: "shipped-week",
      title: "Shipped Orders This Week (المشحونة هذا الأسبوع)",
      value: `${stats.shippedOrdersThisWeek} طلب`,
      icon: Package,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-250",
      description: "إجمالي الطلبات التي تم شحنها وتصديرها هذا الأسبوع"
    },
    {
      id: "cancellation-rate",
      title: "Cancellation Rate (معدل الإلغاء)",
      value: `${stats.cancellationRate.toFixed(1)}%`,
      icon: AlertTriangle,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-250",
      description: "معدل الإلغاء = (عدد الطلبات الملغاة ÷ الطلبات معالجة processing) × 100"
    },
    {
      id: "top-wilaya",
      title: "Top Wilaya (الولاية الأكثر طلباً اليوم)",
      value: stats.topWilaya,
      icon: MapPin,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-250",
      description: "أعلى ولاية مبيعات لليوم من الطلبات غير الملغاة فقط"
    }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <span>لوحة التحليلات المبسطة (Dashboard Analytics)</span>
          </h2>
          <p className="text-[13px] text-neutral-500 mt-1">تتبع المؤشرات والأداء الأساسي لمتجرك في الوقت الفعلي من Firestore.</p>
        </div>
        <div>
          <button
            onClick={handleRecalculate}
            disabled={recalcState === 'loading'}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 text-xs font-bold rounded-2xl border border-rose-200/50 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
          >
            {recalcState === 'loading' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>جاري المزامنة والمطابقة...</span>
              </>
            ) : recalcState === 'success' ? (
              <span>✓ تمت المطابقة بنجاح!</span>
            ) : recalcState === 'error' ? (
              <span>⚠ فشلت المزامنة!</span>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                <span>إعادة حساب الإحصائيات (Recalculate)</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Dynamic Grid System */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {dashboardCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div 
              key={card.id} 
              className={`bg-white p-5 rounded-3xl shadow-sm border ${card.borderColor || 'border-neutral-100'} flex flex-col justify-between hover:shadow-md hover:border-neutral-200/70 transition-all duration-300 relative group overflow-hidden`}
              id={`analytics-card-${card.id}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${card.bgColor} ${card.iconColor} flex items-center justify-center shrink-0`}>
                  <IconComponent size={22} className="transform group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-neutral-700 leading-snug">
                    {card.title}
                  </h3>
                  <span className="block text-xl font-bold text-brand-text mt-2 font-mono scroll-mt-2 truncate">
                    {card.value}
                  </span>
                </div>
              </div>

              {/* Technical description details */}
              <div className="mt-4 pt-3 border-t border-neutral-100/70 text-[11px] text-neutral-400 font-medium leading-relaxed">
                {card.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recalculate Custom Confirmation Modal */}
      {showRecalcConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
            <h3 className="text-[17px] font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
              ⚠️ مراجعة وإعادة بناء الإحصائيات
            </h3>
            <p className="text-neutral-600 text-[14px] leading-relaxed">
              هل أنت متأكد من رغبتك في إعادة بناء إحصائيات النظام بالكامل؟ ستقوم هذه العملية بمراجعة ومطابقة كافة الطلبات الحالية وإصلاح أي فروقات في البيانات.
            </p>
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowRecalcConfirm(false)}
                className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 text-[13px] font-semibold hover:bg-neutral-50 transition-colors"
              >
                إلغاء / Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRecalculate}
                className="px-5 py-2 rounded-full bg-rose-600 text-white text-[13px] font-semibold hover:bg-rose-700 transition-colors shadow-sm"
              >
                نعم، ابدأ المطابقة والعد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
