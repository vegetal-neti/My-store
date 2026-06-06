import React, { useEffect, useState } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories } from '../../firebase';
import { Edit2, Trash2, Plus, X, Image as ImageIcon } from 'lucide-react';

export const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    image: '',
    description: '',
    bgColor: 'beige',
    rating: '5',
    reviews: '0',
    category: '',
    categoryId: '',
    stock: '10',
    imagesInput: [] as string[],
    sizesInput: [] as string[],
    colorsInput: [] as string[]
  });

  // Local state for adding individual elements to lists
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const productData = {
      title: formData.title,
      name: formData.title, // keep name and title synchronized
      price: parseFloat(formData.price) || 0,
      image: formData.image || (formData.imagesInput.length > 0 ? formData.imagesInput[0] : ''),
      description: formData.description,
      bgColor: formData.bgColor,
      rating: parseFloat(formData.rating) || 5,
      reviews: parseInt(formData.reviews) || 0,
      category: formData.category,
      categoryId: formData.categoryId || '',
      stock: parseInt(formData.stock) || 0,
      images: formData.imagesInput,
      sizes: formData.sizesInput,
      colors: formData.colorsInput
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
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setLoading(true);
      try {
        await deleteProduct(id);
        await fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        setLoading(false);
      }
    }
  };

  const startEdit = (product: any) => {
    setIsEditing(product);
    setFormData({
      title: product.title || product.name || '',
      price: product.price?.toString() || '0',
      image: product.image || '',
      description: product.description || '',
      bgColor: product.bgColor || 'beige',
      rating: product.rating?.toString() || '5',
      reviews: product.reviews?.toString() || '0',
      category: product.category || '',
      categoryId: product.categoryId || '',
      stock: product.stock?.toString() || '10',
      imagesInput: product.images || [],
      sizesInput: product.sizes || [],
      colorsInput: product.colors || []
    });
    setIsAdding(false);
    setNewImageUrl('');
    setNewSize('');
    setNewColor('');
  };

  const startAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({
      title: '',
      price: '',
      image: '',
      description: '',
      bgColor: 'beige',
      rating: '5',
      reviews: '0',
      category: '',
      categoryId: '',
      stock: '10',
      imagesInput: [],
      sizesInput: ['XS', 'S', 'M', 'L', 'XL'], // Default sizes
      colorsInput: ['Oatmeal', 'Sage', 'Charcoal', 'Ivory'] // Default colors
    });
    setNewImageUrl('');
    setNewSize('');
    setNewColor('');
  };

  const cancelEditAdd = () => {
    setIsAdding(false);
    setIsEditing(null);
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

  const appendColor = () => {
    const formattedColor = newColor.trim();
    if (formattedColor && !formData.colorsInput.includes(formattedColor)) {
      setFormData(prev => ({
        ...prev,
        colorsInput: [...prev.colorsInput, formattedColor]
      }));
      setNewColor('');
    }
  };

  const removeColor = (colorToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      colorsInput: prev.colorsInput.filter(c => c !== colorToRemove)
    }));
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

          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">Price (دج)</label>
              <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" placeholder="0.00" />
            </div>
            {/* Stock */}
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">Stock Quantity</label>
              <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" />
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

          {/* Main Image URL */}
          <div>
            <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">Main Image URL</label>
            <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" placeholder="https://unsplash.com/... or search URL" />
          </div>

          {/* Extra Images Management (Multi-gallery) */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50">
            <label className="block text-[13px] text-neutral-500 mb-2 font-semibold">Image Gallery (Supports multiple images)</label>
            <div className="flex gap-2">
              <input type="url" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-brand-text transition-colors" placeholder="Add extra high-quality image URL" />
              <button type="button" onClick={appendImage} className="bg-white hover:bg-neutral-100 text-brand-text px-4 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium transition-colors shrink-0">
                Add URL
              </button>
            </div>
            
            {formData.imagesInput.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3 max-h-[160px] overflow-y-auto pr-1">
                {formData.imagesInput.map((url, i) => (
                  <div key={i} className="flex items-center justify-between bg-white text-[12px] py-1.5 px-3 border border-neutral-200 rounded-lg text-neutral-600">
                    <span className="truncate max-w-[150px] font-mono select-all">{url}</span>
                    <button type="button" onClick={() => removeImage(i)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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

          {/* Colors Management */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50">
            <label className="block text-[13px] text-neutral-500 mb-2 font-semibold">Manage Colors</label>
            <div className="flex gap-2">
              <input type="text" value={newColor} onChange={e => setNewColor(e.target.value)} className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-brand-text transition-colors" placeholder="e.g. Oatmeal, Sage, Soft Linen, Navy" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); appendColor(); } }} />
              <button type="button" onClick={appendColor} className="bg-white hover:bg-neutral-100 text-brand-text px-4 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium transition-colors shrink-0">
                Add Color
              </button>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mt-3">
              {formData.colorsInput.length === 0 ? (
                <span className="text-[12px] text-neutral-400 italic">No custom colors enabled (fallback default color)</span>
              ) : (
                formData.colorsInput.map((col) => (
                  <span key={col} className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 text-[13px] px-3 py-1 rounded-full font-medium text-brand-text">
                    {col}
                    <button type="button" onClick={() => removeColor(col)} className="text-red-400 hover:text-red-500 rounded-full">
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors min-h-[100px] resize-y" placeholder="Full summary details of the linen garment..." />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 bg-brand-text text-white py-3.5 rounded-full font-medium text-[14px] hover:bg-neutral-800 transition-colors disabled:opacity-70">
              {loading ? 'Saving...' : 'Save Product'}
            </button>
            <button type="button" onClick={cancelEditAdd} className="px-6 bg-neutral-100 text-brand-text py-3.5 rounded-full font-medium text-[14px] hover:bg-neutral-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
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
                    <td className="px-6 py-4 text-[14px] font-medium text-brand-text">
                      <span className="inline-flex gap-1" dir="ltr">
                        <span>دج</span>
                        <span>{(product.price || 0).toFixed(2)}</span>
                      </span>
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
                        {product.colors && product.colors.length > 0 && (
                          <div className="truncate max-w-[120px]">
                            <span className="font-semibold text-neutral-600">Col:</span> {product.colors.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => startEdit(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors mr-1">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
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
    </div>
  );
};
