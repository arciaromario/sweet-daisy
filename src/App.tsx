import { Fragment, lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { LanguageProvider, useLang } from './i18n';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MobileCartBar } from './components/MobileCartBar';
import { CartProvider } from './context/CartContext';
import { CatalogProvider } from './context/CatalogContext';
import Home from './pages/Home';

const Shop = lazy(() => import('./pages/Shop'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CustomCakes = lazy(() => import('./pages/CustomCakes'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const About = lazy(() => import('./pages/About'));
const Account = lazy(() => import('./pages/Account'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminApp = lazy(() => import('./admin/AdminApp'));
const Faq = lazy(() => import('./pages/Info').then((m) => ({ default: m.Faq })));
const ShippingDelivery = lazy(() => import('./pages/Info').then((m) => ({ default: m.ShippingDelivery })));
const Terms = lazy(() => import('./pages/Info').then((m) => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/Info').then((m) => ({ default: m.Privacy })));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (target) return void setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 80);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    if (!hash) return;
    // The target may be on a page that is still loading, so look for it for a moment.
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      if (el || ++tries > 20) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, [pathname, hash]);
  return null;
}

function Page() {
  const { pathname } = useLocation();
  return (
    <div className="page" key={pathname}>
      <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

/** Storefront chrome: header, footer, bag drawer and mobile bag bar. */
function StoreLayout() {
  return (
    <>
      <a href="#main" className="skip-link">
        {useLang() === 'es' ? 'Saltar al contenido' : 'Skip to content'}
      </a>
      <Header />
      <main id="main">
        <Page />
      </main>
      <Footer />
      <CartDrawer />
      <MobileCartBar />
    </>
  );
}

/** Checkout keeps distractions to a minimum: no navigation, no footer. */
function CheckoutLayout() {
  return (
    <main id="main">
      <Page />
    </main>
  );
}

/** Re-renders the whole store when the language changes, so every string and date switches at once. */
function LanguageKeyed({ children }: { children: ReactNode }) {
  return <Fragment key={useLang()}>{children}</Fragment>;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
      <LanguageProvider>
        <CatalogProvider>
          <CartProvider>
            <LanguageKeyed>
              <ScrollToTop />
              <Routes>
                <Route element={<StoreLayout />}>
                  <Route index element={<Home />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="cookies" element={<Shop scope="cookies" />} />
                  {/* Earlier cake and treat pages now lead to the cookie menu. */}
                  <Route path="cakes" element={<Navigate to="/cookies" replace />} />
                  <Route path="treats" element={<Navigate to="/cookies" replace />} />
                  <Route path="products/:slug" element={<ProductPage />} />
                  <Route path="custom-cakes" element={<CustomCakes />} />
                  <Route path="availability" element={<Navigate to="/#availability" replace />} />
                  <Route path="reviews" element={<Reviews />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Navigate to="/#contact" replace />} />
                  <Route path="account" element={<Account />} />
                  <Route path="faq" element={<Faq />} />
                  <Route path="shipping-delivery" element={<ShippingDelivery />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route element={<CheckoutLayout />}>
                  <Route path="checkout" element={<Checkout />} />
                </Route>
                <Route
                  path="admin/*"
                  element={
                    <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
                      <AdminApp />
                    </Suspense>
                  }
                />
              </Routes>
            </LanguageKeyed>
          </CartProvider>
        </CatalogProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
