export const prefetchMap: Record<string, () => Promise<any>> = {
  admin: () => import('../components/AdminDashboard'),
  details: () => import('../components/ProductDetails'),
  search: () => import('../components/SearchModal'),
  thankYou: () => import('../components/ThankYou'),
  products: () => import('../components/AllProducts'),
  shipping: () => import('../components/ShippingRatesModal'),
  faq: () => import('../components/FaqModal'),
  terms: () => import('../components/TermsPage'),
  privacy: () => import('../components/PrivacyPage'),
};

export const prefetchComponent = (name: string): void => {
  const fetcher = prefetchMap[name];
  if (fetcher) {
    fetcher().catch(() => {});
  }
};
