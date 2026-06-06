import React from 'react';
import { Menu, Search, ArrowRight, Plus, Facebook, Instagram, Twitter } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { AuthProvider } from './context/AuthContext';
import { Product } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductDetails } from './components/ProductDetails';
import { SearchModal } from './components/SearchModal';
import { ThankYou } from './components/ThankYou';

const Header = ({ onMenuClick, onSearchClick }: { onMenuClick: () => void; onSearchClick: () => void }) => {
  return (
    <header className="px-5 pt-3 pb-2 flex items-center justify-between">
      <button aria-label="Menu" className="text-brand-text" onClick={onMenuClick}>
        <Menu strokeWidth={1.5} size={20} />
      </button>
      <h1 className="font-serif italic text-2xl tracking-tight translate-x-2">Végétal</h1>
      <div className="flex items-center gap-4">
        <button aria-label="Search" className="text-brand-text" onClick={onSearchClick}>
          <Search strokeWidth={1.5} size={20} />
        </button>
      </div>
    </header>
  );
};

const Navigation = ({ 
  selectedCategoryId, 
  onSelectCategory 
}: { 
  selectedCategoryId: string; 
  onSelectCategory: (id: string) => void; 
}) => {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCats = async () => {
      try {
        const { getCategories } = await import('./firebase');
        const list = await getCategories();
        setCategories(list || []);
      } catch (err) {
        console.error("Error loading categories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  if (loading) {
    return (
      <nav className="px-5 pb-3 overflow-x-auto no-scrollbar flex items-center gap-5">
        <span className="text-[12px] text-neutral-400 font-medium">Loading...</span>
      </nav>
    );
  }

  return (
    <nav className="px-5 pb-3 overflow-x-auto no-scrollbar flex items-center gap-5">
      <button
        onClick={() => onSelectCategory('all')}
        className={`shrink-0 text-[14px] transition-colors ${
          selectedCategoryId === 'all' ? 'text-brand-text font-semibold' : 'text-neutral-500 hover:text-brand-text'
        }`}
      >
        All
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`shrink-0 text-[14px] transition-colors ${
              isSelected ? 'text-brand-text font-semibold' : 'text-neutral-500 hover:text-brand-text'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </nav>
  );
};

const Hero = () => (
  <section className="px-4 mb-10 mt-3">
    <div className="bg-brand-hero h-[480px] rounded-3xl p-7 flex flex-col justify-end relative overflow-hidden">
      <p className="text-[10px] tracking-[0.2em] font-medium text-white/95 mb-3 uppercase">
        Spring / Summer 26
      </p>
      <h2 className="font-serif italic text-[2.75rem] leading-[1.1] text-white mb-8">
        The Linen Collection
      </h2>
      <button className="bg-white/95 hover:bg-white transition-colors text-brand-text rounded-full py-3.5 px-6 flex items-center justify-between w-[220px]">
        <span className="text-sm font-medium">Shop New Season</span>
        <ArrowRight size={18} strokeWidth={1.5} />
      </button>
    </div>
  </section>
);

interface ProductCardProps extends Product {
  onSelect?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const { title, name, description, image, price, rating, reviews, badge, bgColor, onSelect } = props;
  const bgClass = bgColor === 'gray' ? 'bg-brand-card-gray' : (bgColor === 'beige' ? 'bg-brand-card-beige' : 'bg-neutral-100');
  
  const displayTitle = name || title || 'Unnamed Product';

  // Custom SVG to replicate the exact Star icon style from the image
  const StarIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );

  return (
    <div className="flex flex-col group cursor-pointer h-full" onClick={onSelect}>
      <div className={`relative aspect-[4/5] rounded-2xl ${image ? 'bg-neutral-100 overflow-hidden' : bgClass} mb-3 p-3 flex flex-col justify-between`}>
        {image && (
          <img src={image} alt={displayTitle} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
        )}
        <div className="relative z-10 w-full flex justify-between items-start">
          {badge ? (
            <div className="bg-white/90 backdrop-blur-sm px-3 pt-1.5 pb-1 rounded-full w-fit">
              <span className="text-[9px] font-semibold tracking-[0.05em] uppercase text-brand-text">{badge}</span>
            </div>
          ) : <div />}
        </div>
      </div>
      <div className="flex justify-between items-start gap-2 mb-1 px-1">
        <h3 className="text-[15px] font-medium leading-snug text-brand-text flex-1 line-clamp-2">{displayTitle}</h3>
        <span className="text-[15px] font-medium text-brand-text shrink-0 inline-flex gap-1" dir="ltr">
          <span>دج</span>
          <span>{(price || 0).toFixed(2)}</span>
        </span>
      </div>
      {description && (
        <p className="text-[13px] text-neutral-500 px-1 mb-1 line-clamp-1">{description}</p>
      )}
      {(rating !== undefined && reviews !== undefined) && (
        <div className="flex items-center gap-1.5 px-1 mt-auto pt-1">
          <div className="flex gap-[1px]">
            {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} />)}
          </div>
          <span className="text-xs text-neutral-500 mt-[1px]">{rating} ({reviews})</span>
        </div>
      )}
    </div>
  );
};

const BestSellers = ({ 
  selectedCategoryId, 
  onProductSelect 
}: { 
  selectedCategoryId: string; 
  onProductSelect: (id: string) => void; 
}) => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { getProducts } = await import('./firebase');
        const fetchedProducts = await getProducts();
        if (fetchedProducts && fetchedProducts.length > 0) {
          setProducts(fetchedProducts as Product[]);
        } else {
          // If empty, we can just show empty or use fallback if we strictly want no mock.
          // The prompt says "منع استخدام بيانات hardcoded داخل الواجهة.", so we will strictly use the fetched products.
          setProducts([]);
        }
      } catch (err: any) {
        console.error("Firebase connection error. Please configure Firebase credentials.", err);
        setError("Database connection error. Please set up Firebase environment variables.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = React.useMemo(() => {
    if (selectedCategoryId === 'all') {
      return products;
    }
    return products.filter(product => product.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  return (
    <section className="px-4 mb-16">
      <div className="mb-6 px-1">
        <p className="text-[10px] tracking-[0.15em] font-semibold text-neutral-500 uppercase mb-1">
          Loved by our community
        </p>
        <div className="flex justify-between items-end">
          <h2 className="font-serif italic text-4xl text-brand-text leading-tight">
            Best Sellers
          </h2>
          <a href="#" className="text-sm font-medium text-brand-text underline underline-offset-4 decoration-[1.5px] pb-1">
            View All
          </a>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-20 text-brand-text">
          <div className="w-6 h-6 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="py-10 text-center px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-neutral-500 text-[15px]">
          No products found. Please add products to Firestore.
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center text-neutral-500 text-[15px]">
          No products found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} {...product} onSelect={() => onProductSelect(product.id)} />
          ))}
        </div>
      )}
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-brand-footer text-white px-6 pt-12 pb-8 rounded-t-3xl sm:rounded-none mt-auto">
      <div className="max-w-md mx-auto">
        <h2 className="font-serif italic text-3xl mb-3">Végétal</h2>
        <p className="text-neutral-400 text-[14px] sm:text-[15px] leading-relaxed mb-12">
          Crafting purposeful garments for those who<br />value refined simplicity and ethical production.
        </p>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-[11px] tracking-[0.15em] font-semibold text-white uppercase mb-4">Company</h3>
            <ul className="flex flex-col gap-3">
              {['Our Story', 'Sustainability', 'Careers', 'Journal'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-[15px] text-neutral-400 hover:text-white transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] tracking-[0.15em] font-semibold text-white uppercase mb-4">Support</h3>
            <ul className="flex flex-col gap-3">
              {['Shipping', 'Returns', 'Contact', 'FAQ'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-[15px] text-neutral-400 hover:text-white transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-6 flex flex-col gap-6">
          <p className="text-[10px] tracking-[0.15em] text-neutral-500 uppercase">
            © 2026 Végétal Studio. All rights reserved.
          </p>
          <div className="flex gap-4">
            {[Instagram, Twitter, Facebook].map((Icon, idx) => (
              <a key={idx} href="#" className="w-10 h-10 rounded-full border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-800 transition-colors group">
                <Icon size={16} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [view, setView] = React.useState<'home' | 'checkout' | 'success' | 'admin' | 'details' | 'thank-you'>('home');
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>('all');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [confirmedOrder, setConfirmedOrder] = React.useState<{ productName: string; totalPrice: number; phoneNumber: string } | null>(null);

  // Synchronize state with URL on initial load and browser back/forward navigation
  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setView('admin');
      } else if (path.startsWith('/product/')) {
        const id = path.split('/product/')[1];
        if (id) {
          setSelectedProductId(id);
          setView('details');
        } else {
          setView('home');
        }
      } else if (path === '/thank-you') {
        setView('thank-you');
      } else {
        setView('home');
      }
    };

    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Sync state changes back to standard URL paths (without reloading the page)
  React.useEffect(() => {
    const currentPath = window.location.pathname;
    let expectedPath = '/';

    if (view === 'admin') {
      expectedPath = '/admin';
    } else if (view === 'details' && selectedProductId) {
      expectedPath = `/product/${selectedProductId}`;
    } else if (view === 'thank-you') {
      expectedPath = '/thank-you';
    }

    if (currentPath !== expectedPath) {
      window.history.pushState({ view, selectedProductId }, '', expectedPath);
    }
  }, [view, selectedProductId]);

  return (
    <AuthProvider>
      <div className="w-full min-h-screen flex flex-col font-sans selection:bg-brand-text selection:text-white">
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={(v) => { setView(v); setIsMenuOpen(false); }} />

        {/* 
          Using a constraint wrapper specifically to mirror the mobile-first screenshot aesthetic 
          on larger screens, ensuring it doesn't break the layout intended by the mockups. 
        */}
        {view !== 'admin' ? (
          <div className="w-full max-w-[480px] mx-auto bg-brand-bg min-h-screen flex flex-col shadow-2xl relative">
            {view === 'home' && (
              <>
                <div className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md">
                  <Header onMenuClick={() => setIsMenuOpen(true)} onSearchClick={() => setIsSearchOpen(true)} />
                  <Navigation selectedCategoryId={selectedCategoryId} onSelectCategory={setSelectedCategoryId} />
                </div>
                
                <main className="flex-1 pb-10">
                  <Hero />
                  <BestSellers selectedCategoryId={selectedCategoryId} onProductSelect={(id) => { setSelectedProductId(id); setView('details'); }} />
                </main>
                
                <Footer />
              </>
            )}

            {view === 'details' && selectedProductId && (
              <ProductDetails 
                productId={selectedProductId} 
                onBack={() => setView('home')} 
                onOrderSuccess={(orderInfo) => {
                  setConfirmedOrder(orderInfo);
                  setView('thank-you');
                }}
              />
            )}

            {view === 'thank-you' && confirmedOrder && (
              <ThankYou 
                productName={confirmedOrder.productName} 
                totalPrice={confirmedOrder.totalPrice} 
                phone={confirmedOrder.phoneNumber} 
                onContinue={() => setView('home')} 
              />
            )}

            {/* Real Search Modal Overlay */}
            <SearchModal 
              isOpen={isSearchOpen} 
              onClose={() => setIsSearchOpen(false)} 
              onSelectProduct={(id) => { 
                setSelectedProductId(id); 
                setView('details'); 
                setIsSearchOpen(false); 
              }} 
            />
          </div>
        ) : (
          <div className="w-full min-h-screen bg-neutral-50 relative">
            <AdminDashboard onBack={() => setView('home')} />
          </div>
        )}
      </div>
    </AuthProvider>
  );
}

