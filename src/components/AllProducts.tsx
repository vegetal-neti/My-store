import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProducts, getCategories } from '../firebase';
import { Product } from '../types';
import { ProductCard } from '../App';

interface AllProductsProps {
  onBack: () => void;
  onProductSelect: (id: string) => void;
  initialCategoryId?: string;
}

export const AllProducts: React.FC<AllProductsProps> = ({ 
  onBack, 
  onProductSelect, 
  initialCategoryId = 'all' 
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedProducts, fetchedCats] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        
        if (fetchedProducts) {
          setProducts(fetchedProducts as Product[]);
        }
        if (fetchedCats) {
          setCategories(fetchedCats);
        }
      } catch (err: any) {
        console.error("Error loading products catalogue:", err);
        setError("Error connecting to database. Please check connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter products based on category and search query
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategoryId !== 'all') {
      result = result.filter(p => p.categoryId === selectedCategoryId);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const titleStr = (p.title || p.name || '').toLowerCase();
        const descStr = (p.description || '').toLowerCase();
        return titleStr.includes(query) || descStr.includes(query);
      });
    }

    return result;
  }, [products, selectedCategoryId, searchQuery]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, searchQuery]);

  // Paginated items calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      
      // Smooth scroll to top of product grid or viewport
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isArabic = (text?: string) => text ? /[\u0600-\u06FF]/.test(text) : false;

  return (
    <div className="flex-1 bg-brand-bg min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-brand-bg/95 backdrop-blur-md px-5 py-4 border-b border-neutral-100/60 flex items-center justify-between">
        <button 
          onClick={onBack} 
          className="text-brand-text hover:opacity-85 transition-opacity"
          aria-label="Back"
        >
          <ArrowLeft strokeWidth={1.5} size={22} />
        </button>
        <h1 className="font-serif italic text-xl tracking-wide text-brand-text">Our Collection</h1>
        <div className="w-5" /> {/* Spacer to align title centered */}
      </header>

      {/* Search Input */}
      <div className="px-5 pt-4 pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50/70 border border-neutral-200/80 rounded-2xl py-3 pl-11 pr-4 text-[14px] outline-none focus:border-brand-text transition-colors text-brand-text placeholder-neutral-400"
          />
          <Search size={18} strokeWidth={1.5} className="absolute left-4 top-3.5 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="px-5 py-3 overflow-x-auto no-scrollbar flex items-center gap-4 border-b border-neutral-100/60">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`shrink-0 text-[13px] px-3.5 py-1.5 rounded-full transition-all ${
            selectedCategoryId === 'all' 
              ? 'bg-brand-text text-white font-medium shadow-xs' 
              : 'bg-neutral-50 border border-neutral-200/50 text-neutral-500 hover:text-brand-text'
          }`}
        >
          All
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`shrink-0 text-[13px] px-3.5 py-1.5 rounded-full transition-all ${
                isSelected 
                  ? 'bg-brand-text text-white font-medium shadow-xs' 
                  : 'bg-neutral-50 border border-neutral-200/50 text-neutral-500 hover:text-brand-text'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Products Display Section */}
      <main className="flex-1 px-5 py-6 flex flex-col justify-between">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 mb-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col animate-pulse">
                <div className="relative aspect-[4/5] rounded-2xl bg-neutral-200 mb-3 w-full" />
                <div className="h-4 bg-neutral-200 rounded-md w-3/4 mb-2.5" />
                <div className="h-3 bg-neutral-200 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center px-4 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-[14px]" dir="rtl">
            ⚠️ {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 text-[14px] flex-1 flex flex-col items-center justify-center">
            <p>No products match your criteria.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            {/* Products grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 mb-10">
              {paginatedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  {...product} 
                  onSelect={() => onProductSelect(product.id)} 
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center border-t border-neutral-100 pt-6 mt-auto">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-full border border-neutral-200 hover:border-brand-text disabled:hover:border-neutral-200 flex items-center justify-center text-brand-text disabled:opacity-40 transition-colors cursor-pointer"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={18} strokeWidth={1.5} />
                  </button>

                  <div className="text-[14px] font-sans text-neutral-600 select-none px-2 font-medium" dir="rtl">
                    <span>الصفحة </span>
                    <span className="font-bold text-brand-text">{currentPage}</span>
                    <span> من </span>
                    <span className="font-bold text-brand-text">{totalPages}</span>
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-full border border-neutral-200 hover:border-brand-text disabled:hover:border-neutral-200 flex items-center justify-center text-brand-text disabled:opacity-40 transition-colors cursor-pointer"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={18} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="text-[11px] text-neutral-400 mt-2">
                  Showing {Math.min(filteredProducts.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(filteredProducts.length, currentPage * ITEMS_PER_PAGE)} of {filteredProducts.length} items
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
