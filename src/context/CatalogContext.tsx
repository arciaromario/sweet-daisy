import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { categories as bundledCategories, products as bundledProducts, type Category, type Product } from '../data/products';
import { defaultSettings, phoneHref, type Settings } from '../data/settings';
import { site as brand } from '../data/site';
import { fetchCatalog, type Catalog, type DayStatus } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';

interface CatalogState {
  products: Product[];
  categories: Category[];
  overrides: Record<string, DayStatus>;
  settings: Settings;
  /** True while running without Supabase (data lives in this browser only). */
  demo: boolean;
  /** False until the live catalogue has loaded. */
  ready: boolean;
  getProduct: (slug: string) => Product | undefined;
  reload: () => Promise<void>;
}

const CatalogContext = createContext<CatalogState | null>(null);

// Shown until the live catalogue loads: only active products, in shop order.
const bundled: Catalog = {
  products: bundledProducts.filter((p) => p.active !== false).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
  categories: bundledCategories,
  overrides: {},
  settings: defaultSettings,
};

export function CatalogProvider({ children }: { children: ReactNode }) {
  // Render instantly from the bundled catalogue, then replace it with the live data.
  const [catalog, setCatalog] = useState<Catalog>(bundled);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    try {
      const c = await fetchCatalog();
      setCatalog({
        ...c,
        products: c.products,
        categories: c.categories.length ? c.categories : bundledCategories,
      });
    } catch (e) {
      console.error('[catalog] using bundled data', e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    reload();
    // In demo mode, changes made in /admin are picked up immediately.
    window.addEventListener('sweetdaisy:demo-db', reload);
    return () => window.removeEventListener('sweetdaisy:demo-db', reload);
  }, [reload]);

  const getProduct = (slug: string) => catalog.products.find((p) => p.slug === slug);

  return (
    <CatalogContext.Provider value={{ ...catalog, demo: !isSupabaseConfigured, ready, getProduct, reload }}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}

export const useSettings = () => useCatalog().settings;

/** Brand + editable business details in one object (address, hours, socials, delivery terms). */
export function useSite() {
  const { business, store } = useCatalog().settings;
  return {
    ...brand,
    ...business,
    phoneHref: phoneHref(business.phone),
    delivery: { fee: store.deliveryFee, freeOver: store.freeDeliveryOver, radius: store.deliveryRadius },
  };
}
