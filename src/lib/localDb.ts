/**
 * Demo-mode database kept in this browser's localStorage. Used only when Supabase is not
 * configured, so the storefront and /admin can be tried end to end without a backend.
 * Nothing here is shared between visitors or devices.
 */
import { categories as seedCategories, products as seedProducts, type Category, type Product } from '../data/products';
import type { Settings, SettingsKey } from '../data/settings';
import type { CustomRequestRecord, DayOverride, MessageRecord, OrderRecord, ReviewRecord, SubscriberRecord } from './types';

export interface LocalDb {
  products: Product[];
  categories: Category[];
  overrides: DayOverride[];
  settings: Partial<Settings>;
  orders: OrderRecord[];
  requests: CustomRequestRecord[];
  messages: MessageRecord[];
  subscribers: SubscriberRecord[];
  reviews: ReviewRecord[];
  nextOrderNumber: number;
}

const KEY = 'sweetdaisy.demo-db.v1';

const seed = (): LocalDb => ({
  products: seedProducts.map((p, i) => ({ ...p, active: true, sort: i })),
  categories: seedCategories,
  overrides: [],
  settings: {},
  orders: [],
  requests: [],
  messages: [],
  subscribers: [],
  reviews: [],
  nextOrderNumber: 10001,
});

let cache: LocalDb | null = null;

export function readDb(): LocalDb {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...seed(), ...(JSON.parse(raw) as LocalDb) } : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

export function writeDb(mutate: (db: LocalDb) => void): LocalDb {
  const db = structuredClone(readDb());
  mutate(db);
  cache = db;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or unavailable — keep in memory for this visit */
  }
  window.dispatchEvent(new Event('sweetdaisy:demo-db'));
  return db;
}

export function resetDb() {
  cache = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('sweetdaisy:demo-db'));
}

export const setLocalSetting = <K extends SettingsKey>(key: K, value: Settings[K]) =>
  writeDb((db) => {
    db.settings[key] = value;
  });

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
