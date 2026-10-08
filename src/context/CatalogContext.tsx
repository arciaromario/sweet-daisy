import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { categories as bundledCategories, localizeCategory, localizeProduct, products as bundledProducts, type Category, type Product } from '../data/products';
import { defaultSettings, localizeHours, phoneHref, type Settings } from '../data/settings';
import { site as brand } from '../data/site';
import { fetchCatalog, type Catalog, type DayStatus } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';
import { useLang } from '../i18n';

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

  // Everything the storefront reads is already in the active language.
  const lang = useLang();
  const localized = useMemo(
    () => ({ ...catalog, products: catalog.products.map((p) => localizeProduct(p, lang)), categories: catalog.categories.map((c) => localizeCategory(c, lang)) }),
    [catalog, lang],
  );
  const getProduct = (slug: string) => localized.products.find((p) => p.slug === slug);

  return (
    <CatalogContext.Provider value={{ ...localized, demo: !isSupabaseConfigured, ready, getProduct, reload }}>{children}</CatalogContext.Provider>
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
  const lang = useLang();
  const es = lang === 'es';
  return {
    ...brand,
    tagline: es ? brand.taglineEs : brand.tagline,
    description: es ? brand.descriptionEs : brand.description,
    ...business,
    // Owner-entered text in the active language (English when no Spanish version is set).
    announcement: es && business.announcementEs ? business.announcementEs : business.announcement,
    hours: business.hours.map((h) => ({ days: localizeHours(h.days, lang), time: localizeHours(h.time, lang) })),
    phoneHref: phoneHref(business.phone),
    delivery: { fee: store.deliveryFee, freeOver: store.freeDeliveryOver, radius: es && store.deliveryRadiusEs ? store.deliveryRadiusEs : store.deliveryRadius },
  };
}
