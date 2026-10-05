import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { categories as localCategories, products as localProducts, type Category, type Product } from '../data/products';
import { fetchAvailabilityOverrides, fetchCatalog, type DayStatus } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';

interface CatalogState {
  products: Product[];
  categories: Category[];
  overrides: Record<string, DayStatus>;
  /** True while running on the bundled demo catalogue (no Supabase project connected). */
  demo: boolean;
  getProduct: (slug: string) => Product | undefined;
}

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  // Render instantly from the bundled catalogue, then hydrate from Supabase when configured.
  const [products, setProducts] = useState<Product[]>(localProducts);
  const [categories, setCategories] = useState<Category[]>(localCategories);
  const [overrides, setOverrides] = useState<Record<string, DayStatus>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    fetchCatalog()
      .then((c) => {
        if (c.products.length) setProducts(c.products);
        if (c.categories.length) setCategories(c.categories);
      })
      .catch((e) => console.error('[catalog] falling back to bundled data', e));
    fetchAvailabilityOverrides()
      .then(setOverrides)
      .catch((e) => console.error('[availability]', e));
  }, []);

  const getProduct = (slug: string) => products.find((p) => p.slug === slug);

  return (
    <CatalogContext.Provider value={{ products, categories, overrides, demo: !isSupabaseConfigured, getProduct }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
