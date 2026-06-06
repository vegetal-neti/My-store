import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { getProductById, createOrder } from '../firebase';
import { Product } from '../types';

interface ProductDetailsProps {
  productId: string;
  onBack: () => void;
  onOrderSuccess: (orderInfo: { productName: string; totalPrice: number; phoneNumber: string }) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ productId, onBack, onOrderSuccess }) => {
  const [product, setProduct] = useState<Product | null>(null);
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
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProductById(productId) as any;
        if (data) {
          setProduct(data as Product);
          // Set initial active image
          if (data.image) {
            setActiveImage(data.image);
          } else if (data.images && data.images.length > 0) {
            setActiveImage(data.images[0]);
          }
          
          // If there is only one size/color, preselect it
          if (data.sizes && data.sizes.length === 1) {
            setSelectedSize(data.sizes[0]);
          }
          if (data.colors && data.colors.length === 1) {
            setSelectedColor(data.colors[0]);
          }
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
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

  const deliveryFee = deliveryType === 'home' ? 10.00 : 0.00;
  const productPrice = product.price || 0;
  const totalPrice = productPrice + deliveryFee;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

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
              <img src={activeImage} alt={product.name || product.title} className="w-full h-full object-cover transition-all duration-300" referrerPolicy="no-referrer" />
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
                  <img src={img} className="w-full h-full object-cover rounded-[10px]" alt={`thumb-${idx}`} referrerPolicy="no-referrer" />
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
          <div className="flex justify-between items-start gap-4 mb-3">
            <h2 className="font-serif text-3xl text-brand-text tracking-tight leading-tight flex-1">
              {product.name || product.title}
            </h2>
            <span className="font-serif text-2xl text-brand-text pt-1 shrink-0 inline-flex gap-1" dir="ltr">
              <span>دج</span>
              <span>{(product.price || 0).toFixed(2)}</span>
            </span>
          </div>

          {/* Rating */}
          {(product.rating !== undefined && product.reviews !== undefined) && (
            <div className="flex items-center gap-1.5 mb-4">
              <div className="flex gap-[1.5px]">
                {[1,2,3,4,5].map(star => (
                   <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill={product.rating && product.rating >= star ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" className="text-brand-text">
                     <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                   </svg>
                ))}
              </div>
              <span className="text-[12px] font-medium text-neutral-500 mt-[1px]">{product.rating} ({product.reviews} reviews)</span>
            </div>
          )}

          {/* Cash on Delivery Badge */}
          <div className="flex items-center gap-2.5 bg-emerald-50/60 border border-emerald-200/40 px-4 py-3 rounded-2xl mb-6 self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <div className="text-[12px] leading-tight text-neutral-700 font-sans">
              <span className="font-semibold text-emerald-800">الدفع عند الاستلام متاح</span>
              <span className="text-neutral-300 mx-1.5">|</span>
              <span className="font-medium text-emerald-800/95">Cash on Delivery Available</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8_">
            <h4 className="text-[12px] uppercase tracking-wider font-semibold text-neutral-400 mb-2">Description</h4>
            <p className="text-[14px] text-neutral-600 leading-relaxed font-sans font-normal whitespace-pre-wrap mb-6">
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
              <h3 className="font-serif italic text-lg text-brand-text border-b border-neutral-200/50 pb-2 flex justify-between items-center">
                <span>Quick Order Form / نموذج الطلب السريع</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono font-bold">COD</span>
              </h3>
              
              {/* Full name */}
              <div>
                <label className="block text-[12px] text-neutral-500 mb-1 font-medium">
                  Full Name / الاسم الكامل *
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال. حمزة عبد الباسط"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors"
                />
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-[12px] text-neutral-500 mb-1 font-medium">
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
                <label className="block text-[12px] text-neutral-500 mb-1 font-medium">
                  State / الولاية *
                </label>
                <input
                  required
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="ادخل الولاية"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-[12px] text-neutral-500 mb-1 font-medium">
                  City / البلدية *
                </label>
                <input
                  required
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ادخل البلدية"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors"
                />
              </div>

              {/* Delivery Type Options */}
              <div>
                <label className="block text-[12px] text-neutral-500 mb-2 font-medium">
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
                    <span className="text-[13px] leading-none">Home Delivery</span>
                    <span className="text-[10px] opacity-80 font-medium">توصيل للمنزل (+10 دج)</span>
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
                    <span className="text-[13px] leading-none">Office Pickup</span>
                    <span className="text-[10px] opacity-80 font-medium">استلام من المكتب (0 دج)</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Order Summary inside details page */}
              <div className="border-t border-neutral-200/50 pt-3 mt-3 space-y-2">
                <span className="block text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                  Order Summary / ملخص الطلب
                </span>
                
                <div className="flex justify-between text-[13px] text-neutral-600">
                  <span className="truncate max-w-[220px]">
                    {product.name || product.title} {selectedSize && `(${selectedSize})`} {selectedColor && `(${selectedColor})`}
                  </span>
                  <span className="inline-flex gap-1" dir="ltr">
                    <span>دج</span>
                    <span>{productPrice.toFixed(2)}</span>
                  </span>
                </div>

                <div className="flex justify-between text-[13px] text-neutral-600">
                  <span>Delivery Fee ({deliveryType === 'home' ? 'Home' : 'Pickup'})</span>
                  <span className="inline-flex gap-1" dir="ltr">
                    <span>دج</span>
                    <span>{deliveryFee.toFixed(2)}</span>
                  </span>
                </div>

                <div className="flex justify-between text-[14px] font-semibold text-brand-text border-t border-dashed border-neutral-200 pt-2 mt-1">
                  <span>Total Amount / المجموع الإجمالي</span>
                  <span className="font-serif inline-flex gap-1" dir="ltr">
                    <span>دج</span>
                    <span>{totalPrice.toFixed(2)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Stock status indicator */}
            <div className="flex items-center justify-between px-1 text-[13px] text-neutral-500">
              <span>Availability</span>
              {isOutOfStock ? (
                <span className="text-red-500 font-semibold uppercase tracking-wider text-[11px]">Out of stock</span>
              ) : (
                <span className="text-emerald-600 font-medium font-mono">
                  {product.stock !== undefined ? `${product.stock} items remaining` : 'In Stock'}
                </span>
              )}
            </div>

            {/* Confirm Order button */}
            <button
              type="submit"
              disabled={isOutOfStock || isSubmitting}
              className={`w-full py-4 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                isOutOfStock
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-neutral-800 text-white cursor-wait opacity-90'
                  : 'bg-brand-text text-white hover:bg-neutral-800 shadow-md active:scale-[0.99] hover:shadow-lg'
              }`}
            >
              {isOutOfStock ? (
                'Out of Stock'
              ) : isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Confirming Order... | جاري الإرسال</span>
                </>
              ) : (
                <>
                  <span>CONFIRM ORDER | تأكيد الطلب</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
