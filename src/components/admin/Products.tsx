import React, { useEffect, useState } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../firebase';
import { Edit2, Trash2, Plus } from 'lucide-react';

export const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    image: '',
    description: '',
    bgColor: 'beige',
    rating: '5',
    reviews: '0'
  });

  useEffect(() => {
    fetchProducts();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      rating: parseFloat(formData.rating),
      reviews: parseInt(formData.reviews)
    };

    setLoading(true);
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
      reviews: product.reviews?.toString() || '0'
    });
    setIsAdding(false);
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
      reviews: '0'
    });
  };

  const cancelEditAdd = () => {
    setIsAdding(false);
    setIsEditing(null);
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
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 max-w-2xl">
        <h2 className="text-xl font-medium text-brand-text mb-6">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[13px] text-neutral-500 mb-1 ml-1">Product Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1 ml-1">Price ($)</label>
              <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" />
            </div>
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1 ml-1">Background Theme</label>
              <select value={formData.bgColor} onChange={e => setFormData({...formData, bgColor: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors">
                <option value="beige">Beige</option>
                <option value="gray">Gray</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[13px] text-neutral-500 mb-1 ml-1">Image URL</label>
            <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-[13px] text-neutral-500 mb-1 ml-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors min-h-[100px] resize-y" />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 bg-brand-text text-white py-3 rounded-full font-medium text-[14px] hover:bg-neutral-800 transition-colors disabled:opacity-70">
              {loading ? 'Saving...' : 'Save Product'}
            </button>
            <button type="button" onClick={cancelEditAdd} className="px-6 bg-neutral-100 text-brand-text py-3 rounded-full font-medium text-[14px] hover:bg-neutral-200 transition-colors">
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
                <th className="px-6 py-4 font-medium">Stats</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 ${product.image ? 'bg-neutral-100' : (product.bgColor === 'gray' ? 'bg-brand-card-gray' : 'bg-brand-card-beige')}`}>
                          {product.image && <img src={product.image} className="w-full h-full object-cover" alt={product.title} />}
                        </div>
                        <div>
                          <div className="text-[14px] font-medium text-brand-text">{product.title || product.name}</div>
                          <div className="text-[12px] text-neutral-500 line-clamp-1 max-w-xs">{product.description || 'No description'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-brand-text">
                      ${(product.price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-neutral-500">
                      ★ {product.rating} ({product.reviews})
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
