import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2, Package } from 'lucide-react';
import { getProductById, createOrder, getShippingRates } from '../firebase';
import { Product } from '../types';
import { algeriaWilayas } from '../data/algeriaCities';

const colorFallbackMap: Record<string, string> = {
  oatmeal: '#E0D4C3',
  sage: '#8F9779',
  charcoal: '#36454F',
  ivory: '#FFFFF0',
  white: '#FFFFFF',
  black: '#000000',
  red: '#FF1212',
  blue: '#123FFF',
  green: '#12FF3F',
  yellow: '#FFFF12',
};

const getCleanedColors = (colors: any[] | undefined | null) => {
  if (!colors || !Array.isArray(colors)) return [];
  
  const seenNames = new Set<string>();
  return colors
    .map(col => {
      if (!col) return null;
      
      // If col is a string
      if (typeof col === 'string') {
        const trimmed = col.trim();
        if (!trimmed) return null;
        
        // Check if it is already a valid HEX code (e.g. #000000)
        if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(trimmed)) {
          return {
            colorName: trimmed,
            colorCode: trimmed
          };
        }
        
        // Otherwise check if it maps to a mapped fallback
        const mappedCode = colorFallbackMap[trimmed.toLowerCase()];
        if (mappedCode && /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(mappedCode)) {
          return {
            colorName: trimmed,
            colorCode: mappedCode
          };
        }
        
        return null;
      }
      
      // If col is an object
      if (typeof col === 'object') {
        const name = col.colorName?.trim() || '';
        let code = col.colorCode?.trim() || '';
        
        if (!name) return null;
        
        // If code is empty, check fallback map by name
        if (!code) {
          const mappedCode = colorFallbackMap[name.toLowerCase()];
          if (mappedCode) {
            code = mappedCode;
          }
        } else {
          // If code is not empty but isn't a hex format, resolve it
          if (!code.startsWith('#')) {
            const mappedCode = colorFallbackMap[code.toLowerCase()];
            if (mappedCode) {
              code = mappedCode;
            }
          }
        }
        
        // Must strictly be a valid Hex code
        if (code && /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(code)) {
          return {
            colorName: name,
            colorCode: code,
            imageUrl: col.imageUrl || ''
          };
        }
      }
      
      return null;
    })
    .filter((c: any): c is { colorName: string; colorCode: string; imageUrl?: string } => {
      if (c === null) return false;
      const normalizedName = c.colorName.trim().toLowerCase();
      if (seenNames.has(normalizedName)) return false;
      seenNames.add(normalizedName);
      return true;
    });
};

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
  
  // Flash Bundle Offers states running on interval
  const [now, setNow] = useState(new Date());
  const [selectedBundleIdx, setSelectedBundleIdx] = useState<number>(-1);

  // Selection states
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  
  // Selections for individual bundle pieces
  const [bundleSelections, setBundleSelections] = useState<{ color?: string; size?: string }[]>([]);

  // Derived state for bundle quantity
  const resolvedQuantityDerived = (
    product &&
    product.flashBundle?.enabled &&
    product.flashBundle.tiers &&
    product.flashBundle.tiers.length > 0 &&
    selectedBundleIdx >= 0 &&
    product.flashBundle.tiers[selectedBundleIdx]
  ) ? product.flashBundle.tiers[selectedBundleIdx].quantity : 1;

  // Sync bundle selections list to resolvedQuantity
  useEffect(() => {
    if (!product) return;
    const sizesList = product.sizes || [];
    const colorsList = getCleanedColors(product.colors);
    setBundleSelections(prev => {
      const next = [...prev];
      if (next.length > resolvedQuantityDerived) {
        return next.slice(0, resolvedQuantityDerived);
      }
      while (next.length < resolvedQuantityDerived) {
        next.push({
          color: (colorsList.length === 1) ? colorsList[0].colorName : '',
          size: (sizesList.length === 1) ? sizesList[0] : ''
        });
      }
      return next;
    });
  }, [resolvedQuantityDerived, product]);

  const updatePieceSelection = (index: number, type: 'color' | 'size', value: string) => {
    setBundleSelections(prev => {
      const next = [...prev];
      if (!next[index]) {
        next[index] = {};
      }
      next[index] = { ...next[index], [type]: value };
      return next;
    });
    setShowErrorMsg(false);
  };
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'pickup'>('home');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Gallery active image
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Form validation/submit states
  const [showErrorMsg, setShowErrorMsg] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    phone?: string;
    state?: string;
    city?: string;
    submit?: string;
  }>({});

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
          const cleanedColorsList = getCleanedColors(prod.colors);
          if (cleanedColorsList.length === 1) {
            setSelectedColor(cleanedColorsList[0].colorName);
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

  // Synchronize dynamic default selection when active (Run before early returns to preserve Hook ordering rules)
  useEffect(() => {
    if (product) {
      const startDateStr = product.flashBundle?.startDate;
      const endDateStr = product.flashBundle?.endDate;
      const startDate = startDateStr ? new Date(startDateStr) : null;
      const endDate = endDateStr ? new Date(endDateStr) : null;
      const checkTime = new Date();

      const isFlashBundleActive = !!(
        product.flashBundle?.enabled &&
        product.flashBundle.tiers &&
        product.flashBundle.tiers.length > 0 &&
        (!startDate || checkTime >= startDate) &&
        (!endDate || checkTime < endDate)
      );

      if (isFlashBundleActive) {
        setSelectedBundleIdx(0);
      } else {
        setSelectedBundleIdx(-1);
      }
    } else {
      setSelectedBundleIdx(-1);
    }
  }, [product?.id]);

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
  const cleanedColors = getCleanedColors(product.colors);
  const hasColors = cleanedColors.length > 0;

  const resolvedQuantity = resolvedQuantityDerived;

  const needsSizeSelection = hasSizes && (resolvedQuantity === 1 ? !selectedSize : bundleSelections.some(item => !item.size));
  const needsColorSelection = hasColors && (resolvedQuantity === 1 ? !selectedColor : bundleSelections.some(item => !item.color));
  
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

  // Flash Bundle Offers calculations
  const startDateStr = product.flashBundle?.startDate;
  const endDateStr = product.flashBundle?.endDate;
  const startDate = startDateStr ? new Date(startDateStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;

  const isFlashBundleActive = !!(
    product.flashBundle?.enabled &&
    product.flashBundle.tiers &&
    product.flashBundle.tiers.length > 0 &&
    (!startDate || now >= startDate) &&
    (!endDate || now < endDate)
  );

  const activeTiers = isFlashBundleActive ? (product.flashBundle?.tiers || []) : [];

  const resolvedProductPrice = (isFlashBundleActive && selectedBundleIdx >= 0 && activeTiers[selectedBundleIdx])
    ? activeTiers[selectedBundleIdx].bundlePrice
    : (product.price || 0);

  const getCountdownString = () => {
    if (!endDate) return "00:00:00";
    const diff = endDate.getTime() - now.getTime();
    if (diff <= 0) return "00:00:00";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const deliveryFee = state 
    ? (deliveryType === 'home' ? resolvedHomePrice : resolvedDeskPrice)
    : 0.00; // 0 if no state is selected yet to make it clean
  const productPrice = resolvedProductPrice;
  const totalPrice = productPrice + deliveryFee;

  // Real-time Order Form Validation Handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFullName(val);
    
    if (!val) {
      setValidationErrors(prev => ({ ...prev, fullName: undefined }));
      return;
    }

    const trimmed = val.trim();
    if (trimmed.length > 0 && !/^[a-zA-Z\s\u0600-\u06FF]+$/.test(trimmed)) {
      setValidationErrors(prev => ({ ...prev, fullName: "الاسم غير صالح" }));
    } else {
      setValidationErrors(prev => {
        if (prev.fullName === "الاسم غير صالح" || (trimmed.length >= 3 && prev.fullName === "الاسم قصير جدا")) {
          return { ...prev, fullName: undefined };
        }
        return prev;
      });
    }
  };

  const handleNameBlur = () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setValidationErrors(prev => ({ ...prev, fullName: "مطلوب" }));
    } else if (!/^[a-zA-Z\s\u0600-\u06FF]+$/.test(trimmed)) {
      setValidationErrors(prev => ({ ...prev, fullName: "الاسم غير صالح" }));
    } else if (trimmed.length < 3) {
      setValidationErrors(prev => ({ ...prev, fullName: "الاسم قصير جدا" }));
    } else {
      setValidationErrors(prev => ({ ...prev, fullName: undefined }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);

    if (!val) {
      setValidationErrors(prev => ({ ...prev, phone: undefined }));
      return;
    }

    const isValidStart = (val.length === 1 && val === '0') || 
                         (val.length >= 2 && ['05', '06', '07'].includes(val.slice(0, 2)));

    if (!isValidStart) {
      setValidationErrors(prev => ({ ...prev, phone: "يجب أن يبدأ بـ 05 / 06 / 07" }));
    } else {
      setValidationErrors(prev => {
        if (val.length === 10 && prev.phone === "يجب أن يتكون من 10 أرقام") {
          return { ...prev, phone: undefined };
        }
        if (prev.phone === "يجب أن يبدأ بـ 05 / 06 / 07") {
          return { ...prev, phone: undefined };
        }
        return prev;
      });
    }
  };

  const handlePhoneBlur = () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setValidationErrors(prev => ({ ...prev, phone: "مطلوب" }));
      return;
    }

    if (!/^\d+$/.test(trimmed)) {
      setValidationErrors(prev => ({ ...prev, phone: "رقم غير صالح" }));
      return;
    }

    if (!/^(05|06|07)/.test(trimmed)) {
      setValidationErrors(prev => ({ ...prev, phone: "يجب أن يبدأ بـ 05 / 06 / 07" }));
      return;
    }

    if (trimmed.length !== 10) {
      setValidationErrors(prev => ({ ...prev, phone: "يجب أن يتكون من 10 أرقام" }));
      return;
    }

    setValidationErrors(prev => ({ ...prev, phone: undefined }));
  };

  const handleStateChange = (val: string) => {
    setState(val);
    setCity('');
    if (!val.trim()) {
      setValidationErrors(prev => ({ ...prev, state: "مطلوب" }));
    } else {
      setValidationErrors(prev => ({ ...prev, state: undefined }));
    }
  };

  const handleStateBlur = () => {
    if (!state.trim()) {
      setValidationErrors(prev => ({ ...prev, state: "مطلوب" }));
    } else {
      setValidationErrors(prev => ({ ...prev, state: undefined }));
    }
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    if (!val.trim()) {
      setValidationErrors(prev => ({ ...prev, city: "مطلوب" }));
    } else {
      setValidationErrors(prev => ({ ...prev, city: undefined }));
    }
  };

  const handleCityBlur = () => {
    if (!city.trim()) {
      setValidationErrors(prev => ({ ...prev, city: "مطلوب" }));
    } else {
      setValidationErrors(prev => ({ ...prev, city: undefined }));
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

    if (!isWilayaEnabled) {
      alert("عذراً، التوصيل غير متوفر لهذه الولاية حالياً. / Delivery is not available for this state.");
      return;
    }

    // Validation
    const isSizeMissing = hasSizes && (resolvedQuantity === 1 ? !selectedSize : bundleSelections.some(item => !item.size));
    const isColorMissing = hasColors && (resolvedQuantity === 1 ? !selectedColor : bundleSelections.some(item => !item.color));

    if (isSizeMissing || isColorMissing) {
      setShowErrorMsg(true);
      // Scroll to options
      const optEl = document.getElementById('options-selector');
      if (optEl) {
        optEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const errors: typeof validationErrors = {};

    // 1. Full name validation
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = "مطلوب";
    } else if (trimmedName.length < 3) {
      errors.fullName = "الاسم قصير جدا";
    } else if (!/^[a-zA-Z\s\u0600-\u06FF]+$/.test(trimmedName)) {
      errors.fullName = "الاسم غير صالح";
    }

    // 2. Phone validation
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      errors.phone = "مطلوب";
    } else if (!/^\d+$/.test(trimmedPhone)) {
      errors.phone = "رقم غير صالح";
    } else if (!/^(05|06|07)/.test(trimmedPhone)) {
      errors.phone = "يجب أن يبدأ بـ 05 / 06 / 07";
    } else if (trimmedPhone.length !== 10) {
      errors.phone = "يجب أن يتكون من 10 أرقام";
    }

    // 3. State check
    if (!state.trim()) {
      errors.state = "مطلوب";
    }

    // 4. City check
    if (!city.trim()) {
      errors.city = "مطلوب";
    }

    // 5. Cooldown check
    if (trimmedPhone && !errors.phone) {
      const cooldownKey = `cooldown_phone_${trimmedPhone}`;
      const lastSubmitTime = localStorage.getItem(cooldownKey);
      if (lastSubmitTime) {
        const diff = Date.now() - Number(lastSubmitTime);
        if (diff < 90000) { // 90 seconds cooldown
          errors.submit = "حاول مرة أخرى لاحقاً";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setShowErrorMsg(false);
    setIsSubmitting(true);

    try {
      const bundleEnabled = isFlashBundleActive && selectedBundleIdx >= 0;
      const currentBundleTier = bundleEnabled ? activeTiers[selectedBundleIdx] : null;
      const bundleQuantity = currentBundleTier ? currentBundleTier.quantity : 0;
      const bundlePrice = currentBundleTier ? currentBundleTier.bundlePrice : 0;
      const originalPrice = currentBundleTier ? (product.price || 0) * currentBundleTier.quantity : 0;
      const savedAmount = currentBundleTier ? (originalPrice - bundlePrice) : 0;
      const savedPercentage = (currentBundleTier && originalPrice > 0) ? Math.round((savedAmount / originalPrice) * 100) : 0;
      const flashOfferId = bundleEnabled ? `${product.id}_flash_bundle` : '';

      const finalBundleItems = resolvedQuantity === 1
        ? [
            {
              color: selectedColor || null,
              size: selectedSize || null
            }
          ]
        : bundleSelections.map(item => ({
            color: item.color || null,
            size: item.size || null
          }));

      const orderData = {
        customerInfo: {
          fullName: trimmedName,
          phone: trimmedPhone,
          state: state.trim(),
          city: city.trim()
        },
        items: [
          {
            id: product.id,
            title: product.name || product.title,
            price: productPrice,
            quantity: resolvedQuantity,
            selectedSize: resolvedQuantity === 1 ? (selectedSize || null) : null,
            selectedColor: resolvedQuantity === 1 ? (selectedColor || null) : null,
            image: product.image || null,
            bundleItems: finalBundleItems
          }
        ],
        deliveryType: deliveryType === 'home' ? 'Home Delivery' : 'Office Pickup',
        deliveryFee,
        totalPrice,
        paymentMethod: 'COD',
        status: 'pending',
        bundleEnabled,
        bundleQuantity: resolvedQuantity,
        bundlePrice: productPrice,
        bundleItems: finalBundleItems, // root level selections list
        originalPrice,
        savedAmount,
        savedPercentage,
        flashOfferId
      };

      await createOrder(orderData);
      
      // Set submission cooldown
      localStorage.setItem(`cooldown_phone_${trimmedPhone}`, Date.now().toString());
      
      // Fire success callback upwards to trigger thank-you transition
      onOrderSuccess({
        productName: product.name || product.title || '',
        totalPrice,
        phoneNumber: trimmedPhone
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

          {/* Flash Bundle Offers Widget */}
          {isFlashBundleActive && activeTiers.length > 0 && (
            <div className="bg-amber-50/45 rounded-2xl border border-amber-500/20 p-4 mt-2 mb-6 space-y-3.5 animate-in fade-in duration-200">

              {/* Header with real-time countdown */}
              <div className="flex justify-between items-center bg-white/95 rounded-xl px-4 py-3 border border-amber-500/10 shadow-sm" dir="rtl">
                <span className="text-[13.5px] font-bold text-[#78350f] flex items-center gap-1.5 font-sans">
                  ⚡ عرض الكمية ينتهي خلال
                </span>
                
                <div className="flex items-center gap-2" dir="rtl">
                  <span className="bg-[#b91c1c] text-white text-[15px] font-mono font-extrabold px-3 py-1.5 rounded-lg tracking-wider shadow-[0_0_12px_rgba(185,28,28,0.6)] animate-countdown-glow select-none">
                    {getCountdownString()}
                  </span>
                </div>
              </div>

              {/* Tiers list display */}
              <div className="space-y-2.5">
                {(() => {
                  const basePrice = product.price || 0;
                  let bestIdx = -1;
                  let maxSaving = 0;
                  
                  activeTiers.forEach((tier, i) => {
                    const originalTotal = basePrice * tier.quantity;
                    const savedAmount = originalTotal - tier.bundlePrice;
                    if (savedAmount > maxSaving) {
                      maxSaving = savedAmount;
                      bestIdx = i;
                    }
                  });

                  // Natural Arabic quantity plural count helper function
                  const getArabicQuantityText = (qty: number) => {
                    if (qty === 1) return "شراء حبة واحدة";
                    if (qty === 2) return "شراء حبتين";
                    if (qty >= 3 && qty <= 10) return `شراء ${qty} حبات`;
                    return `شراء ${qty} حبة`;
                  };

                  return activeTiers.map((tier, idx) => {
                    const originalTotal = basePrice * tier.quantity;
                    const savedAmount = originalTotal - tier.bundlePrice;
                    const savedPercent = originalTotal > 0 ? Math.round((savedAmount / originalTotal) * 100) : 0;
                    const isSelected = selectedBundleIdx === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedBundleIdx(idx)}
                        className={`w-full transition-colors duration-200 flex flex-row items-center justify-between gap-3 p-4 rounded-xl border-2 cursor-pointer relative ${
                          isSelected
                            ? 'border-[#78350f] bg-[#78350f]/5 shadow-xs'
                            : 'border-neutral-200 bg-white hover:bg-neutral-50/50 hover:border-neutral-300 shadow-sm'
                        }`}
                        dir="rtl"
                      >
                        {idx === 1 && (
                          <span className="absolute -top-2.5 right-4 z-10 bg-[#E6C7C2] text-neutral-900 text-[10.5px] font-bold px-2.5 py-0.5 rounded shadow-sm font-sans select-none">
                            الموصى به
                          </span>
                        )}
                        {idx === 2 && (
                          <span className="absolute -top-2.5 right-4 z-10 bg-[#b91c1c] text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded shadow-sm font-sans select-none">
                            أفضل عرض
                          </span>
                        )}

                        {/* Right side: Selection Check & Description */}
                        <div className="flex items-center gap-3 text-right">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                            isSelected ? 'bg-[#78350f] border-[#78350f]' : 'border-neutral-300 bg-white'
                          }`}>
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          
                          <div className="flex flex-col items-start text-right">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5 shrink-0">
                                {Array.from({ length: tier.quantity }).map((_, iconIdx) => (
                                  <Package key={iconIdx} className="w-4 h-4 text-[#78350f]/65 shrink-0" />
                                ))}
                              </div>
                              <span className="text-[14px] font-bold text-neutral-900 font-sans">
                                {getArabicQuantityText(tier.quantity)}
                              </span>
                            </div>
                            {savedAmount > 0 ? (
                              <span className="text-[13px] text-emerald-700 font-extrabold mt-1 font-sans">
                                وفر {savedAmount.toFixed(0)} دج
                              </span>
                            ) : (
                              <span className="text-[13px] text-transparent select-none mt-1 font-sans h-[19.5px] block">
                                &nbsp;
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Left side: Prices stacked vertically directly aligned on the left */}
                        <div className="flex flex-col items-end justify-center select-none shrink-0 gap-1 pl-1">
                          <span className="text-[16px] font-bold text-neutral-900 font-sans leading-none">
                            {tier.bundlePrice.toFixed(0)} دج
                          </span>
                          {savedAmount > 0 ? (
                            <span className="text-[11.5px] text-neutral-400 line-through font-sans leading-none">
                              {originalTotal.toFixed(0)} دج
                            </span>
                          ) : (
                            <span className="text-[11.5px] text-transparent line-through font-sans leading-none select-none h-[11.5px] block">
                              &nbsp;
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          <form onSubmit={handleConfirmOrder} className="space-y-6 mt-6 border-t border-neutral-100 pt-6" id="options-selector">
            
            {resolvedQuantity > 1 ? (
              /* Multi-Piece Bundle Option Selector */
              (hasColors || hasSizes) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1" dir="rtl">
                    <span className="text-[12px] uppercase tracking-wider font-semibold text-neutral-400">
                      تخصيص خيارات كل قطعة / Customize each piece
                    </span>
                  </div>
                  <div className="space-y-4">
                    {Array.from({ length: resolvedQuantity }).map((_, i) => {
                      const pieceColor = bundleSelections[i]?.color || '';
                      const pieceSize = bundleSelections[i]?.size || '';
                      return (
                        <div key={i} className="bg-neutral-50/50 p-4.5 rounded-2xl border border-neutral-200/60 space-y-4 text-right animate-in fade-in duration-200" dir="rtl">
                          <div className="flex justify-between items-center border-b border-neutral-200/30 pb-2 mb-1">
                            <span className="text-[13.5px] font-bold text-[#78350f] flex items-center gap-1.5 font-sans">
                              📦 القطعة {i + 1}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">Piece {i + 1}</span>
                          </div>

                          {/* Color Selection for Piece i */}
                          {hasColors && (
                            <div>
                              <div className="flex justify-between mb-2 text-xs">
                                <span className="font-semibold text-neutral-500">اللون / Color:</span>
                                {pieceColor ? (
                                  <span className="font-bold text-brand-text">{pieceColor}</span>
                                ) : (
                                  <span className="text-red-500 font-semibold text-[11px]">الرجاء اختيار لون</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2.5">
                                {cleanedColors.map((col, index) => {
                                  const name = col.colorName;
                                  const code = col.colorCode;
                                  const isSelected = pieceColor === name;
                                  return (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => {
                                        updatePieceSelection(i, 'color', name);
                                        if (i === 0 && col.imageUrl) {
                                          setActiveImage(col.imageUrl);
                                        }
                                      }}
                                      className={`w-8.5 h-8.5 rounded-full transition-all focus:outline-none relative flex justify-center items-center ${
                                        isSelected
                                          ? 'ring-2 ring-[#78350f] ring-offset-2 scale-95 shadow-sm'
                                          : 'hover:scale-105 border border-neutral-300/70 bg-white'
                                      }`}
                                      style={{ backgroundColor: code }}
                                      title={name}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Size Selection for Piece i */}
                          {hasSizes && (
                            <div>
                              <div className="flex justify-between mb-2 text-xs">
                                <span className="font-semibold text-neutral-500">المقاس / Size:</span>
                                {pieceSize ? (
                                  <span className="font-bold text-brand-text">{pieceSize}</span>
                                ) : (
                                  <span className="text-red-500 font-semibold text-[11px]">الرجاء اختيار مقاس</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {product.sizes?.map((sz) => {
                                  const isSelected = pieceSize === sz;
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => {
                                        updatePieceSelection(i, 'size', sz);
                                      }}
                                      className={`min-w-[3rem] h-9 px-4 rounded-lg text-[12px] font-bold transition-all border flex items-center justify-center ${
                                        isSelected
                                          ? 'bg-[#78350f] text-white border-[#78350f] shadow-sm'
                                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                                      }`}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              /* Single-Piece Original Option Selectors */
              <>
                {/* Color Option Select */}
                {hasColors && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[12px] uppercase tracking-wider font-semibold text-neutral-400">Color / اللون</span>
                      {selectedColor && <span className="text-[12px] font-medium text-brand-text">{selectedColor}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {cleanedColors.map((col, index) => {
                        const name = col.colorName;
                        const code = col.colorCode;
                        const isSelected = selectedColor === name;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => { 
                              setSelectedColor(name); 
                              setShowErrorMsg(false); 
                              if (col.imageUrl) {
                                setActiveImage(col.imageUrl);
                              }
                            }}
                            className={`w-9 h-9 rounded-full transition-all focus:outline-none relative flex justify-center items-center ${
                              isSelected
                                ? 'ring-2 ring-black ring-offset-2 scale-95 shadow-sm'
                                : 'hover:scale-105 border border-neutral-300/60'
                            }`}
                            style={{ backgroundColor: code }}
                            title={name}
                          />
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
                            className={`min-w-[3.5rem] h-10 px-5 rounded-[10px] text-[13px] font-semibold transition-all border flex items-center justify-center ${
                              isSelected
                                ? 'bg-black text-white border-black shadow-sm'
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
              </>
            )}

            {/* ERROR COMPONENT */}
            {showErrorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-100 text-red-500 text-[13px] rounded-xl font-medium text-right" dir="rtl">
                {resolvedQuantity === 1 ? (
                  `يرجى تحديد ${hasColors && !selectedColor ? 'اللون' : ''}${hasColors && !selectedColor && hasSizes && !selectedSize ? ' و ' : ''}${hasSizes && !selectedSize ? 'المقاس' : ''} للقطعة للمتابعة.`
                ) : (
                  `يرجى اختيار ${hasColors && needsColorSelection ? 'الألوان' : ''}${hasColors && needsColorSelection && hasSizes && needsSizeSelection ? ' و ' : ''}${hasSizes && needsSizeSelection ? 'المقاسات' : ''} المطلوبة لجميع القطع داخل العرض لتأكيد الطلب.`
                )}
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
                <label className="flex items-center gap-1.5 justify-start text-[12px] text-neutral-500 mb-1 font-medium" dir="rtl">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>الاسم الكامل / Full Name</span>
                </label>
                <input
                  required
                  type="text"
                  dir="rtl"
                  value={fullName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  placeholder="مثال. حمزة عبد الباسط"
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-[14px] text-right outline-none focus:border-brand-text transition-colors font-sans ${
                    validationErrors.fullName ? 'border-red-400 focus:border-red-400' : 'border-neutral-200'
                  }`}
                />
                {validationErrors.fullName && (
                  <p className="text-red-500 text-[11px] text-right mt-1 font-medium select-none" dir="rtl">
                    {validationErrors.fullName}
                  </p>
                )}
              </div>

              {/* Phone number */}
              <div>
                <label className="flex items-center gap-1.5 justify-start text-[12px] text-neutral-500 mb-1 font-medium" dir="rtl">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>رقم الهاتف / Phone Number</span>
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  placeholder="05/06/07XXXXXXXX"
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors ${
                    validationErrors.phone ? 'border-red-400 focus:border-red-400' : 'border-neutral-200'
                  }`}
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-[11px] text-right mt-1 font-medium select-none" dir="rtl">
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="flex items-center gap-1.5 justify-start text-[12px] text-neutral-500 mb-1 font-medium" dir="rtl">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>الولاية / State</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    onBlur={handleStateBlur}
                    className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-[14px] text-right outline-none focus:border-brand-text transition-colors font-sans appearance-none cursor-pointer ${
                      validationErrors.state ? 'border-red-400 focus:border-red-400' : 'border-neutral-200'
                    }`}
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
                {validationErrors.state && (
                  <p className="text-red-500 text-[11px] text-right mt-1 font-medium select-none" dir="rtl">
                    {validationErrors.state}
                  </p>
                )}
              </div>

              {/* Warning if Wilaya is disabled */}
              {!isWilayaEnabled && state && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[12px] rounded-xl font-medium text-right leading-relaxed animate-fade-in" dir="rtl">
                  ⚠️ عذراً، التوصيل للولاية المحددة (<b>{state}</b>) غير متوفر حالياً. يرجى اختيار ولاية أخرى للتوصيل.
                </div>
              )}

              {/* City */}
              <div>
                <label className="flex items-center gap-1.5 justify-start text-[12px] text-neutral-500 mb-1 font-medium" dir="rtl">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="9" y1="22" x2="9" y2="16" />
                    <line x1="15" y1="22" x2="15" y2="16" />
                    <line x1="9" y1="16" x2="15" y2="16" />
                    <path d="M8 6h.01" />
                    <path d="M16 6h.01" />
                    <path d="M8 10h.01" />
                    <path d="M16 10h.01" />
                  </svg>
                  <span>البلدية / City</span>
                </label>
                <div className="relative">
                  <select
                    required
                    disabled={!state || !isWilayaEnabled}
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    onBlur={handleCityBlur}
                    className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-[14px] text-right outline-none focus:border-brand-text transition-colors font-sans appearance-none ${
                      !state || !isWilayaEnabled ? 'opacity-60 cursor-not-allowed bg-neutral-100' : 'cursor-pointer'
                    } ${
                      validationErrors.city ? 'border-red-400 focus:border-red-400' : 'border-neutral-200'
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
                {validationErrors.city && (
                  <p className="text-red-500 text-[11px] text-right mt-1 font-medium select-none" dir="rtl">
                    {validationErrors.city}
                  </p>
                )}
              </div>

              {/* Delivery Type Options */}
              <div>
                <label className="flex items-center gap-1.5 justify-start text-[12px] text-neutral-500 mb-2 font-medium" dir="rtl">
                  <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span>طريقة التوصيل / Delivery Type</span>
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
              {isFlashBundleActive && resolvedQuantity > 1 && (
                <div className="bg-white/85 border border-dashed border-amber-900/10 rounded-2xl p-4 mb-4 text-right animate-in fade-in duration-150" dir="rtl">
                  <div className="text-[14px] font-extrabold text-[#78350f] mb-2 border-b border-amber-900/5 pb-1">
                    {resolvedQuantity} قطع
                  </div>
                  <div className="space-y-1">
                    {bundleSelections.map((item, index) => {
                      let desc = [];
                      if (item.color) desc.push(item.color);
                      if (item.size) desc.push(item.size);
                      return (
                        <div key={index} className="flex gap-2 text-neutral-800 font-sans text-[13px] font-bold">
                          <span>{index + 1}-</span>
                          <span>
                            {desc.length > 0 ? desc.join(' / ') : '...'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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

            {/* Validation global/submit errors (cooldown) */}
            {validationErrors.submit && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[12px] rounded-xl font-medium text-right leading-relaxed animate-fade-in" dir="rtl">
                ⚠️ {validationErrors.submit}
              </div>
            )}

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

          {/* Product Detail Images (Descriptive full-bleeding sequence similar to AliExpress / Shein) */}
          {product.detailImages && product.detailImages.length > 0 && (
            <div className="mt-12 border-t border-neutral-150 pt-8" id="product-detail-images-section">
              <div className="mb-6 text-center">
                <h3 className="font-serif italic text-2xl text-brand-text">تفاصيل المنتج</h3>
                <p className="text-[11px] text-neutral-400 tracking-wider uppercase mt-1">Product Details</p>
              </div>
              <div className="space-y-4 flex flex-col items-center">
                {product.detailImages.map((imageUrl, idx) => (
                  <div key={idx} className="w-full relative overflow-hidden bg-white/50 rounded-2xl border border-neutral-200/50">
                    <img
                      src={imageUrl}
                      alt={`Product detail explanatory visual ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
