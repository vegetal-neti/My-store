import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { getProductById, createOrder, getShippingRates } from '../firebase';
import { Product } from '../types';
import { algeriaWilayas } from '../data/algeriaCities';

interface ProductDetailsProps {
  productId: string;
  onBack: () => void;
  onOrderSuccess: (orderInfo: { productName: string; totalPrice: number; phoneNumber: string }) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ productId, onBack, onOrderSuccess }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [dbRates, setDbRates] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection states
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'pickup'>('home');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Gallery active image
  const [activeImage, setActiveImage] = useState<string>('');
  
  // Form validation/submit states
  const [showErrorMsg, setShowErrorMsg] = useState(false);

  useEffect(() => {
    const fetchProductAndRates = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prodData, ratesData] = await Promise.all([
          getProductById(productId),
          getShippingRates()
        ]);

        if (prodData) {
          const prod = prodData as any;
          setProduct(prod as Product);
          // Set initial active image
          if (prod.image) {
            setActiveImage(prod.image);
          } else if (prod.images && prod.images.length > 0) {
            setActiveImage(prod.images[0]);
          }
          
          // If there is only one size/color, preselect it
          if (prod.sizes && prod.sizes.length === 1) {
            setSelectedSize(prod.sizes[0]);
          }
          if (prod.colors && prod.colors.length === 1) {
            setSelectedColor(prod.colors[0]);
          }
        } else {
          setError('Product not found.');
        }

        // Parse ratesData into dynamic lookup map
        const tempRates: Record<number, any> = {};
        if (ratesData && ratesData.length > 0) {
          ratesData.forEach((fr: any) => {
            const wId = Number(fr.wilayaId);
            if (wId) {
              tempRates[wId] = fr;
            }
          });
        }
        setDbRates(tempRates);

      } catch (err) {
        console.error(err);
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductAndRates();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-brand-bg py-20">
        <div className="w-8 h-8 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[13px] text-neutral-500 font-medium">Loading details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-brand-bg min-h-screen text-center">
        <h2 className="text-xl font-medium text-brand-text">Error</h2>
        <p className="text-[14px] text-neutral-500 mt-2 max-w-[280px]">{error || 'Something went wrong'}</p>
        <button onClick={onBack} className="mt-8 bg-brand-text text-white px-8 py-3.5 rounded-full font-medium text-[14px] hover:bg-neutral-800 transition-all shadow-sm">
          Return to Shop
        </button>
      </div>
    );
  }

  // Check if options are configured in Firestore
  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasColors = product.colors && product.colors.length > 0;
  
  // Under stock warning
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const selectedWilayaObj = algeriaWilayas.find(w => w.name === state || w.nameEn === state);
  const resolvedRateObj = selectedWilayaObj ? dbRates[selectedWilayaObj.id] : null;

  const isWilayaEnabled = selectedWilayaObj 
    ? (resolvedRateObj ? Boolean(resolvedRateObj.enabled) : true) 
    : true;

  const resolvedHomePrice = selectedWilayaObj 
    ? (resolvedRateObj && resolvedRateObj.homePrice !== undefined ? Number(resolvedRateObj.homePrice) : selectedWilayaObj.shippingHome) 
    : 0;

  const resolvedDeskPrice = selectedWilayaObj 
    ? (resolvedRateObj && resolvedRateObj.deskPrice !== undefined ? Number(resolvedRateObj.deskPrice) : selectedWilayaObj.shippingPickup) 
    : 0;

  const deliveryFee = state 
    ? (deliveryType === 'home' ? resolvedHomePrice : resolvedDeskPrice)
    : 0.00; // 0 if no state is selected yet to make it clean
  const productPrice = product.price || 0;
  const totalPrice = productPrice + deliveryFee;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

    if (!isWilayaEnabled) {
      alert("عذراً، التوصيل غير متوفر لهذه الولاية حالياً. / Delivery is not available for this state.");
      return;
    }

    // Validation
    const needsSizeSelection = hasSizes && !selectedSize;
    const needsColorSelection = hasColors && !selectedColor;

    if (needsSizeSelection || needsColorSelection) {
      setShowErrorMsg(true);
      // Scroll to options
      const optEl = document.getElementById('options-selector');
      if (optEl) {
        optEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (!fullName.trim() || !phone.trim() || !state.trim() || !city.trim()) {
      return;
    }

    setShowErrorMsg(false);
    setIsSubmitting(true);

    try {
      const orderData = {
        customerInfo: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          state: state.trim(),
          city: city.trim()
        },
        items: [
          {
            id: product.id,
            title: product.name || product.title,
            price: productPrice,
            quantity: 1,
            selectedSize: selectedSize || null,
            selectedColor: selectedColor || null,
            image: product.image || null
          }
        ],
        deliveryType: deliveryType === 'home' ? 'Home Delivery' : 'Office Pickup',
        deliveryFee,
        totalPrice,
        paymentMethod: 'COD',
        status: 'pending'
      };

      await createOrder(orderData);
      
      // Fire success callback upwards to trigger thank-you transition
      onOrderSuccess({
        productName: product.name || product.title || '',
        totalPrice,
        phoneNumber: phone.trim()
      });
    } catch (err) {
      console.error("Order verification failed:", err);
      alert("Something went wrong while confirming your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gallery images array
  const galleryImages = [
    ...(product.image ? [product.image] : []),
    ...(product.images || [])
  ].filter((value, index, self) => self.indexOf(value) === index); // unique list of images

  return (
    <div className="flex-1 flex flex-col bg-brand-bg pb-12">
      {/* Navigation Header */}
      <header className="px-5 pt-4 pb-3 flex items-center justify-between sticky top-0 bg-brand-bg/95 backdrop-blur-md z-10 border-b border-neutral-100">
        <button onClick={onBack} className="text-brand-text hover:text-neutral-500 p-1 -ml-1 transition-colors flex items-center gap-1.5" id="prod-back-btn">
          <ArrowLeft strokeWidth={1.5} size={20} />
          <span className="text-xs tracking-wider uppercase font-medium">Back</span>
        </button>
        <h1 className="font-serif italic text-xl tracking-tight">Direct Purchase</h1>
        <div className="w-8" /> {/* Balance */}
      </header>

      {/* Main Content */}
      <div className="px-5 pt-6 flex-1 flex flex-col">
        {/* Gallery Section */}
        <section className="relative mb-6">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-brand-card-beige relative border border-neutral-200/40">
            {product.badge && (
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 pt-1.5 pb-1 rounded-full shadow-sm">
                <span className="text-[9px] font-semibold tracking-[0.05em] uppercase text-brand-text">
                  {product.badge}
                </span>
              </div>
            )}
            {activeImage ? (
              <>
                <img 
                  src={activeImage} 
                  alt={product.name || product.title} 
                  loading="lazy"
                  className="w-full h-full object-cover transition-all duration-300" 
                  referrerPolicy="no-referrer" 
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                No Image Available
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1 no-scrollbar">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-14 h-17 rounded-xl overflow-hidden shrink-0 transition-all p-0.5 border ${
                    activeImage === img ? 'border-brand-text scale-95 shadow-sm' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover rounded-[10px]" alt={`thumb-${idx}`} loading="lazy" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Details section */}
        <section className="flex flex-col flex-1">
          {/* Category */}
          {product.category && (
            <span className="text-[10px] tracking-[0.2em] font-semibold text-neutral-400 uppercase mb-1">
              {product.category}
            </span>
          )}

          {/* Title & Price */}
          <div className={`flex justify-between items-start gap-4 mb-3 ${/[\u0600-\u06FF]/.test(product.name || product.title || '') ? 'flex-row-reverse' : ''}`}>
            <h2 className={`font-serif text-3xl text-brand-text tracking-tight leading-tight flex-1 ${/[\u0600-\u06FF]/.test(product.name || product.title || '') ? 'text-right' : 'text-left'}`}>
              {product.name || product.title}
            </h2>
            <div className="shrink-0 flex flex-col items-end">
              <span className="font-serif text-2xl font-bold text-brand-text inline-flex gap-1" dir="ltr">
                <span className="text-[14px] font-normal opacity-90 mt-2">دج</span>
                <span>{(product.price || 0).toFixed(0)}</span>
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <div className="flex items-center gap-1.5 mt-1 select-none">
                  <span className="text-[13px] font-normal text-neutral-400 line-through inline-flex gap-1" dir="ltr">
                    <span className="text-[11px] font-normal">دج</span>
                    <span>{product.oldPrice.toFixed(0)}</span>
                  </span>
                  <span className="bg-red-50 text-red-600 text-[11px] font-bold px-2 py-0.5 rounded-full border border-red-200/20">
                    -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8_">
            <h4 className="text-[12px] uppercase tracking-wider font-semibold text-neutral-400 mb-2">Description</h4>
            <p className={`text-[14px] text-neutral-600 leading-relaxed font-sans font-normal whitespace-pre-wrap mb-6 ${/[\u0600-\u06FF]/.test(product.description || '') ? 'text-right' : 'text-left'}`}>
              {product.description || 'No description provided for this classic item.'}
            </p>
          </div>

          <form onSubmit={handleConfirmOrder} className="space-y-6 mt-6 border-t border-neutral-100 pt-6" id="options-selector">
            
            {/* Color Option Select */}
            {hasColors && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[12px] uppercase tracking-wider font-semibold text-neutral-400">Color / اللون</span>
                  {selectedColor && <span className="text-[12px] font-medium text-brand-text">{selectedColor}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors?.map((col) => {
                    const isSelected = selectedColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => { setSelectedColor(col); setShowErrorMsg(false); }}
                        className={`px-4 py-2.5 rounded-full text-[13px] font-medium transition-all ${
                          isSelected
                            ? 'bg-brand-text text-white shadow-sm'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Option Select */}
            {hasSizes && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[12px] uppercase tracking-wider font-semibold text-neutral-400">Size / المقاس</span>
                  {selectedSize && <span className="text-[12px] font-medium text-brand-text">{selectedSize}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes?.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => { setSelectedSize(sz); setShowErrorMsg(false); }}
                        className={`w-11 h-11 rounded-full text-[13px] font-semibold transition-all border flex items-center justify-center ${
                          isSelected
                            ? 'bg-brand-text text-white border-brand-text shadow-sm'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ERROR COMPONENT */}
            {showErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-500 text-[13px] rounded-xl font-medium">
                Please select both {hasSizes && !selectedSize && 'Size'} {hasSizes && !selectedSize && hasColors && !selectedColor && 'and'} {hasColors && !selectedColor && 'Color'} to proceed.
              </div>
            )}

            {/* INSTANT ORDER SHIPPING INFORMATION */}
            <div className="bg-neutral-50 p-5 rounded-3xl border border-neutral-200/40 space-y-4">
              <h3 className="font-serif italic text-lg text-brand-text border-b border-neutral-200/50 pb-2 flex items-center justify-center relative">
                <span>نموذج الطلب</span>
                <span className="absolute left-0 text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono font-bold">COD</span>
              </h3>
              
              {/* Full name */}
              <div>
                <label className="block text-[12px] text-neutral-500 mb-1 font-medium text-right">
                  Full Name / الاسم الكامل *
                </label>
                <input
                  required
                  type="text"
                  dir="rtl"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال. حمزة عبد الباسط"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[14px] text-right outline-none focus:border-brand-text transition-colors font-sans"
                />
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-[12px] text-neutral-500 mb-1 font-medium text-right">
                  Phone Number / رقم الهاتف *
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05/06/07XXXXXXXX"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-[12px] text-neutral-500 mb-1 font-medium text-right">
                  State / الولاية *
                </label>
                <div className="relative">
                  <select
                    required
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setCity(''); // Reset selected commune on state change
                    }}
                    className="w-full bg-white border border-neutral-200 rounded-xl pl-10 pr-4 py-3 text-[14px] text-right outline-none focus:border-brand-text transition-colors font-sans appearance-none cursor-pointer"
                    dir="rtl"
                  >
                    <option value="" disabled>-- اختر الولاية / Select State --</option>
                    {algeriaWilayas.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.code} - {w.name} ({w.nameEn})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Warning if Wilaya is disabled */}
              {!isWilayaEnabled && state && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[12px] rounded-xl font-medium text-right leading-relaxed animate-fade-in" dir="rtl">
                  ⚠️ عذراً، التوصيل للولاية المحددة (<b>{state}</b>) غير متوفر حالياً. يرجى اختيار ولاية أخرى للتوصيل.
                </div>
              )}

              {/* City */}
              <div>
                <label className="block text-[12px] text-neutral-500 mb-1 font-medium text-right">
                  City / البلدية *
                </label>
                <div className="relative">
                  <select
                    required
                    disabled={!state || !isWilayaEnabled}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full bg-white border border-neutral-200 rounded-xl pl-10 pr-4 py-3 text-[14px] text-right outline-none focus:border-brand-text transition-colors font-sans appearance-none ${
                      !state || !isWilayaEnabled ? 'opacity-60 cursor-not-allowed bg-neutral-100' : 'cursor-pointer'
                    }`}
                    dir="rtl"
                  >
                    <option value="" disabled>
                      {!state ? 'الرجاء اختيار الولاية أولاً' : !isWilayaEnabled ? 'التوصيل غير متاح' : '-- اختر البلدية / Select City --'}
                    </option>
                    {selectedWilayaObj?.communes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Delivery Type Options */}
              <div>
                <label className="block text-[12px] text-neutral-500 mb-2 font-medium text-right">
                  Delivery Type / طريقة التوصيل *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('home')}
                    className={`p-3.5 border text-center rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                      deliveryType === 'home'
                        ? 'border-brand-text bg-white shadow-sm font-semibold text-brand-text'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="text-[13px] leading-none font-medium">توصيل للمنزل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-3.5 border text-center rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                      deliveryType === 'pickup'
                        ? 'border-brand-text bg-white shadow-sm font-semibold text-brand-text'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="text-[13px] leading-none font-medium">استلام من المكتب</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Order Summary inside details page */}
              <div className="border-t border-neutral-200/50 pt-3 mt-3 space-y-2">
                
                <div className="flex justify-between text-[13px] text-neutral-600" dir="rtl">
                  <span>سعر المنتج</span>
                  <span className="inline-flex gap-1" dir="ltr">
                    <span>دج</span>
                    <span>{productPrice.toFixed(0)}</span>
                  </span>
                </div>

                <div className="flex justify-between text-[13px] text-neutral-600" dir="rtl">
                  <span>سعر التوصيل</span>
                  <span className="inline-flex gap-1" dir="ltr">
                    <span>دج</span>
                    <span>{deliveryFee.toFixed(0)}</span>
                  </span>
                </div>

                <div className="flex justify-between text-[14px] font-semibold text-brand-text border-t border-dashed border-neutral-200 pt-2 mt-1" dir="rtl">
                  <span>المجموع الإجمالي</span>
                  <span className="inline-flex gap-1" dir="ltr">
                    <span>دج</span>
                    <span>{totalPrice.toFixed(0)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Order button */}
            <button
              type="submit"
              disabled={isOutOfStock || isSubmitting || !isWilayaEnabled}
              className={`w-full py-4 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                isOutOfStock || !isWilayaEnabled
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-neutral-800 text-white cursor-wait opacity-90'
                  : 'bg-brand-text text-white hover:bg-neutral-800 shadow-md active:scale-[0.99] hover:shadow-lg'
              }`}
            >
              {isOutOfStock ? (
                'Out of Stock'
              ) : !isWilayaEnabled ? (
                'التوصيل غير متوفر حالياً / Delivery Unavailable'
              ) : isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Confirming Order... | جاري الإرسال</span>
                </>
              ) : (
                <>
                  <span>تأكيد الطلب</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
