import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { getProducts } from '../firebase';
import { Product } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectProduct }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debouce query input
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('');
      setFilteredResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350); // 350ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Load products dynamically on mount / search
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const data = await getProducts();
        if (data) {
          setProducts(data as Product[]);
        }
      } catch (err) {
        console.error('Failed to pre-fetch search products:', err);
      }
    };
    if (isOpen) {
      fetchAllProducts();
      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Search logic on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilteredResults([]);
      setLoading(false);
      return;
    }

    const searchQuery = debouncedQuery.toLowerCase().trim();
    
    // Fuzzy/Partial match of name/title and category
    const matches = products.filter((p) => {
      const titleMatch = (p.title || p.name || '').toLowerCase().includes(searchQuery);
      const categoryMatch = (p.category || '').toLowerCase().includes(searchQuery);
      const descMatch = (p.description || '').toLowerCase().includes(searchQuery);
      return titleMatch || categoryMatch || descMatch;
    });

    setFilteredResults(matches);
    setLoading(false);
  }, [debouncedQuery, products]);

  // Escape key support to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute inset-0 z-50 bg-brand-bg flex flex-col"
    >
      {/* Search Header Bar */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100 bg-brand-bg/95 backdrop-blur-md sticky top-0">
        <h3 className="font-serif italic text-xl tracking-tight text-brand-text">Search</h3>
        <button
          onClick={onClose}
          className="p-1 px-1.5 rounded-full hover:bg-neutral-100 text-brand-text transition-colors flex items-center gap-1"
          aria-label="Close search"
        >
          <span className="text-[11px] tracking-wider uppercase font-semibold text-neutral-400">Close</span>
          <X strokeWidth={1.5} size={18} />
        </button>
      </div>

      {/* Input Field Container */}
      <div className="px-5 py-4">
        <div className="relative flex items-center">
          <span className="absolute left-4 text-neutral-400">
            <Search strokeWidth={1.5} size={18} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for clothes, linens, shirts..."
            className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl pl-11 pr-11 py-3.5 text-[14px] text-brand-text font-serif leading-none outline-none focus:bg-white focus:ring-1 focus:ring-brand-text/20 focus:border-brand-text/50 transition-all placeholder:text-neutral-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 p-1 text-neutral-400 hover:text-brand-text rounded-full hover:bg-neutral-200/50 transition-colors"
              aria-label="Clear term"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Results Container / Dynamic states */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400 stroke-[1.5]" />
            <p className="text-[12px] text-neutral-500 font-medium mt-3">Searching collection...</p>
          </div>
        ) : query.trim() && filteredResults.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="font-serif italic text-lg text-brand-text mb-1">No results found</p>
            <p className="text-[12px] text-neutral-500 max-w-[260px] mx-auto">
              We couldn't find items matching "{query}". Try checking your spelling.
            </p>
          </div>
        ) : !query.trim() ? (
          <div className="py-8">
            <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-4 px-1">
              Suggestions & Collections
            </h4>
            <div className="space-y-2">
              {['Shirt', 'Linen', 'Oatmeal', 'Sage'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="w-full flex items-center justify-between text-left px-4 py-3 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 text-[13px] font-medium text-neutral-600 border border-neutral-100 hover:border-neutral-200/60 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Search size={14} className="text-neutral-400" />
                    {suggestion}
                  </span>
                  <ArrowRight size={14} className="text-neutral-300" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3 px-1 flex justify-between">
              <span>Search Results</span>
              <span>{filteredResults.length} Found</span>
            </h4>
            {filteredResults.map((product) => {
              const bgClass =
                product.bgColor === 'gray'
                  ? 'bg-brand-card-gray'
                  : product.bgColor === 'beige'
                  ? 'bg-brand-card-beige'
                  : 'bg-neutral-100';

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product.id)}
                  className="flex items-center gap-4 p-2.5 rounded-2xl bg-white border border-neutral-100 hover:border-neutral-200/85 hover:shadow-sm transition-all cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div
                    className={`w-14 h-16 rounded-xl overflow-hidden shrink-0 relative ${
                      product.image ? 'bg-neutral-50' : bgClass
                    }`}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title || product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Meta data */}
                  <div className="flex-1 min-w-0">
                    {product.category && (
                      <span className="text-[9px] tracking-[0.1em] font-semibold text-neutral-400 uppercase leading-none block mb-0.5">
                        {product.category}
                      </span>
                    )}
                    <h5 className="font-serif text-[15px] font-medium text-brand-text truncate leading-snug">
                      {product.title || product.name}
                    </h5>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-serif text-[14px] text-brand-text font-medium inline-flex gap-1" dir="ltr">
                        <span>دج</span>
                        <span>{(product.price || 0).toFixed(2)}</span>
                      </span>
                      {product.stock !== undefined && (
                        <span className={`text-[10px] font-mono ${product.stock <= 0 ? 'text-red-500 font-semibold' : 'text-neutral-400'}`}>
                          {product.stock <= 0 ? 'Out of stock' : `${product.stock} in stock`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
