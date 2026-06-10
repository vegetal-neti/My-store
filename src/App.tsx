import React from 'react';
import { Menu, Search, ArrowRight, Plus, Facebook, Instagram, MessageCircle, Send, Phone } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { AuthProvider } from './context/AuthContext';
import { Product } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductDetails } from './components/ProductDetails';
import { SearchModal } from './components/SearchModal';
import { ThankYou } from './components/ThankYou';
import { AllProducts } from './components/AllProducts';

const Header = ({ onMenuClick, onSearchClick }: { onMenuClick: () => void; onSearchClick: () => void }) => {
  return (
    <header className="px-5 pt-3 pb-2 flex items-center justify-between">
      <button aria-label="Menu" className="text-brand-text" onClick={onMenuClick}>
        <Menu strokeWidth={1.5} size={20} />
      </button>
      <h1 className="font-serif italic text-2xl tracking-tight translate-x-2">ShopLix</h1>
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

const Hero = ({ onCtaClick }: { onCtaClick: (categoryId: string) => void }) => {
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchHero = async () => {
      try {
        const { getHeroSettings } = await import('./firebase');
        const data = await getHeroSettings();
        if (data) {
          setSettings(data);
        }
      } catch (err) {
        console.error("Error loading hero banner details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHero();
  }, []);

  const badgeText = settings?.badge || 'Spring / Summer 26';
  const titleText = settings?.title || 'The Linen Collection';
  const descriptionText = settings?.description || '';
  const buttonText = settings?.ctaText || 'Shop New Season';
  const imageUrl = settings?.imageUrl;
  const ctaLinkValue = settings?.ctaLink || 'all';

  if (loading) {
    return (
      <section className="px-4 mb-10 mt-3">
        <div className="bg-brand-hero/10 h-[480px] rounded-3xl flex items-center justify-center animate-pulse border border-neutral-100">
          <div className="w-8 h-8 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-10 mt-3">
      <div 
        className="h-[480px] rounded-[2rem] p-7 flex flex-col justify-end relative overflow-hidden transition-all duration-500 hover:shadow-md"
        style={{
          backgroundColor: imageUrl ? 'transparent' : 'var(--color-brand-hero)',
          backgroundImage: imageUrl ? `url('${imageUrl}')` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Subtle overlay to enhance text readability over user uploaded images */}
        {imageUrl && (
          <div className="absolute inset-0 bg-neutral-950/25 z-0" />
        )}

        <div className="relative z-10 flex flex-col items-start max-w-full">
          {badgeText && (
            <p className="text-[10px] tracking-[0.22em] font-semibold text-white/95 mb-3 uppercase drop-shadow-sm">
              {badgeText}
            </p>
          )}
          <h2 className="font-serif italic text-[2.5rem] md:text-[2.75rem] leading-[1.1] text-white mb-4 drop-shadow-sm max-w-md">
            {titleText}
          </h2>
          {descriptionText && (
            <p className="text-[13px] text-white/90 mb-6 leading-relaxed max-w-[280px] drop-shadow-sm">
              {descriptionText}
            </p>
          )}
          <button 
            onClick={() => onCtaClick(ctaLinkValue)}
            className="bg-white/95 hover:bg-white active:scale-95 transition-all text-brand-text rounded-full py-3.5 px-6 flex items-center justify-between w-[220px] shadow-sm group"
          >
            <span className="text-sm font-semibold tracking-wide">{buttonText}</span>
            <ArrowRight size={18} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export interface ProductCardProps extends Product {
  onSelect?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = (props) => {
  const { title, name, description, image, price, oldPrice, rating, reviews, badge, bgColor, onSelect } = props;
  const bgClass = bgColor === 'gray' ? 'bg-brand-card-gray' : (bgColor === 'beige' ? 'bg-brand-card-beige' : 'bg-neutral-100');
  
  const [imageLoaded, setImageLoaded] = React.useState(false);
  
  const displayTitle = name || title || 'Unnamed Product';
  const isArabic = (text?: string) => text ? /[\u0600-\u06FF]/.test(text) : false;
  const isTitleArabic = isArabic(displayTitle);

  // Custom SVG to replicate the exact Star icon style from the image
  const StarIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );

  const hasDiscount = oldPrice && oldPrice > price;

  return (
    <div className="flex flex-col group cursor-pointer h-full" onClick={onSelect}>
      <div className={`relative aspect-[4/5] rounded-2xl ${image ? 'bg-neutral-100 overflow-hidden' : bgClass} mb-3 p-3 flex flex-col justify-between`}>
        {image && (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-neutral-200 animate-pulse rounded-2xl" />
            )}
            <img 
              src={image} 
              alt={displayTitle} 
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
              referrerPolicy="no-referrer" 
            />
          </>
        )}
        <div className="relative z-10 w-full flex justify-between items-start gap-1">
          {badge ? (
            <div className="bg-white/90 backdrop-blur-sm px-3 pt-1.5 pb-1 rounded-full w-fit">
              <span className="text-[9px] font-semibold tracking-[0.05em] uppercase text-brand-text">{badge}</span>
            </div>
          ) : <div />}
          {hasDiscount && (
            <div className="bg-red-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-full shadow-xs tracking-tight select-none">
              -{Math.round(((oldPrice - price) / oldPrice) * 100)}%
            </div>
          )}
        </div>
      </div>
      <div className={`flex justify-between items-start gap-2 mb-1 px-1 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-[15px] font-medium leading-snug text-brand-text flex-1 line-clamp-2 ${isTitleArabic ? 'text-right' : 'text-left'}`} dir={isTitleArabic ? 'rtl' : 'ltr'}>{displayTitle}</h3>
        <div className="shrink-0 flex flex-col items-end">
          <span className="text-[15px] font-bold text-brand-text inline-flex gap-1" dir="ltr">
            <span className="text-[11px] font-normal opacity-90 mt-0.5">دج</span>
            <span>{(price || 0).toFixed(0)}</span>
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-neutral-400 line-through inline-flex gap-1 mt-0.5" dir="ltr">
              <span className="text-[9px] mt-0.5">دج</span>
              <span>{oldPrice.toFixed(0)}</span>
            </span>
          )}
        </div>
      </div>
      {description && (
        <p className={`text-[13px] text-neutral-500 px-1 mb-1 line-clamp-1 ${isArabic(description) ? 'text-right' : 'text-left'}`} dir={isArabic(description) ? 'rtl' : 'ltr'}>{description}</p>
      )}
    </div>
  );
};

const BestSellers = ({ 
  selectedCategoryId, 
  onProductSelect,
  onViewAll
}: { 
  selectedCategoryId: string; 
  onProductSelect: (id: string) => void; 
  onViewAll: () => void;
}) => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [limitNum, setLimitNum] = React.useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 16);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const targetLimit = isMobile ? 8 : 16;
      if (targetLimit !== limitNum) {
        setLimitNum(targetLimit);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [limitNum]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { getProductsWithLimit } = await import('./firebase');
        const fetchedProducts = await getProductsWithLimit(limitNum, selectedCategoryId);
        if (fetchedProducts) {
          setProducts(fetchedProducts as Product[]);
        } else {
          setProducts([]);
        }
      } catch (err: any) {
        console.error("Firebase connection error.", err);
        setError("Database connection error. Please search or check backend settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategoryId, limitNum]);

  return (
    <section className="px-4 mb-16" id="best-sellers-section">
      <div className="mb-6 px-1">
        <div className="flex justify-between items-end">
          <h2 className="font-serif italic text-4xl text-brand-text leading-tight">
            Our Products
          </h2>
          <button 
            onClick={(e) => { e.preventDefault(); onViewAll(); }}
            className="text-sm font-medium text-brand-text underline underline-offset-4 decoration-[1.5px] pb-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            View All
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {Array.from({ length: limitNum }).map((_, i) => (
            <div key={i} className="flex flex-col animate-pulse">
              <div className="relative aspect-[4/5] rounded-2xl bg-neutral-200 mb-3 w-full" />
              <div className="h-4 bg-neutral-200 rounded-md w-3/4 mb-2.5" />
              <div className="h-3 bg-neutral-200 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-10 text-center px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-neutral-500 text-[15px]">
          No products found. Please add products to Firestore.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} onSelect={() => onProductSelect(product.id)} />
          ))}
        </div>
      )}
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-brand-footer text-white px-6 pt-8 pb-5 rounded-t-3xl sm:rounded-none mt-auto">
      <div className="max-w-md mx-auto">
        <h2 className="font-serif italic text-3xl mb-2">ShopLix</h2>
        <p className="text-neutral-400 text-[14px] sm:text-[15px] leading-relaxed mb-6 text-right" dir="rtl">
          جودة متميزة وأسعار منافسة تجعل تسوقك متعة حقيقية.
        </p>

        <div className="grid grid-cols-2 gap-8 mb-6 text-right" dir="rtl">
          <div>
            <h3 className="text-[13px] tracking-[0.15em] font-semibold text-white mb-2">خدمة العملاء</h3>
            <ul className="flex flex-col gap-1.5">
              {['اسعار التوصيل', 'تتبع الطلب', 'سياسة الاسترجاع'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-[15px] text-neutral-400 hover:text-white transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[13px] tracking-[0.15em] font-semibold text-white mb-2">روابط سريعة</h3>
            <ul className="flex flex-col gap-1.5">
              {['الرئيسية', 'منتجاتنا', 'تواصل معنا'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-[15px] text-neutral-400 hover:text-white transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-4 flex flex-col gap-4 text-right" dir="rtl">
          <p className="text-[10px] tracking-[0.15em] text-neutral-500 uppercase">
            © 2026 Shoplix - جميع الحقوق محفوظة
          </p>
          <div className="flex gap-4 justify-start">
            {[
              { icon: Instagram, hoverBg: 'hover:bg-[#E1306C] hover:border-[#E1306C]' },
              { isWhatsapp: true, hoverBg: 'hover:bg-[#25D366] hover:border-[#25D366]' },
              { icon: Facebook, hoverBg: 'hover:bg-[#1877F2] hover:border-[#1877F2]' },
              { isTelegram: true, hoverBg: 'hover:bg-[#0088cc] hover:border-[#0088cc]' }
            ].map((item, idx) => (
              <a 
                key={idx} 
                href="#" 
                className={`w-10 h-10 rounded-full border border-neutral-700 flex items-center justify-center text-white transition-all group ${item.hoverBg}`}
              >
                {item.isWhatsapp ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] group-hover:scale-110 transition-transform">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                ) : item.isTelegram ? (
                  <svg viewBox="0 0 496 512" fill="currentColor" className="w-[18px] h-[18px] group-hover:scale-110 transition-transform">
                    <path d="M363 176L312.4 414.1c-3.8 17.1-13.9 21.4-28.2 13.3L205.5 370l-37.9 36.5c-4.2 4.2-7.7 7.7-15.8 7.7l5.6-80L303.1 199.1c6.3-5.6-1.4-8.8-9.8-3.1L113.8 308l-77.7-24.3c-16.9-5.3-17.2-16.9 3.5-25L320 158.3c13.1-4.8 25.1 3.4 20 24.7Z"/>
                  </svg>
                ) : (
                  item.icon ? <item.icon size={16} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" /> : null
                )}
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

  // Synchronously parse initial state from current URL path before first render to prevent race conditions
  const getInitialStateFromURL = () => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    let initialView: 'home' | 'admin' | 'details' | 'thank-you' | 'products' = 'home';
    let initialProductId: string | null = null;

    if (path === '/admin') {
      initialView = 'admin';
    } else if (path === '/products') {
      initialView = 'products';
    } else if (path.startsWith('/product/')) {
      let id = path.split('/product/')[1];
      if (id) {
        // Strip trailing slashes, query variables, and hashed fragments
        id = id.split('?')[0].split('#')[0].split('/')[0];
        if (id) {
          initialProductId = id;
          initialView = 'details';
        }
      }
    } else if (path === '/thank-you') {
      initialView = 'thank-you';
    }

    return { initialView, initialProductId };
  };

  const { initialView, initialProductId } = getInitialStateFromURL();

  const [view, setView] = React.useState<'home' | 'checkout' | 'success' | 'admin' | 'details' | 'thank-you' | 'products'>(initialView);
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(initialProductId);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>('all');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [confirmedOrder, setConfirmedOrder] = React.useState<{ productName: string; totalPrice: number; phoneNumber: string } | null>(null);

  // Synchronize state with URL on browser back/forward navigation
  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setView('admin');
      } else if (path === '/products') {
        setView('products');
      } else if (path.startsWith('/product/')) {
        let id = path.split('/product/')[1];
        if (id) {
          id = id.split('?')[0].split('#')[0].split('/')[0];
          if (id) {
            setSelectedProductId(id);
            setView('details');
          } else {
            setView('home');
          }
        } else {
          setView('home');
        }
      } else if (path === '/thank-you') {
        setView('thank-you');
      } else {
        setView('home');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Sync state changes back to standard URL paths (without reloading the page)
  React.useEffect(() => {
    const currentPath = window.location.pathname;
    let expectedPath = '/';

    if (view === 'admin') {
      expectedPath = '/admin';
    } else if (view === 'products') {
      expectedPath = '/products';
    } else if (view === 'details' && selectedProductId) {
      expectedPath = `/product/${selectedProductId}`;
    } else if (view === 'thank-you') {
      expectedPath = '/thank-you';
    }

    if (currentPath !== expectedPath) {
      window.history.pushState({ view, selectedProductId }, '', expectedPath);
    }
  }, [view, selectedProductId]);

  // Pre-load / warm up firebase cache in background to guarantee instant route transitions
  React.useEffect(() => {
    const warmupCache = async () => {
      try {
        const { getProducts, getCategories, getShippingRates } = await import('./firebase');
        await Promise.all([
          getProducts(),
          getCategories(),
          getShippingRates()
        ]);
      } catch (err) {
        console.warn("Background cache pre-warming failed:", err);
      }
    };
    warmupCache();
  }, []);

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
                  {selectedCategoryId === 'all' && (
                    <Hero onCtaClick={(categoryId) => {
                      if (categoryId) {
                        const trimmedId = categoryId.trim();
                        const isUrl = trimmedId.startsWith('http://') || 
                                      trimmedId.startsWith('https://') || 
                                      trimmedId.startsWith('/') ||
                                      (trimmedId.includes('.') && !trimmedId.includes(' ') && (trimmedId.includes('/') || trimmedId.startsWith('www.')));
                        
                        if (isUrl) {
                          const destination = trimmedId.startsWith('www.') ? `https://${trimmedId}` : trimmedId;
                          window.open(destination, '_blank', 'noopener,noreferrer');
                        } else {
                          setSelectedCategoryId(trimmedId);
                          setTimeout(() => {
                            const section = document.getElementById('best-sellers-section');
                            if (section) {
                              section.scrollIntoView({ behavior: 'smooth' });
                            }
                          }, 100);
                        }
                      }
                    }} />
                  )}
                  <BestSellers 
                    selectedCategoryId={selectedCategoryId} 
                    onProductSelect={(id) => { setSelectedProductId(id); setView('details'); }} 
                    onViewAll={() => setView('products')} 
                  />
                </main>
                
                <Footer />
              </>
            )}

            {view === 'products' && (
              <AllProducts 
                onBack={() => setView('home')} 
                onProductSelect={(id) => { setSelectedProductId(id); setView('details'); }}
                initialCategoryId={selectedCategoryId}
              />
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

