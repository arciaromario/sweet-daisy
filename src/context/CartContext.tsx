import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { StoreSettings } from '../data/settings';

export interface CartItem {
  key: string;
  slug: string;
  name: string;
  image: string;
  tint: string;
  sizeId: string;
  sizeLabel: string;
  servings: string;
  flavor?: string;
  decorationId?: string;
  decorationLabel?: string;
  message?: string;
  notes?: string;
  unitPrice: number;
  quantity: number;
  leadDays: number;
  /** Average preparation time in hours (informational). */
  prepHours?: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  maxLeadDays: number;
  /** Longest average preparation time in the bag, in hours. */
  maxPrepHours: number;
  add: (item: Omit<CartItem, 'key'>) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const STORAGE_KEY = 'sweetdaisy.cart.v1';
const CartContext = createContext<CartState | null>(null);

const optionKey = (i: Omit<CartItem, 'key' | 'quantity'>) =>
  [i.slug, i.sizeId, i.flavor, i.decorationId, i.message, i.notes].map((v) => v ?? '').join('|');

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable (private mode) — cart still works for this visit */
    }
  }, [items]);

  const add = useCallback((item: Omit<CartItem, 'key'>) => {
    const key = optionKey(item);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(50, i.quantity + item.quantity) } : i));
      return [...prev, { ...item, key }];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(50, quantity) } : i)),
    );
  }, []);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
      maxLeadDays: items.reduce((n, i) => Math.max(n, i.leadDays), 0),
      maxPrepHours: items.reduce((n, i) => Math.max(n, i.prepHours ?? 0), 0),
      add,
      setQuantity,
      remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      clear: () => setItems([]),
      isOpen,
      open,
      close,
    }),
    [items, isOpen, add, setQuantity, open, close],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export const deliveryFee = (subtotal: number, method: 'pickup' | 'delivery', store: StoreSettings) =>
  method === 'pickup' || subtotal >= store.freeDeliveryOver ? 0 : store.deliveryFee;
