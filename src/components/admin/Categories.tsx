import React, { useEffect, useState } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../firebase';
import { Edit2, Trash2, Plus, X, ListOrdered } from 'lucide-react';

export const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    displayOrder: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);

    const categoryData = {
      name: formData.name.trim(),
      displayOrder: parseInt(formData.displayOrder, 10) || 0
    };

    try {
      if (isEditing) {
        await updateCategory(isEditing.id, categoryData);
      } else {
        await addCategory(categoryData);
      }
      await fetchCategories();
      setIsAdding(false);
      setIsEditing(null);
      setFormData({ name: '', displayOrder: '' });
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? Products linked to this category won't be deleted, but may lose link.")) {
      setLoading(true);
      try {
        await deleteCategory(id);
        await fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        setLoading(false);
      }
    }
  };

  const startEdit = (cat: any) => {
    setIsEditing(cat);
    setFormData({
      name: cat.name || '',
      displayOrder: cat.displayOrder?.toString() || '0'
    });
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({
      name: '',
      displayOrder: (categories.length > 0 ? Math.max(...categories.map(c => c.displayOrder || 0)) + 10 : 10).toString()
    });
  };

  const cancelEditAdd = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData({ name: '', displayOrder: '' });
  };

  if (loading && !categories.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAdding || isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 max-w-md mx-auto">
        <h2 className="text-xl font-medium text-brand-text mb-6">
          {isEditing ? 'Edit Category' : 'Add New Category'}
        </h2>
        <form onSubmit={handleSave} className="space-y-5">
          {/* Category Name */}
          <div>
            <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">Category Name</label>
            <input 
              required 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" 
              placeholder="e.g. Linen Dresses" 
            />
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-[13px] text-neutral-500 mb-1 ml-1 font-medium">Display Order</label>
            <input 
              required 
              type="number" 
              value={formData.displayOrder} 
              onChange={e => setFormData({...formData, displayOrder: e.target.value})} 
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-brand-text transition-colors" 
              placeholder="e.g. 10" 
            />
            <p className="text-[11px] text-neutral-400 mt-1 ml-1">Lower numbers appear first in the customer list.</p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-brand-text text-white py-3.5 rounded-full font-medium text-[14px] hover:bg-neutral-800 transition-colors disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Category'}
            </button>
            <button 
              type="button" 
              onClick={cancelEditAdd} 
              className="px-6 bg-neutral-100 text-brand-text py-3.5 rounded-full font-medium text-[14px] hover:bg-neutral-200 transition-colors"
            >
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
        <h2 className="text-xl font-medium text-brand-text">Categories Management</h2>
        <button 
          onClick={startAdd} 
          className="bg-brand-text text-white px-5 py-2.5 rounded-full font-medium text-[14px] flex items-center gap-2 hover:bg-neutral-800 transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 px-4 py-3 border-b border-neutral-100 text-[13px] uppercase tracking-wider text-neutral-500">
                <th className="px-6 py-4 font-medium">Category Name</th>
                <th className="px-6 py-4 font-medium">Display Order</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-neutral-500">
                    No categories found. Use "Add Category" to create one.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-medium text-brand-text">{cat.name}</div>
                    </td>
                    <td className="px-6 py-4 text-[13px]">
                      <span className="font-mono bg-neutral-100 px-2.5 py-1 rounded-full text-neutral-700">
                        {cat.displayOrder ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => startEdit(cat)} 
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors mr-1"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
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
