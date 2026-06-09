import React, { useEffect, useState } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories, getColors, addColorDoc, updateColorDoc, deleteColorDoc } from '../../firebase';
import { Edit2, Trash2, Plus, X, Image as ImageIcon, Check, Edit3 } from 'lucide-react';
import { ProductImageUpload } from './ProductImageUpload';
import { ProductDetailImagesUpload } from './ProductDetailImagesUpload';

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

const safeConfirm = (message: string): boolean => {
  try {
    return window.confirm(message);
  } catch (e) {
    console.warn("Window confirm blocked in sandboxed iframe:", e);
    return true; // Safe fallback to let users proceed when dialogs are blocked by iframe sandbox
  }
};

export const normalizeProductColors = (colorsArray: any[]) => {
  if (!Array.isArray(colorsArray)) return [];
  const seenNames = new Set<string>();
  return colorsArray
    .map((c: any) => {
      if (!c) return null;
      if (typeof c === 'string') {
        const trimmed = c.trim();
        if (!trimmed) return null;
        
        if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(trimmed)) {
          return {
            colorName: trimmed,
            colorCode: trimmed
          };
        }
        
        const mappedCode = colorFallbackMap[trimmed.toLowerCase()];
        if (mappedCode && /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(mappedCode)) {
          return {
            colorName: trimmed,
            colorCode: mappedCode
          };
        }
        
        return null;
      }
      
      if (typeof c === 'object') {
        const name = c.colorName?.trim() || '';
        let code = c.colorCode?.trim() || '';
        const imageUrl = c.imageUrl || '';
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
            imageUrl: imageUrl
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

export const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Colors state
  const [globalColors, setGlobalColors] = useState<any[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  
  // State for editing an existing global color
  const [editingColor, setEditingColor] = useState<any | null>(null);
  const [editColorName, setEditColorName] = useState('');
  const [editColorCode, setEditColorCode] = useState('#000000');

  // Confirmation state for deleting products/colors
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'product' | 'color';
    id: string;
    title: string;
    message: string;
    extra?: any;
  } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    oldPrice: '',
    image: '',
    description: '',
    bgColor: 'beige',
    rating: '5',
    reviews: '0',
    category: '',
    categoryId: '',
    stock: '10',
    imagesInput: [] as string[],
    detailImagesInput: [] as string[],
    sizesInput: [] as string[],
    colorsInput: [] as any[],
    flashBundleEnabled: false,
    flashBundleStartDate: '',
    flashBundleEndDate: '',
    flashBundleTiers: [] as Array<{ quantity: number; bundlePrice: number }>
  });

  // Local state for adding individual elements to lists
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newTierQty, setNewTierQty] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchColors();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategoriesList(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchColors = async () => {
    try {
      const data = await getColors();
      setGlobalColors(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const priceVal = parseFloat(formData.price) || 0;
    const oldPriceStr = formData.oldPrice ? formData.oldPrice.trim() : '';
    let oldPriceVal: number | null = null;
    let discountPercentageVal: number | null = null;

    if (oldPriceStr !== '') {
      const parsed = parseFloat(oldPriceStr);
      if (isNaN(parsed) || parsed <= 0) {
        setError('يرجى إدخال قيمة صحيحة للسعر القديم أو تركه فارغاً.');
        setLoading(false);
        return;
      }
      if (parsed <= priceVal) {
        setError('خطأ: السعر القديم (Old Price) يجب أن يكون أكبر من السعر الحالي (Price)!');
        setLoading(false);
        return;
      }
      oldPriceVal = parsed;
      discountPercentageVal = Math.round(((parsed - priceVal) / parsed) * 100);
    }

    const productData = {
      title: formData.title,
      name: formData.title, // keep name and title synchronized
      price: priceVal,
      oldPrice: oldPriceVal,
      discountPercentage: discountPercentageVal,
      image: formData.image || (formData.imagesInput.length > 0 ? formData.imagesInput[0] : ''),
      description: formData.description,
      bgColor: formData.bgColor,
      rating: parseFloat(formData.rating) || 5,
      reviews: parseInt(formData.reviews) || 0,
      category: formData.category,
      categoryId: formData.categoryId || '',
      stock: parseInt(formData.stock) || 0,
      images: formData.imagesInput,
      detailImages: formData.detailImagesInput,
      sizes: formData.sizesInput,
      colors: formData.colorsInput,
      flashBundle: {
        enabled: formData.flashBundleEnabled,
        startDate: formData.flashBundleStartDate || '',
        endDate: formData.flashBundleEndDate || '',
        tiers: formData.flashBundleTiers || []
      }
    };

    try {
      if (isEditing) {
        await updateProduct(isEditing.id, productData);
      } else {
        await addProduct(productData);
      }
      await fetchProducts();
      setIsAdding(false);
      setIsEditing(null);
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, productTitle: string) => {
    setConfirmDelete({
      type: 'product',
      id,
      title: 'حذف المنتج / Delete Product',
      message: `هل أنت متأكد من رغبتك في حذف المنتج "${productTitle}"؟ لا يمكن التراجع عن هذا الإجراء.`
    });
  };

  const handleDeleteColorClick = (color: any) => {
    setConfirmDelete({
      type: 'color',
      id: color.id,
      title: 'حذف اللون / Delete Color',
      message: `هل أنت متأكد من رغبتك في حذف لون "${color.colorName}" (${color.colorCode})؟ سيتم إزالته من كافة المنتجات والخيارات المرتبطة به.`,
      extra: color
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      if (confirmDelete.type === 'product') {
        await deleteProduct(confirmDelete.id);
        await fetchProducts();
      } else if (confirmDelete.type === 'color') {
        const color = confirmDelete.extra;
        await deleteColorDoc(color.id, color.colorName, color.colorCode);
        
        // Update local state by filtering out de-selected color
        setFormData(prev => ({
          ...prev,
          colorsInput: prev.colorsInput.filter(c => !(c && typeof c === 'object' && (c.colorName?.trim().toLowerCase() === color.colorName?.trim().toLowerCase())))
        }));

        const freshPool = await getColors();
        setGlobalColors(freshPool || []);
        await fetchProducts();
      }
    } catch (err) {
      console.error("Error during deletion execution:", err);
    } finally {
      setConfirmDelete(null);
      setLoading(false);
    }
  };

  const startEdit = (product: any) => {
    setIsEditing(product);
    setError(null);
    setFormData({
      title: product.title || product.name || '',
      price: product.price?.toString() || '0',
      oldPrice: product.oldPrice?.toString() || '',
      image: product.image || '',
      description: product.description || '',
      bgColor: product.bgColor || 'beige',
      rating: product.rating?.toString() || '5',
      reviews: product.reviews?.toString() || '0',
      category: product.category || '',
      categoryId: product.categoryId || '',
      stock: product.stock?.toString() || '10',
      imagesInput: product.images || [],
      detailImagesInput: product.detailImages || [],
      sizesInput: product.sizes || [],
      colorsInput: normalizeProductColors(product.colors || []),
      flashBundleEnabled: product.flashBundle?.enabled || false,
      flashBundleStartDate: product.flashBundle?.startDate || '',
      flashBundleEndDate: product.flashBundle?.endDate || '',
      flashBundleTiers: product.flashBundle?.tiers || []
    });
    setIsAdding(false);
    setNewImageUrl('');
    setNewSize('');
    setNewTierQty('');
    setNewTierPrice('');
  };

  const startAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setError(null);
    setFormData({
      title: '',
      price: '',
      oldPrice: '',
      image: '',
      description: '',
      bgColor: 'beige',
      rating: '5',
      reviews: '0',
      category: '',
      categoryId: '',
      stock: '10',
      imagesInput: [],
      detailImagesInput: [],
      sizesInput: ['XS', 'S', 'M', 'L', 'XL'], // Default sizes
      colorsInput: [], // Start empty, check default ones from global pool
      flashBundleEnabled: false,
      flashBundleStartDate: '',
      flashBundleEndDate: '',
      flashBundleTiers: []
    });
    setNewImageUrl('');
    setNewSize('');
    setNewTierQty('');
    setNewTierPrice('');
  };

  const cancelEditAdd = () => {
    setIsAdding(false);
    setIsEditing(null);
    setError(null);
  };

  // List manipulation helpers
  const appendImage = () => {
    if (newImageUrl && !formData.imagesInput.includes(newImageUrl)) {
      setFormData(prev => ({
        ...prev,
        imagesInput: [...prev.imagesInput, newImageUrl]
      }));
      setNewImageUrl('');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      imagesInput: prev.imagesInput.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const appendSize = () => {
    const formattedSize = newSize.trim().toUpperCase();
    if (formattedSize && !formData.sizesInput.includes(formattedSize)) {
      setFormData(prev => ({
        ...prev,
        sizesInput: [...prev.sizesInput, formattedSize]
      }));
      setNewSize('');
    }
  };

  const removeSize = (sizeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      sizesInput: prev.sizesInput.filter(s => s !== sizeToRemove)
    }));
  };

  const appendTier = () => {
    const qty = parseInt(newTierQty);
    const pPrice = parseFloat(newTierPrice);
    if (!qty || qty <= 0) {
      alert("الرجاء إدخال كمية صحيحة أكبر من 0 / Please enter valid quantity");
      return;
    }
    if (!pPrice || pPrice <= 0) {
      alert("الرجاء إدخال سعر صحيح أكبر من 0 / Please enter valid price");
      return;
    }
    const exists = formData.flashBundleTiers.some(t => t.quantity === qty);
    if (exists) {
      alert("هذه الكمية مضافة بالفعل! / This quantity tier is already added!");
      return;
    }
    const updated = [...formData.flashBundleTiers, { quantity: qty, bundlePrice: pPrice }]
      .sort((a, b) => a.quantity - b.quantity);
    setFormData(prev => ({ ...prev, flashBundleTiers: updated }));
    setNewTierQty('');
    setNewTierPrice('');
  };

  const removeTier = (indexToRemove: number) => {
    const updated = formData.flashBundleTiers.filter((_, idx) => idx !== indexToRemove);
    setFormData(prev => ({ ...prev, flashBundleTiers: updated }));
  };

  // Global pool / local selection colors routines
  const handleToggleProductColor = (color: any) => {
    const isSelected = formData.colorsInput.some(c => 
      c && typeof c === 'object' && 
      c.colorName?.trim().toLowerCase() === color.colorName?.trim().toLowerCase()
    );
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        colorsInput: prev.colorsInput.filter(c => 
          !(c && typeof c === 'object' && c.colorName?.trim().toLowerCase() === color.colorName?.trim().toLowerCase())
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        colorsInput: [...prev.colorsInput, { colorName: color.colorName, colorCode: color.colorCode }]
      }));
    }
  };

  const handleAddNewColorToPool = async () => {
    const name = newColorName.trim();
    let code = newColorCode.trim();

    if (!name) {
      alert('Please enter a color name. / يرجى إدخال اسم اللون.');
      return;
    }
    if (!code) {
      alert('Please select or specify a HEX code. / يرجى إدخال كود لون HEX.');
      return;
    }
    if (!code.startsWith('#')) {
      code = '#' + code;
    }
    if (!/^#[0-9A-F]{6}$/i.test(code)) {
      alert('Color code must be a valid 6-character hex. (e.g. #000000)');
      return;
    }

    try {
      setLoading(true);
      const newId = await addColorDoc({ colorName: name, colorCode: code });
      
      // Auto toggle to current product colors too
      setFormData(prev => ({
        ...prev,
        colorsInput: [...prev.colorsInput, { id: newId, colorName: name, colorCode: code }]
      }));

      // Refresh global pool
      const freshPool = await getColors();
      setGlobalColors(freshPool || []);

      setNewColorName('');
      setNewColorCode('#000000');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Removing deleted global color function replaced by custom state handler

  const handleStartEditColor = (color: any) => {
    setEditingColor(color);
    setEditColorName(color.colorName);
    setEditColorCode(color.colorCode);
  };

  const handleSaveEditColor = async () => {
    if (!editingColor) return;
    const name = editColorName.trim();
    let code = editColorCode.trim();

    if (!name) {
      alert('Please specify a color name.');
      return;
    }
    if (!code) {
      alert('Please specify a HEX code.');
      return;
    }
    if (!code.startsWith('#')) {
      code = '#' + code;
    }
    if (!/^#[0-9A-F]{6}$/i.test(code)) {
      alert('Invalid HEX format. e.g. #000000');
      return;
    }

    try {
      setLoading(true);
      await updateColorDoc(editingColor.id, {
        colorName: name,
        colorCode: code,
        oldColorName: editingColor.colorName,
        oldColorCode: editingColor.colorCode
      });

      // Synchronize currently editing product selection list as well
      setFormData(prev => ({
        ...prev,
        colorsInput: prev.colorsInput.map(c => {
          if (c && typeof c === 'object' && (c.id === editingColor.id || (c.colorName === editingColor.colorName && c.colorCode === editingColor.colorCode))) {
            return { id: editingColor.id, colorName: name, colorCode: code };
          }
          return c;
        })
      }));

      const freshPool = await getColors();
      setGlobalColors(freshPool || []);
      setEditingColor(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !products.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAdding || isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-medium text-brand-text mb-6">
          {isEditing ? 'Edit Product Details' : 'Add New Product'}
        </h2>
        <form onSubmit={handleSave} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">Product Name / Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" placeholder="e.g. Linen Blend Shirt" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Price */}
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-semibold">Price / السعر الحالي (دج)</label>
              <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" placeholder="0.00" />
            </div>
            {/* Old Price */}
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-semibold">Old Price / السعر قبل الخصم (دج)</label>
              <input type="number" step="0.01" value={formData.oldPrice} onChange={e => setFormData({...formData, oldPrice: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" placeholder="Optional (اختياري)" />
            </div>
            {/* Stock */}
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-semibold">Stock / كمية المخزون</label>
              <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors animate-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">Category</label>
              {categoriesList.length === 0 ? (
                <div className="text-[12px] text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-3 font-normal leading-tight">
                  No Categories. Create some under <strong className="font-semibold text-brand-text">Categories</strong> first.
                </div>
              ) : (
                <select
                  required
                  value={formData.categoryId}
                  onChange={e => {
                    const selId = e.target.value;
                    const selCat = categoriesList.find(c => c.id === selId);
                    setFormData({
                      ...formData,
                      categoryId: selId,
                      category: selCat ? selCat.name : ''
                    });
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors"
                >
                  <option value="">-- Choose Category --</option>
                  {categoriesList.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* Aspect background */}
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">App Display Card theme</label>
              <select value={formData.bgColor} onChange={e => setFormData({...formData, bgColor: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors">
                <option value="beige">Beige (light sandy tone)</option>
                <option value="gray">Gray (minimal stone tone)</option>
              </select>
            </div>
          </div>

          {/* Main & Multi-Image Gallery via Firebase Storage */}
          <ProductImageUpload
            mainImage={formData.image}
            setMainImage={(url) => setFormData(p => ({ ...p, image: url }))}
            images={formData.imagesInput}
            setImages={(urls) => setFormData(p => ({ ...p, imagesInput: urls }))}
          />

          {/* Product Detail Images (Descriptive / Long illustrative images below the form) */}
          <ProductDetailImagesUpload
            detailImages={formData.detailImagesInput}
            setDetailImages={(urls) => setFormData(p => ({ ...p, detailImagesInput: urls }))}
          />

          {/* Sizes Management */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50">
            <label className="block text-[13px] text-neutral-500 mb-2 font-semibold">Manage Sizes</label>
            <div className="flex gap-2">
              <input type="text" value={newSize} onChange={e => setNewSize(e.target.value)} className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-brand-text transition-colors" placeholder="e.g. XS, S, M, L, XL, XXL, 32, 34" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); appendSize(); } }} />
              <button type="button" onClick={appendSize} className="bg-white hover:bg-neutral-100 text-brand-text px-4 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium transition-colors shrink-0">
                Add Size
              </button>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mt-3">
              {formData.sizesInput.length === 0 ? (
                <span className="text-[12px] text-neutral-400 italic">No custom sizes enabled (fallback standard size)</span>
              ) : (
                formData.sizesInput.map((sz) => (
                  <span key={sz} className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 text-[13px] px-3 py-1 rounded-full font-medium text-brand-text">
                    {sz}
                    <button type="button" onClick={() => removeSize(sz)} className="text-red-400 hover:text-red-500 rounded-full">
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Colors Management (Durable Reusable Color Code Pool) */}
          <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200/50 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[13px] font-semibold text-neutral-700">Manage Colors / نظام إدارة الألوان</label>
                <span className="text-[11px] text-neutral-400">Professional hex system</span>
              </div>
              
              {/* Creator Inline Box */}
              <div className="bg-white p-3.5 rounded-xl border border-neutral-200/60 space-y-3 mt-1.5">
                <span className="text-[11px] font-bold text-brand-text block">➕ Create New Reusable Color / إضافة لون جديد للمتجر</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Color Name / اسم اللون</label>
                    <input 
                      type="text" 
                      value={newColorName} 
                      onChange={e => setNewColorName(e.target.value)} 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-brand-text transition-colors" 
                      placeholder="e.g. Sage, Soft Linen, Oatmeal" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Color Code (HEX) / كود اللون</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          value={newColorCode} 
                          onChange={e => setNewColorCode(e.target.value)} 
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-[12px] outline-none focus:border-brand-text transition-colors font-mono" 
                          placeholder="#000000" 
                        />
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-neutral-300" style={{ backgroundColor: newColorCode }} />
                      </div>
                      <input 
                        type="color" 
                        value={newColorCode.startsWith('#') && newColorCode.length === 7 ? newColorCode : '#000000'} 
                        onChange={e => setNewColorCode(e.target.value)} 
                        className="w-10 h-8 rounded cursor-pointer border border-neutral-200 p-0" 
                      />
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddNewColorToPool} 
                  className="w-full bg-black text-white hover:bg-neutral-800 py-2 rounded-xl text-[12px] font-medium transition-colors"
                >
                  + Add Color / إضافة اللون للخيارات
                </button>
              </div>
            </div>

            {/* Checkbox Selector lists for the current product */}
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-neutral-600 block">Select Colors for this Product: / اختر ألوان هذا المنتج:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1.5 border border-neutral-200 bg-white rounded-xl">
                {globalColors.map((color) => {
                  const isSelected = formData.colorsInput.some(c => 
                    c && typeof c === 'object' && 
                    c.colorName?.trim().toLowerCase() === color.colorName?.trim().toLowerCase()
                  );
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => handleToggleProductColor(color)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-medium transition-all text-left ${
                        isSelected 
                          ? 'border-black bg-neutral-50 font-semibold text-black' 
                          : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" style={{ backgroundColor: color.colorCode }} />
                      <span className="truncate flex-1">{color.colorName}</span>
                      {isSelected && <Check size={11} className="text-black shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
                {globalColors.length === 0 && (
                  <p className="col-span-full text-center text-neutral-400 text-[11px] py-4">No colors in global directory. Add one above!</p>
                )}
              </div>
            </div>

            {/* Color-Image Linking Section */}
            {formData.colorsInput.length > 0 && (
              <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/60 mt-3 space-y-3 shadow-xs">
                <div>
                  <span className="text-[12.5px] font-bold text-neutral-800 flex items-center gap-1.5">
                    🔗 ربط الألوان بالصور / Color-Image Linking
                  </span>
                  <p className="text-[11px] text-neutral-450 mt-1 leading-relaxed">
                    حدد الصورة المعروضة المناسبة لكل خيار لون مفعل لهذا المنتج لتبديلها تلقائياً عند الضغط عليه.
                  </p>
                </div>

                <div className="space-y-2">
                  {formData.colorsInput.map((colorItem, idx) => {
                    // Combine main thumbnail and product images for selection
                    const availableImages = [formData.image, ...formData.imagesInput].filter((url): url is string => !!url);
                    
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 bg-neutral-50/70 hover:bg-neutral-50 rounded-xl border border-neutral-200/50 transition-colors">
                        {/* Color Name Info */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-4 h-4 rounded-full border border-neutral-350 shadow-xs" style={{ backgroundColor: colorItem.colorCode }} />
                          <span className="text-[12px] font-semibold text-neutral-700">{colorItem.colorName}</span>
                        </div>

                        {/* Image Select */}
                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          <select
                            value={colorItem.imageUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updatedColors = [...formData.colorsInput];
                              updatedColors[idx] = { ...updatedColors[idx], imageUrl: val };
                              setFormData(prev => ({ ...prev, colorsInput: updatedColors }));
                            }}
                            className="bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-[11px] outline-none text-neutral-700 focus:border-brand-text max-w-xs font-sans shadow-2xs"
                          >
                            <option value="">-- بدون صورة / Unlinked --</option>
                            {availableImages.map((imgUrl, imageIdx) => (
                              <option key={imageIdx} value={imgUrl}>
                                {imageIdx === 0 ? 'صورة الغلاف / Thumbnail' : `الصورة الإضافية ${imageIdx}`}
                              </option>
                            ))}
                          </select>

                          {/* Preview Thumbnail */}
                          {colorItem.imageUrl ? (
                            <div className="w-8 h-8 rounded-md border border-neutral-200 bg-white overflow-hidden shrink-0 shadow-3xs">
                              <img
                                src={colorItem.imageUrl}
                                alt="Color selector preview"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-md border border-neutral-150 bg-neutral-100 flex items-center justify-center shrink-0">
                              <span className="text-[8px] text-neutral-400 font-mono">N/A</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Editing Global Color Inline Card */}
            {editingColor && (
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-2.5">
                <span className="text-[11px] font-bold text-blue-900 block">✏️ Edit Global Color / تعديل اللون: {editingColor.colorName}</span>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    value={editColorName} 
                    onChange={e => setEditColorName(e.target.value)} 
                    className="bg-white border border-neutral-200 rounded-lg p-1.5 text-[11px] outline-none" 
                    placeholder="Color Name" 
                  />
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      value={editColorCode} 
                      onChange={e => setEditColorCode(e.target.value)} 
                      className="bg-white border border-neutral-200 rounded-lg p-1.5 text-[11px] outline-none font-mono flex-1" 
                      placeholder="#HEX" 
                    />
                    <input 
                      type="color" 
                      value={editColorCode.startsWith('#') && editColorCode.length === 7 ? editColorCode : '#000000'} 
                      onChange={e => setEditColorCode(e.target.value)} 
                      className="w-8 h-7 px-0 cursor-pointer border border-neutral-200" 
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setEditingColor(null)} className="px-2.5 py-1 rounded bg-neutral-200 text-neutral-700 text-[10px] font-medium">Cancel</button>
                  <button type="button" onClick={handleSaveEditColor} className="px-3 py-1 rounded bg-blue-600 text-white text-[10px] font-medium">Save Changes</button>
                </div>
              </div>
            )}

            {/* List and manage global colors pool */}
            {globalColors.length > 0 && (
              <div className="border-t border-neutral-200/50 pt-3">
                <span className="text-[10px] font-semibold text-neutral-400 block mb-1.5 uppercase">Store Colors Library Management (Click Edit or X to Delete)</span>
                <div className="flex flex-wrap gap-1.5">
                  {globalColors.map((color) => (
                    <div key={color.id} className="group relative flex items-center gap-1.5 bg-white border border-neutral-200 rounded-lg py-1 pl-2 pr-11 text-[11px] hover:border-neutral-400 transition-colors">
                      <span className="w-3 h-3 rounded-full border border-neutral-300 shrink-0" style={{ backgroundColor: color.colorCode }} />
                      <span className="font-medium text-neutral-700">{color.colorName}</span>
                      <span className="text-[9px] text-neutral-400 font-mono">{color.colorCode}</span>
                      
                      {/* Edit click */}
                      <button 
                        type="button" 
                        onClick={() => handleStartEditColor(color)} 
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-blue-500 transition-colors p-0.5"
                        title="Edit local values"
                      >
                        <Edit3 size={11} />
                      </button>

                      {/* Delete click */}
                      <button 
                        type="button" 
                        onClick={() => handleDeleteColorClick(color)} 
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-red-500 transition-colors p-0.5"
                        title="Delete color from store library"
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Flash Bundle Offer Section */}
          <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200/50 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200/50">
              <div>
                <span className="text-[13px] font-bold text-neutral-800 flex items-center gap-1.5">
                  ⚡ عرض الحزم السريعة / Flash Bundle Offer
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  تفعيل الخصومات وعروض الكمية المؤقتة للمنتج
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.flashBundleEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, flashBundleEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="mr-2 text-[12px] font-medium text-neutral-500 mr-2">
                  {formData.flashBundleEnabled ? 'مفعل / ON' : 'معطل / OFF'}
                </span>
              </label>
            </div>

            {formData.flashBundleEnabled && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Dates Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] text-neutral-500 font-semibold mb-1">تاريخ ووقت بدء العرض / Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.flashBundleStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, flashBundleStartDate: e.target.value }))}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-[12px] outline-none focus:border-brand-text transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-500 font-semibold mb-1">تاريخ ووقت انتهاء العرض / End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.flashBundleEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, flashBundleEndDate: e.target.value }))}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-[12px] outline-none focus:border-brand-text transition-colors"
                    />
                  </div>
                </div>

                {/* Tiers Configuration */}
                <div className="border-t border-neutral-200/50 pt-3 space-y-3">
                  <span className="text-[12px] font-bold text-neutral-700 block">🪜 مستويات عروض الكمية / Quantity Bundle Tiers</span>
                  
                  {/* Add Tier Inline Form */}
                  <div className="bg-white p-3.5 rounded-xl border border-neutral-200/60 flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] text-neutral-400 mb-1">الكمية المطلوبة / Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={newTierQty}
                        onChange={(e) => setNewTierQty(e.target.value)}
                        placeholder="مثال: 2"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-brand-text transition-colors"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] text-neutral-400 mb-1">سعر الحزمة بالكامل / Bundle Price (DA)</label>
                      <input
                        type="number"
                        min="1"
                        value={newTierPrice}
                        onChange={(e) => setNewTierPrice(e.target.value)}
                        placeholder="مثال: 6500"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-brand-text transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={appendTier}
                      className="bg-brand-text hover:bg-neutral-800 text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0 w-full sm:w-auto"
                    >
                      إضافة مستوى / Add Tier
                    </button>
                  </div>

                  {/* Tiers Preview */}
                  {formData.flashBundleTiers.length > 0 ? (
                    <div className="space-y-2">
                      {(() => {
                        const basePrice = parseFloat(formData.price) || 0;
                        let bestIdx = -1;
                        let maxSaving = 0;
                        
                        formData.flashBundleTiers.forEach((tier, i) => {
                          const originalTotal = basePrice * tier.quantity;
                          const savedAmount = originalTotal - tier.bundlePrice;
                          if (savedAmount > maxSaving) {
                            maxSaving = savedAmount;
                            bestIdx = i;
                          }
                        });

                        return formData.flashBundleTiers.map((tier, idx) => {
                          const originalTotal = basePrice * tier.quantity;
                          const savedAmount = originalTotal - tier.bundlePrice;
                          const savedPercent = originalTotal > 0 ? Math.round((savedAmount / originalTotal) * 100) : 0;
                          const isBest = idx === bestIdx;

                          return (
                            <div key={idx} className="flex items-center justify-between bg-white rounded-xl border border-neutral-200/60 p-3 hover:bg-neutral-50/50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <span className="text-[12.5px] font-bold text-neutral-800 font-sans">
                                  📦 شراء {tier.quantity} ({tier.quantity} x {basePrice} DA)
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[12px] font-bold text-green-600 font-sans">
                                    سعر الحزمة: {tier.bundlePrice} DA
                                  </span>
                                  {savedAmount > 0 ? (
                                    <>
                                      <span className="text-[10px] text-neutral-400 line-through">
                                        {originalTotal} DA
                                      </span>
                                      <span className="text-[10.5px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                        وفرت {savedAmount} DA ({savedPercent}%)
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-[10.5px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold font-sans">
                                      لا توجود توفّير
                                    </span>
                                  )}
                                  {isBest && savedAmount > 0 && (
                                    <span className="text-[10.5px] bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded-full font-bold">
                                      🏆 أفضل قيمة / Best Value
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeTier(idx)}
                                className="p-1.5 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg text-neutral-400 hover:text-red-600 transition-all font-sans text-[11px]"
                                title="حذف العرض"
                              >
                                Delete
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="text-center p-5 bg-white rounded-xl border border-dashed border-neutral-200 text-neutral-400">
                      <span className="text-[11.5px]">لا توجد مستويات عروض كمية مضافة حالياً. يرجى ملء الحقول أعلاه لإضافة أول عرض.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors min-h-[100px] resize-y" placeholder="Full summary details of the linen garment..." />
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200/60 rounded-xl text-red-600 font-semibold text-[13px] flex items-center gap-2" dir="rtl">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 bg-brand-text text-white py-3.5 rounded-full font-medium text-[14px] hover:bg-neutral-800 transition-colors disabled:opacity-70">
              {loading ? 'Saving...' : 'Save Product'}
            </button>
            <button type="button" onClick={cancelEditAdd} className="px-6 bg-neutral-100 text-brand-text py-3.5 rounded-full font-medium text-[14px] hover:bg-neutral-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>

        {/* Custom Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-[17px] font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
                ⚠️ {confirmDelete.title}
              </h3>
              <p className="text-neutral-600 text-[14px] leading-relaxed">
                {confirmDelete.message}
              </p>
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 text-[13px] font-semibold hover:bg-neutral-50 transition-colors"
                  disabled={loading}
                >
                  إلغاء / Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-full bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  disabled={loading}
                >
                  {loading ? 'جاري الحذف...' : 'نعم، تأكيد الحذف / Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-brand-text">Products Management</h2>
        <button onClick={startAdd} className="bg-brand-text text-white px-5 py-2.5 rounded-full font-medium text-[14px] flex items-center gap-2 hover:bg-neutral-800 transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 px-4 py-3 border-b border-neutral-100 text-[13px] uppercase tracking-wider text-neutral-500">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Options</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 ${product.image ? 'bg-neutral-100' : (product.bgColor === 'gray' ? 'bg-brand-card-gray' : 'bg-brand-card-beige')}`}>
                          {product.image && <img src={product.image} className="w-full h-full object-cover" alt={product.title} referrerPolicy="no-referrer" />}
                        </div>
                        <div>
                          <div className="text-[14px] font-medium text-brand-text">{product.title || product.name}</div>
                          <div className="text-[12px] text-neutral-500 line-clamp-1 max-w-xs">{product.category || 'No category'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-brand-text" dir="ltr">
                          {(product.price || 0).toFixed(0)} دج
                        </span>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-normal text-neutral-400 line-through/80" dir="ltr">
                              {product.oldPrice.toFixed(0)} دج
                            </span>
                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1 py-0.2 rounded">
                              -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px]">
                      {product.stock !== undefined ? (
                        <span className={`font-mono ${product.stock <= 0 ? 'text-red-500 font-bold' : 'text-neutral-600'}`}>
                          {product.stock} pcs
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">Unspecified</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[11px] text-neutral-500">
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="truncate max-w-[120px]">
                            <span className="font-semibold text-neutral-600">Sz:</span> {product.sizes.join(', ')}
                          </div>
                        )}
                        {normalizeProductColors(product.colors).length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap max-w-[150px] mt-0.5">
                            {normalizeProductColors(product.colors).map((c: any, index: number) => {
                              const name = c.colorName;
                              const code = c.colorCode;
                              return (
                                <span key={index} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neutral-100 text-[9px] font-medium text-neutral-600" title={name}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: code }} />
                                  {name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => startEdit(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors mr-1">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(product.id, product.title || product.name || 'Unnamed')} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-[17px] font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
              ⚠️ {confirmDelete.title}
            </h3>
            <p className="text-neutral-600 text-[14px] leading-relaxed">
              {confirmDelete.message}
            </p>
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 text-[13px] font-semibold hover:bg-neutral-50 transition-colors"
                disabled={loading}
              >
                إلغاء / Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-full bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm"
                disabled={loading}
              >
                {loading ? 'جاري الحذف...' : 'نعم، تأكيد الحذف / Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
