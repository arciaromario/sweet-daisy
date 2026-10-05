import { supabase } from './supabase';
import { categories as localCategories, products as localProducts, type Category, type Product } from '../data/products';
import type { CartItem } from '../context/CartContext';

/* ------------------------------------------------------------------ catalogue */

interface ProductRow {
  slug: string;
  name: string;
  category: Product['category'];
  short: string;
  description: string;
  images: Product['images'];
  sizes: Product['sizes'];
  flavors: NonNullable<Product['flavors']>;
  decorations: NonNullable<Product['decorations']>;
  allow_message: boolean;
  lead_days: number;
  badge: string | null;
  bestseller: boolean;
  details: Product['details'];
  tint: string;
}

const fromRow = (r: ProductRow): Product => ({
  slug: r.slug,
  name: r.name,
  category: r.category,
  short: r.short,
  description: r.description,
  images: r.images,
  sizes: r.sizes,
  flavors: r.flavors?.length ? r.flavors : undefined,
  decorations: r.decorations?.length ? r.decorations : undefined,
  message: r.allow_message,
  leadDays: r.lead_days,
  badge: r.badge ?? undefined,
  bestseller: r.bestseller,
  details: r.details,
  tint: r.tint,
});

export async function fetchCatalog(): Promise<{ products: Product[]; categories: Category[] }> {
  if (!supabase) return { products: localProducts, categories: localCategories };
  const [p, c] = await Promise.all([
    supabase.from('products').select('*').eq('active', true).order('sort'),
    supabase.from('categories').select('id,name,blurb').order('sort'),
  ]);
  if (p.error) throw p.error;
  if (c.error) throw c.error;
  return { products: (p.data as ProductRow[]).map(fromRow), categories: c.data as Category[] };
}

/* --------------------------------------------------------------- availability */

export type DayStatus = 'limited' | 'booked' | 'closed';

export async function fetchAvailabilityOverrides(): Promise<Record<string, DayStatus>> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('availability_overrides')
    .select('day,status')
    .gte('day', new Date().toISOString().slice(0, 10));
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((d: { day: string; status: DayStatus }) => [d.day, d.status]));
}

/* --------------------------------------------------------------------- orders */

export interface OrderPayload {
  customer_name: string;
  email: string;
  phone: string;
  fulfillment: 'pickup' | 'delivery';
  address?: { line1: string; line2?: string; city: string; postal: string };
  fulfillment_date: string;
  time_slot: string;
  instructions?: string;
  payment_method: 'card' | 'in_person';
  items: CartItem[];
}

export interface PlacedOrder {
  orderNumber: string;
  total: number;
}

export async function placeOrder(order: OrderPayload, localTotal: number): Promise<PlacedOrder> {
  const items = order.items.map((i) => ({
    slug: i.slug,
    size_id: i.sizeId,
    flavor: i.flavor ?? '',
    decoration_id: i.decorationId ?? '',
    message: i.message ?? '',
    notes: i.notes ?? '',
    quantity: i.quantity,
  }));

  if (!supabase) {
    await wait(700);
    return { orderNumber: `SD-${Math.floor(10000 + Math.random() * 89999)}`, total: localTotal };
  }

  const { data, error } = await supabase.rpc('place_order', { payload: { ...order, items } });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { orderNumber: row.order_number, total: Number(row.total) };
}

export interface OrderSummary {
  order_number: string;
  status: string;
  fulfillment: string;
  fulfillment_date: string;
  total: number;
  created_at: string;
  order_items: { product_name: string; size_label: string; quantity: number }[];
}

export async function fetchMyOrders(): Promise<OrderSummary[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('order_number,status,fulfillment,fulfillment_date,total,created_at,order_items(product_name,size_label,quantity)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as OrderSummary[];
}

/* -------------------------------------------------------------- custom cakes */

export interface CustomCakeRequest {
  size: string;
  flavor: string;
  filling: string;
  frosting: string;
  decoration_style: string;
  event_date: string;
  occasion?: string;
  instructions?: string;
  name: string;
  email: string;
  phone?: string;
}

export async function submitCustomCakeRequest(req: CustomCakeRequest, files: File[]): Promise<void> {
  if (!supabase) return wait(800);

  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('cake-inspiration').upload(path, file, { contentType: file.type });
    if (error) throw new Error(`We couldn't upload ${file.name}. Please try a smaller image.`);
    paths.push(path);
  }

  const { error } = await supabase.from('custom_cake_requests').insert({ ...req, inspiration_paths: paths });
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------- newsletter & contact */

export async function joinNewsletter(email: string): Promise<void> {
  if (!supabase) return wait(500);
  const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() });
  // 23505 = already subscribed; treat as success.
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function sendContactMessage(msg: { name: string; email: string; topic: string; message: string }) {
  if (!supabase) return wait(600);
  const { error } = await supabase.from('contact_messages').insert(msg);
  if (error) throw new Error(error.message);
}

/* --------------------------------------------------------------------- auth */

export async function sendMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Accounts are available once Supabase is connected.');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/account` },
  });
  if (error) throw new Error(error.message);
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
