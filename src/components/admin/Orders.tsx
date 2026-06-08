import React, { useEffect, useState, useMemo } from 'react';
import { getOrders, updateOrder } from '../../firebase';
import { 
  Search, 
  Copy, 
  Check, 
  Eye, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  User, 
  Truck, 
  Home, 
  Briefcase, 
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Copied alert state tracking
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Cancellation tracking states
  const [cancelModalData, setCancelModalData] = useState<{ orderId: string; oldStatus: string } | null>(null);
  const [chosenReason, setChosenReason] = useState<string>('customer request');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string, reason?: string) => {
    setUpdating(orderId);
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'cancelled' && reason) {
        payload.cancellationReason = reason;
      }
      await updateOrder(orderId, payload);
      setOrders(prev => prev.map(o => o.id === orderId ? { 
        ...o, 
        status: newStatus, 
        analyticsAppliedStatus: newStatus,
        cancellationReason: newStatus === 'cancelled' ? reason : undefined,
        cancelledAt: newStatus === 'cancelled' ? { seconds: Math.floor(Date.now() / 1000) } : undefined
      } : o));
      
      // Update selected order details inside modal if it's currently open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ 
          ...prev, 
          status: newStatus,
          cancellationReason: newStatus === 'cancelled' ? reason : undefined,
          cancelledAt: newStatus === 'cancelled' ? { seconds: Math.floor(Date.now() / 1000) } : undefined
        }));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("حدث خطأ أثناء محاولة تحديث حالة الطلب.");
    } finally {
      setUpdating(null);
    }
  };

  const initiateStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    const oldStatus = order ? order.status : 'pending';
    
    if (newStatus === 'cancelled') {
      setCancelModalData({ orderId, oldStatus });
      setChosenReason('customer request');
    } else {
      await handleStatusChange(orderId, newStatus);
    }
  };

  const triggerCopy = (text: string, id: string) => {
    try {
      let copied = false;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        copied = true;
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copied = true;
      }
      
      if (copied) {
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [id]: false }));
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to copy path:", err);
    }
  };

  // Convert JS Date or Firestore timestamp to beautiful Arabic format
  const formatOrderDate = (createdAt: any): string => {
    if (!createdAt) return 'غير متوفر';
    let dateObj: Date;
    if (typeof createdAt.toDate === 'function') {
      dateObj = createdAt.toDate();
    } else if (createdAt.seconds) {
      dateObj = new Date(createdAt.seconds * 1000);
    } else {
      dateObj = new Date(createdAt);
    }

    try {
      return new Intl.DateTimeFormat('ar-DZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (e) {
      return dateObj.toLocaleString();
    }
  };

  // Filter orders based on user inputs
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Status Filter
      if (statusFilter !== 'all' && (order.status || 'pending') !== statusFilter) {
        return false;
      }

      // 2. Delivery Type Filter
      if (deliveryFilter !== 'all' && (order.deliveryType || 'home') !== deliveryFilter) {
        return false;
      }

      // 3. Search Term (Full Name, Phone, Order Number, or State)
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const orderNum = (order.orderNumber || '').toLowerCase();
        const orderId = (order.id || '').toLowerCase();
        const fullName = (order.customerInfo?.fullName || '').toLowerCase();
        const phone = (order.customerInfo?.phone || '').toLowerCase();
        const state = (order.customerInfo?.state || '').toLowerCase();
        const city = (order.customerInfo?.city || '').toLowerCase();

        const matchOrderNumber = orderNum.includes(term) || orderId.includes(term);
        const matchCustomer = fullName.includes(term) || phone.includes(term);
        const matchLocation = state.includes(term) || city.includes(term);

        if (!matchOrderNumber && !matchCustomer && !matchLocation) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, deliveryFilter, searchTerm]);

  // Pagination bounds calculation
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  // Reset page index on search or filter updates
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, deliveryFilter]);

  const getStatusBadgeStyles = (status: string) => {
    const cleanStatus = status || 'pending';
    switch (cleanStatus) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'shipped':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  const getStatusTextArabic = (status: string) => {
    switch (status || 'pending') {
      case 'pending': return 'قيد الانتظار';
      case 'processing': return 'في المعالجة';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4" dir="rtl">
        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
        <span className="text-xs text-neutral-400 font-bold">جاري تحميل وسحب الطلبات من قاعدة البيانات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header section with summary KPI counts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <span>لوحة معالجة الطلبات العامة (Orders Center)</span>
          </h2>
          <p className="text-[13px] text-neutral-500 mt-1">تتبع وإدارة وتحسين فواتير المتجر والبيع المباشر والمنزلي.</p>
        </div>
        <div className="flex items-center gap-3 bg-neutral-50/50 p-1.5 rounded-2xl border border-neutral-200/40 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200/50 font-bold text-neutral-700 text-[11px] shadow-xs">
            إجمالي التصفية: {filteredOrders.length} طلب
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 font-bold text-[11px]">
            المسجل الكلي: {orders.length}
          </span>
        </div>
      </div>

      {/* Structured powerful searching, status, and delivery filtering panel */}
      <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Quick full-text search input with glass indicators */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </span>
            <input
              type="text"
              placeholder="ابحث بالاسم، برقم الهاتف، الولاية، أو رقم الطلب #ORD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-11 pl-4 py-2.5 rounded-2xl border border-neutral-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 outline-none text-xs transition-all placeholder:text-neutral-400 font-medium text-neutral-800"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute inset-y-0 left-4 flex items-center text-neutral-400 hover:text-neutral-600 text-xs"
              >
                مسح
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Status dropdown filters */}
            <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-2xl">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-neutral-600 outline-none cursor-pointer pr-1"
              >
                <option value="all">كل الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="processing">في المعالجة</option>
                <option value="shipped">تم الشحن</option>
                <option value="delivered">تم التسليم</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            {/* Delivery type filters */}
            <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-2xl">
              <Truck className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-neutral-600 outline-none cursor-pointer pr-1"
              >
                <option value="all">كل طرق الشحن</option>
                <option value="home">توصيل للمنزل (Home)</option>
                <option value="desk">توصيل للمكتب (Desk)</option>
              </select>
            </div>
            
            {/* Reset queries buttons */}
            {(searchTerm || statusFilter !== 'all' || deliveryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDeliveryFilter('all');
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer px-3 py-2 rounded-2xl border border-rose-100 active:scale-[0.98] transition-all"
              >
                إلغاء الفلاتر
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Structured core interactive grid table */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-500 font-bold">
                <th className="px-6 py-4 text-start">رقم الطلب (ID)</th>
                <th className="px-6 py-4">الزبون / العميل</th>
                <th className="px-6 py-4">الولاية / طريقة التسليم</th>
                <th className="px-6 py-4 text-center">المنتجات المباعة</th>
                <th className="px-6 py-4 text-left font-bold">الإجمالي</th>
                <th className="px-6 py-4 text-center">تحديث الحالة</th>
                <th className="px-6 py-4 text-center">خيارات الإدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-neutral-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <ShoppingBag className="w-8 h-8 text-neutral-300" />
                      <span>لا توجد طلبات تطابق معايير البحث أو التصفية المحددة.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const stateKey = order.customerInfo?.state || 'غير معروفة';
                  const deliveryType = order.deliveryType || 'home';
                  const phone = order.customerInfo?.phone || '';
                  const orderNum = order.orderNumber || `#ORD-${order.id?.slice(0, 5)}`;
                  
                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/40 transition-colors duration-150">
                      {/* 1. Order ID and Number */}
                      <td className="px-6 py-4.5 text-start font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-black text-neutral-800">{orderNum}</span>
                          <button
                            onClick={() => triggerCopy(orderNum, `num-${order.id}`)}
                            title="نسخ رقم الطلب"
                            className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700 transition"
                          >
                            {copiedStates[`num-${order.id}`] ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[120px]" title={order.id}>
                          المعرف: {order.id?.slice(0, 10)}...
                        </div>
                      </td>

                      {/* 2. Customer Name & Phone */}
                      <td className="px-6 py-4.5">
                        <div className="text-xs font-bold text-neutral-900 truncate max-w-[170px]" title={order.customerInfo?.fullName}>
                          {order.customerInfo?.fullName || 'بدون اسم'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-neutral-500 text-[11px]">
                          <span>{phone || 'بلا هاتف'}</span>
                          {phone && (
                            <>
                              <button
                                onClick={() => triggerCopy(phone, `phone-${order.id}`)}
                                title="نسخ رقم الهاتف"
                                className="p-0.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-700 transition"
                              >
                                {copiedStates[`phone-${order.id}`] ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                              <a
                                href={`tel:${phone}`}
                                title="اتصال بالعميل"
                                className="p-0.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-rose-600 transition"
                              >
                                <Phone className="w-2.5 h-2.5" />
                              </a>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 3. Wilaya + Delivery Option */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1 font-bold text-neutral-800">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{stateKey}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                          {deliveryType === 'home' ? (
                            <>
                              <Home className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>توصيل للمنزل</span>
                            </>
                          ) : (
                            <>
                              <Briefcase className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span>توصيل للمكتب / نقطة استلام</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 4. Product Sales Units and quantity count */}
                      <td className="px-6 py-4.5 text-center font-bold">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-50 text-neutral-700 text-[11px] border border-neutral-150">
                          <span>{order.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0) || 0}</span>
                          <span className="text-neutral-400 font-normal">قطع</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1">
                          ({order.items?.length || 0} منتجات مختلفة)
                        </div>
                      </td>

                      {/* 5. Pricing total price display */}
                      <td className="px-6 py-4.5 text-left">
                        <div className="text-xs font-black text-rose-600 font-mono">
                          {Number(order.totalPrice || 0).toLocaleString()} دج
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1 font-mono">
                          الشحن: {Number(order.deliveryFee || 0).toLocaleString()} دج
                        </div>
                      </td>

                      {/* 6. In-line interactive State Changer Dropdown */}
                      <td className="px-6 py-4.5 text-center">
                        <div className="relative inline-block text-right">
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => initiateStatusChange(order.id, e.target.value)}
                            disabled={updating === order.id}
                            className={`text-[11px] font-bold py-1.5 px-3 rounded-full border border-solid transition outline-none appearance-none cursor-pointer pr-4 pl-4 text-center ${getStatusBadgeStyles(order.status)} ${updating === order.id ? 'opacity-50 pointer-events-none' : ''}`}
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`, backgroundPosition: 'left 8px center', backgroundSize: '12px', backgroundRepeat: 'no-repeat' }}
                          >
                            <option value="pending">قيد الانتظار</option>
                            <option value="processing">في المعالجة</option>
                            <option value="shipped">تم الشحن</option>
                            <option value="delivered">تم التسليم</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </div>
                      </td>

                      {/* 7. Action controllers */}
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 bg-neutral-50 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 border border-neutral-200/40 hover:border-rose-100 rounded-xl transition cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض الفاتورة</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic and responsive pagination block controller */}
        {filteredOrders.length > 0 && (
          <div className="bg-neutral-50/70 px-6 py-4.5 border-t border-neutral-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-[11px] font-bold text-neutral-500">
              عرض الصفحة <span className="text-neutral-800">{currentPage}</span> من <span className="text-neutral-800">{totalPages}</span> صفحات (إجمالي المصفى {filteredOrders.length} طلب)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
              
              <div className="flex items-center gap-1 font-mono text-[11px] font-bold">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  // Only render close neighborhood pages to keep clean layout
                  if (totalPages > 5 && Math.abs(pNum - currentPage) > 1 && pNum !== 1 && pNum !== totalPages) {
                    if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="px-1 text-neutral-400">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg font-bold text-[11px] flex items-center justify-center transition-all ${currentPage === pNum ? 'bg-rose-600 text-white shadow-xs font-black' : 'hover:bg-neutral-200 bg-white border border-neutral-200 text-neutral-700 cursor-pointer'}`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Structured Details Modal overlay rendering if an order is active */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-100 shadow-2xl flex flex-col outline-none">
            
            {/* Modal sticky top section banner header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-5 border-b border-neutral-100 flex items-center justify-between z-10 rounded-t-[32px]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-black text-neutral-800 text-sm">
                    تفاصيل الفاتورة {selectedOrder.orderNumber || `#ORD-${selectedOrder.id?.slice(0, 5)}`}
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    رقم تتبع المعاملة: {selectedOrder.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-750 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal scrollable main content detail panel body */}
            <div className="p-6 space-y-6">
              
              {/* Order Status Timeline Switchboard */}
              <div className="bg-neutral-50 p-4.5 rounded-2xl border border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-neutral-400 font-bold">الحالة الحالية للطلب</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`px-3 py-1 text-[11px] font-black rounded-full border ${getStatusBadgeStyles(selectedOrder.status)}`}>
                      {getStatusTextArabic(selectedOrder.status)}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-sans">
                      تحديث فوري وآمن لجدول الإحصائيات
                    </span>
                  </div>
                </div>
                
                {/* Manual override action row inside modal */}
                <div>
                  <div className="text-[11px] text-neutral-400 font-bold mb-1.5">تعديل حالة الشحنة</div>
                  <div className="flex gap-1 flex-wrap">
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                      <button
                        key={st}
                        onClick={() => initiateStatusChange(selectedOrder.id, st)}
                        disabled={updating === selectedOrder.id || selectedOrder.status === st}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all active:scale-[0.98] ${selectedOrder.status === st ? 'bg-neutral-800 text-white border-neutral-900 pointer-events-none' : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-250 cursor-pointer disabled:opacity-40'}`}
                      >
                        {getStatusTextArabic(st)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cancellation Reason if cancelled */}
              {selectedOrder.status === 'cancelled' && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">تفاصيل إلغاء الطلب:</span>
                    {selectedOrder.cancelledAt && (
                      <span className="font-sans text-[10px] text-rose-500">
                        تاريخ الإلغاء: {formatOrderDate(selectedOrder.cancelledAt)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs">
                    <span>سبب إلغاء الطلبية: </span>
                    <span className="font-bold underline">
                      {selectedOrder.cancellationReason === 'customer request' ? 'بناءً على طلب الزبون' :
                       selectedOrder.cancellationReason === 'out of stock' ? 'نفاد كمية المخزون (Out of stock)' :
                       selectedOrder.cancellationReason === 'no response' ? 'عدم رد الزبون على الهاتف' :
                       selectedOrder.cancellationReason === 'admin cancellation' ? 'إلغاء إداري من طرف لوحة التحكم' :
                       selectedOrder.cancellationReason || 'غير محدد'}
                    </span>
                  </div>
                </div>
              )}

              {/* Grid block for customer information vs invoice details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                
                {/* Right side: billing information details cards */}
                <div className="bg-white border border-neutral-150 p-5 rounded-2xl flex flex-col h-full justify-between">
                  <div>
                    <h4 className="font-black text-neutral-800 border-b border-neutral-100 pb-2 mb-3 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span>معلومات الزبون والمشتري</span>
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-neutral-400">الاسم واللقب:</span>
                        <span className="font-bold text-neutral-800 text-end truncate max-w-[170px]" title={selectedOrder.customerInfo?.fullName}>
                          {selectedOrder.customerInfo?.fullName || 'غير مسجل'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2 font-mono">
                        <span className="text-neutral-400">رقم الهاتف:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-800">{selectedOrder.customerInfo?.phone || 'غير مسجل'}</span>
                          {selectedOrder.customerInfo?.phone && (
                            <button
                              onClick={() => triggerCopy(selectedOrder.customerInfo.phone, `modal-phone-${selectedOrder.id}`)}
                              className="p-1 hover:bg-neutral-100 rounded text-neutral-400"
                              title="نسخ الرقم"
                            >
                              {copiedStates[`modal-phone-${selectedOrder.id}`] ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Local date format stamp */}
                  <div className="mt-5 pt-3 border-t border-dotted border-neutral-100 text-[10px] text-neutral-400 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>تاريخ تسجيل الطلب: {formatOrderDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>

                {/* Left side: destination location shipping address cards */}
                <div className="bg-white border border-neutral-150 p-5 rounded-2xl">
                  <h4 className="font-black text-neutral-800 border-b border-neutral-100 pb-2 mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>تفاصيل التوصيل والولاية</span>
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">الولاية:</span>
                      <span className="font-bold text-brand-text">{selectedOrder.customerInfo?.state || 'غير معروفة'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">البلدية:</span>
                      <span className="font-bold text-neutral-800">{selectedOrder.customerInfo?.city || 'غير معروفة'}</span>
                    </div>
                    {selectedOrder.customerInfo?.address && (
                      <div className="flex flex-col gap-1 pt-1">
                        <span className="text-neutral-400">العنوان الكامل بالتفصيل:</span>
                        <span className="font-bold text-neutral-700 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 mt-1 block leading-relaxed break-words">
                          {selectedOrder.customerInfo.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Items ordered list table display details */}
              <div className="bg-white rounded-2xl border border-neutral-150 overflow-hidden">
                <div className="bg-neutral-50/70 px-4 py-3 font-bold text-neutral-700 border-b border-neutral-150 flex items-center gap-1.5">
                  <span>المنتجات المطلوبة</span>
                  <span className="text-[10px] text-neutral-400 font-normal">({selectedOrder.items?.length || 0} منتج مختلف)</span>
                </div>
                <div className="divide-y divide-neutral-100 max-h-[220px] overflow-y-auto">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="p-4 hover:bg-neutral-50/20 flex justify-between items-center gap-4 text-xs">
                      <div>
                        {/* Title of active item */}
                        <div className="font-bold text-neutral-900 leading-snug">
                          {item.name || item.title || 'منتج غير معروف الاسم'}
                        </div>
                        {/* Variant details if sizing is set */}
                        <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-neutral-400 font-medium">
                          {item.size && (
                            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">المقاس: {item.size}</span>
                          )}
                          {item.color && (
                            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">اللون: {item.color}</span>
                          )}
                          <span className="font-bold text-rose-500 font-sans">
                            {Number(item.price || 0).toLocaleString()} دج × {item.quantity || 1}
                          </span>
                        </div>
                      </div>
                      
                      {/* Product price aggregate */}
                      <span className="font-bold text-neutral-800 font-mono text-[13px] shrink-0">
                        {((Number(item.price || 0)) * (Number(item.quantity || 1))).toLocaleString()} دج
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial calculations and aggregate bill */}
              <div className="bg-rose-50/25 p-5 rounded-2xl border border-rose-200/30 text-xs space-y-2.5">
                <div className="flex justify-between items-center text-neutral-500">
                  <span>المجموع الفرعي للمنتجات:</span>
                  <span className="font-bold font-mono">
                    {((selectedOrder.totalPrice || 0) - (selectedOrder.deliveryFee || 0)).toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between items-center text-neutral-500">
                  <span>سعر عملية الشحن والتوصيل ({selectedOrder.deliveryType === 'home' ? 'شحن منزلي للباب' : 'نقطة استلام للمكتب'}):</span>
                  <span className="font-bold font-mono">
                    {Number(selectedOrder.deliveryFee || 0).toLocaleString()} دج
                  </span>
                </div>
                <div className="border-t border-dotted border-rose-200/60 my-2.5 pt-2 flex justify-between items-center text-rose-800 text-sm font-black">
                  <span>القيمة الإجمالية الصافية المدفوعة:</span>
                  <span className="text-base text-rose-700 font-mono">
                    {Number(selectedOrder.totalPrice || 0).toLocaleString()} دج
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Bottom control buttons */}
            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-100 px-6 py-4.5 rounded-b-[32px] flex items-center justify-between gap-3 text-xs">
              <span className="text-[10px] text-neutral-400 font-medium">
                تأكد من الاتصال وتأكيد الطلبية قبل شحن الطرد.
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 hover:bg-neutral-200/75 text-neutral-700 border border-neutral-300 font-bold rounded-xl transition cursor-pointer active:scale-[0.98]"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cancellation Reason Selection Modal Overlay */}
      {cancelModalData && (
        <div className="fixed inset-0 bg-neutral-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-[24px] shadow-2xl border border-neutral-100 max-w-md w-full overflow-hidden">
            <div className="bg-neutral-950 text-white p-5 text-right">
              <h3 className="text-sm font-black flex items-center gap-2 justify-end">
                <span>تحديد سبب إلغاء الطلب</span>
                <span className="p-1 px-2.5 rounded bg-rose-900 text-rose-300 text-xs">تنبيه</span>
              </h3>
              <p className="text-[10px] text-neutral-400 mt-1">
                يرجى توضيح سبب الإلغاء بدقة لتغذية لوحة تتبع الأداء وتحسين المبيعات
              </p>
            </div>
            
            <div className="p-5 space-y-3.5 text-xs text-right">
              <label className="block text-[11px] font-bold text-neutral-400">سبب الإلغاء المعتمد للطلب:</label>
              <div className="space-y-2">
                {[
                  { key: 'customer request', label: 'طلب من الزبون (بطلب منه مباشرة)' },
                  { key: 'out of stock', label: 'المنتج غير متوفر / نفد من المخزون' },
                  { key: 'no response', label: 'الزبون لا يرد على الهاتف بعد عدة محاولات' },
                  { key: 'admin cancellation', label: 'إلغاء إداري من طرف الإدارة' },
                ].map((reason) => (
                  <button
                    key={reason.key}
                    type="button"
                    onClick={() => setChosenReason(reason.key)}
                    className={`w-full p-3 rounded-xl border text-right font-bold transition-all flex items-center justify-between ${chosenReason === reason.key ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}
                  >
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${chosenReason === reason.key ? 'border-white' : 'border-neutral-300'}`}>
                      {chosenReason === reason.key && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    <span>{reason.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-neutral-50 p-4 border-t border-neutral-100 flex gap-2.5 justify-end text-xs">
              <button
                type="button"
                onClick={() => {
                  setCancelModalData(null);
                }}
                className="px-4 py-2 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 font-bold rounded-xl cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (cancelModalData) {
                    await handleStatusChange(cancelModalData.orderId, 'cancelled', chosenReason);
                    setCancelModalData(null);
                  }
                }}
                disabled={updating !== null}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {updating ? 'جاري الحفظ...' : 'تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
