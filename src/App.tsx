import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router';
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
const Availability = lazy(() => import('./pages/Availability'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
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
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) return void setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 80);
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
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
        Skip to content
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

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
      <CatalogProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<StoreLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="cakes" element={<Shop scope="cakes" />} />
              <Route path="treats" element={<Shop scope="treats" />} />
              <Route path="products/:slug" element={<ProductPage />} />
              <Route path="custom-cakes" element={<CustomCakes />} />
              <Route path="availability" element={<Availability />} />
              <Route path="cart" element={<Cart />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
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
        </CartProvider>
      </CatalogProvider>
    </BrowserRouter>
  );
}
