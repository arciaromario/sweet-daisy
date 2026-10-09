import { supabase } from './supabase';
import type { Category, Product } from '../data/products';
import { mergeSettings, type Settings, type SettingsKey } from '../data/settings';
import type { CartItem } from '../context/CartContext';
import { readDb, uid, writeDb } from './localDb';
import { toISO } from './availability';
import { currentLang } from '../i18n';
import type { DayOverride, DayStatus, OrderItemRecord, ReviewRecord } from './types';

export type { DayStatus } from './types';

/* ------------------------------------------------------------ error messages */

/** Spanish versions of the fixed English messages raised by the database and the payment function. */
const ES_ERRORS: Record<string, string> = {
  'Your bag is empty.': 'Tu bolsa está vacía.',
  'The studio is closed on that day. Please choose another date.': 'El estudio está cerrado ese día. Por favor, elige otra fecha.',
  'That date is fully booked. Please choose another date.': 'Esa fecha ya está completa. Por favor, elige otra fecha.',
  'Please choose one of the available times.': 'Por favor, elige uno de los horarios disponibles.',
  'A product in your bag is no longer available.': 'Un producto de tu bolsa ya no está disponible.',
  'Online payments are not set up yet.': 'Los pagos en línea aún no están configurados.',
  'Online payments are not available in demo mode.': 'Los pagos en línea no están disponibles en modo demo.',
  'The payment page could not be opened. Please try again.': 'No pudimos abrir la página de pago. Por favor, inténtalo de nuevo.',
  'Order not found.': 'No encontramos el pedido.',
  'This order is already paid.': 'Este pedido ya está pagado.',
  'Something went wrong. Please try again.': 'Algo salió mal. Por favor, inténtalo de nuevo.',
  'Accounts are available once Supabase is connected.': 'Las cuentas estarán disponibles cuando se conecte Supabase.',
  "We couldn't find an order with that number and email.": 'No encontramos un pedido con ese número y correo.',
  'You can leave a review once your order has been picked up or delivered.': 'Podrás dejar tu opinión cuando hayas recogido o recibido tu pedido.',
  'This order already has a review. Thank you!': 'Este pedido ya tiene una opinión. ¡Gracias!',
  'Please choose a rating from 1 to 5 stars.': 'Por favor, elige una calificación de 1 a 5 estrellas.',
  'Please write a few words about your order.': 'Por favor, escribe unas palabras sobre tu pedido.',
};

const ES_PATTERNS: [RegExp, (...m: string[]) => string][] = [
  [/^Please choose a valid size for (.+)\.$/, (name) => `Por favor, elige un tamaño válido para ${name}.`],
  [
    /^Some items need (\d+) days? notice\. Please choose a later date\.$/,
    (n) => `Algunos productos necesitan ${n} ${n === '1' ? 'día' : 'días'} de anticipación. Por favor, elige una fecha posterior.`,
  ],
  [/^We couldn't upload (.+)\. Please try a smaller image\.$/, (name) => `No pudimos subir ${name}. Por favor, prueba con una imagen más pequeña.`],
];

/** Returns a user-facing error in the active language; unknown messages pass through unchanged. */
export function localizeError(message: string): string {
  if (currentLang() !== 'es') return message;
  if (ES_ERRORS[message]) return ES_ERRORS[message];
  for (const [re, fn] of ES_PATTERNS) {
    const m = message.match(re);
    if (m) return fn(...m.slice(1));
  }
  return message;
}

/* ------------------------------------------------------------------ catalogue */

export interface ProductRow {
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
  prep_hours: number | null;
  badge: string | null;
  bestseller: boolean;
  details: Product['details'];
  tint: string;
  sort: number;
  active: boolean;
  i18n: NonNullable<Product['i18n']>;
}

export const fromRow = (r: ProductRow): Product => ({
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
  prepHours: r.prep_hours == null ? undefined : Number(r.prep_hours),
  badge: r.badge ?? undefined,
  bestseller: r.bestseller,
  details: r.details,
  tint: r.tint,
  sort: r.sort,
  active: r.active,
  i18n: r.i18n ?? {},
});

export const toRow = (p: Product): ProductRow => ({
  slug: p.slug,
  name: p.name,
  category: p.category,
  short: p.short,
  description: p.description,
  images: p.images,
  sizes: p.sizes,
  flavors: p.flavors ?? [],
  decorations: p.decorations ?? [],
  allow_message: !!p.message,
  lead_days: p.leadDays,
  prep_hours: p.prepHours ?? null,
  badge: p.badge || null,
  bestseller: !!p.bestseller,
  details: p.details,
  tint: p.tint,
  sort: p.sort ?? 0,
  active: p.active !== false,
  i18n: p.i18n ?? {},
});

export interface Catalog {
  products: Product[];
  categories: Category[];
  overrides: Record<string, DayStatus>;
  settings: Settings;
}

export async function fetchCatalog(): Promise<Catalog> {
  const today = toISO(new Date());

  if (!supabase) {
    const db = readDb();
    return {
      products: db.products.filter((p) => p.active !== false).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
      categories: db.categories,
      overrides: Object.fromEntries(db.overrides.filter((o) => o.day >= today).map((o) => [o.day, o.status])),
      settings: mergeSettings(db.settings),
    };
  }

  const [p, c, a, s] = await Promise.all([
    supabase.from('products').select('*').eq('active', true).order('sort'),
    supabase.from('categories').select('id,name,blurb,i18n').order('sort'),
    supabase.from('availability_overrides').select('day,status').gte('day', today),
    supabase.from('settings').select('key,value'),
  ]);
  for (const r of [p, c, a, s]) if (r.error) throw r.error;

  return {
    products: (p.data as ProductRow[]).map(fromRow),
    categories: c.data as Category[],
    overrides: Object.fromEntries((a.data as DayOverride[]).map((d) => [d.day, d.status])),
    settings: mergeSettings(Object.fromEntries((s.data as { key: SettingsKey; value: unknown }[]).map((r) => [r.key, r.value]))),
  };
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

export async function placeOrder(order: OrderPayload, settings: Settings): Promise<PlacedOrder> {
  if (!supabase) return placeDemoOrder(order, settings);

  const items = order.items.map((i) => ({
    slug: i.slug,
    size_id: i.sizeId,
    flavor: i.flavor ?? '',
    decoration_id: i.decorationId ?? '',
    message: i.message ?? '',
    notes: i.notes ?? '',
    quantity: i.quantity,
  }));
  const { data, error } = await supabase.rpc('place_order', { payload: { ...order, items } });
  if (error) throw new Error(localizeError(error.message));
  const row = Array.isArray(data) ? data[0] : data;
  return { orderNumber: row.order_number, total: Number(row.total) };
}

/**
 * Opens Stripe Checkout for a saved order and returns the payment page URL.
 * Prices come from the order stored by place_order, never from the browser.
 */
export async function startCardPayment(orderNumber: string, email: string): Promise<string> {
  if (!supabase) throw new Error(localizeError('Online payments are not available in demo mode.'));
  const returnUrl = new URL(`${import.meta.env.BASE_URL}checkout`, window.location.origin).toString();
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { order_number: orderNumber, email, return_url: returnUrl },
  });
  if (error) {
    let message = 'The payment page could not be opened. Please try again.';
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      // Keep the generic message.
    }
    throw new Error(localizeError(message));
  }
  if (!data?.url) throw new Error(localizeError('The payment page could not be opened. Please try again.'));
  return data.url as string;
}

/** Demo mode: price the bag from the local catalogue and store the order in this browser. */
async function placeDemoOrder(order: OrderPayload, settings: Settings): Promise<PlacedOrder> {
  await wait(600);
  const db = readDb();
  const items: OrderItemRecord[] = order.items.map((i) => {
    const p = db.products.find((x) => x.slug === i.slug);
    const size = p?.sizes.find((s) => s.id === i.sizeId);
    if (!p || p.active === false || !size) throw new Error(localizeError('A product in your bag is no longer available.'));
    const flavor = p.flavors?.find((f) => f.label === i.flavor);
    const deco = p.decorations?.find((d) => d.id === i.decorationId);
    const unit = size.price + (flavor?.price ?? 0) + (deco?.price ?? 0);
    return {
      product_slug: p.slug,
      product_name: p.name,
      size_label: size.label,
      flavor: i.flavor ?? null,
      decoration: deco?.label ?? null,
      message: i.message ?? null,
      notes: i.notes ?? null,
      quantity: i.quantity,
      unit_price: unit,
      line_total: unit * i.quantity,
    };
  });
  const subtotal = items.reduce((n, i) => n + i.line_total, 0);
  const fee = order.fulfillment === 'delivery' && subtotal < settings.store.freeDeliveryOver ? settings.store.deliveryFee : 0;
  let number = '';
  writeDb((d) => {
    number = `SD-${d.nextOrderNumber++}`;
    d.orders.unshift({
      id: uid(),
      order_number: number,
      status: 'received',
      payment_status: 'pending',
      payment_method: order.payment_method,
      customer_name: order.customer_name,
      email: order.email.toLowerCase(),
      phone: order.phone,
      fulfillment: order.fulfillment,
      address: order.address ?? null,
      fulfillment_date: order.fulfillment_date,
      time_slot: order.time_slot,
      instructions: order.instructions ?? null,
      admin_notes: null,
      subtotal,
      delivery_fee: fee,
      total: subtotal + fee,
      created_at: new Date().toISOString(),
      order_items: items,
    });
  });
  return { orderNumber: number, total: subtotal + fee };
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('order_number,status,fulfillment,fulfillment_date,total,created_at,order_items(product_name,size_label,quantity)')
    .eq('user_id', user.id)
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
  if (!supabase) {
    await wait(700);
    writeDb((d) => {
      d.requests.unshift({
        id: uid(),
        ...req,
        occasion: req.occasion ?? null,
        instructions: req.instructions ?? null,
        phone: req.phone ?? null,
        inspiration_paths: files.map((f) => f.name),
        status: 'new',
        quote_amount: null,
        admin_notes: null,
        created_at: new Date().toISOString(),
      });
    });
    return;
  }

  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('cake-inspiration').upload(path, file, { contentType: file.type });
    if (error) throw new Error(localizeError(`We couldn't upload ${file.name}. Please try a smaller image.`));
    paths.push(path);
  }

  const { error } = await supabase.from('custom_cake_requests').insert({ ...req, inspiration_paths: paths });
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------- newsletter & contact */

export async function joinNewsletter(email: string): Promise<void> {
  const clean = email.trim().toLowerCase();
  if (!supabase) {
    await wait(400);
    writeDb((d) => {
      if (!d.subscribers.some((s) => s.email === clean)) d.subscribers.unshift({ email: clean, created_at: new Date().toISOString() });
    });
    return;
  }
  const { error } = await supabase.from('newsletter_subscribers').insert({ email: clean });
  // 23505 = already subscribed; treat as success.
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function sendContactMessage(msg: { name: string; email: string; topic: string; message: string }) {
  if (!supabase) {
    await wait(500);
    writeDb((d) => {
      d.messages.unshift({ id: uid(), ...msg, created_at: new Date().toISOString() });
    });
    return;
  }
  const { error } = await supabase.from('contact_messages').insert(msg);
  if (error) throw new Error(error.message);
}

/* -------------------------------------------------------------------- reviews */

/** What the storefront shows of an approved review. */
export type Review = Pick<ReviewRecord, 'id' | 'name' | 'rating' | 'comment' | 'products' | 'lang' | 'created_at'>;

export async function fetchReviews(): Promise<Review[]> {
  if (!supabase) return readDb().reviews.filter((r) => r.status === 'approved');
  const { data, error } = await supabase
    .from('reviews')
    .select('id,name,rating,comment,products,lang,created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as Review[];
}

export interface ReviewPayload {
  orderNumber: string;
  email: string;
  name: string;
  rating: number;
  comment: string;
}

/** Saves a review for the owner to approve. The order number and email must match a real order. */
export async function submitReview(r: ReviewPayload): Promise<void> {
  const lang = currentLang();
  if (!supabase) {
    await wait(500);
    const db = readDb();
    const order = db.orders.find((o) => o.order_number.toUpperCase() === r.orderNumber.trim().toUpperCase() && o.email.toLowerCase() === r.email.trim().toLowerCase());
    if (!order || order.status === 'cancelled') throw new Error(localizeError("We couldn't find an order with that number and email."));
    if (db.reviews.some((x) => x.order_id === order.id)) throw new Error(localizeError('This order already has a review. Thank you!'));
    writeDb((d) => {
      d.reviews.unshift({
        id: uid(),
        order_id: order.id,
        name: r.name.trim() || order.customer_name.split(' ')[0],
        rating: r.rating,
        comment: r.comment.trim(),
        products: [...new Set(order.order_items.map((i) => i.product_slug).filter(Boolean) as string[])],
        lang,
        status: 'pending',
        created_at: new Date().toISOString(),
        orders: { order_number: order.order_number, customer_name: order.customer_name, email: order.email },
      });
    });
    return;
  }
  const { error } = await supabase.rpc('submit_review', {
    p_order_number: r.orderNumber,
    p_email: r.email,
    p_name: r.name,
    p_rating: r.rating,
    p_comment: r.comment,
    p_lang: lang,
  });
  if (error) throw new Error(localizeError(error.message));
}

/* --------------------------------------------------------------------- auth */

export async function sendMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error(localizeError('Accounts are available once Supabase is connected.'));
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}account` },
  });
  if (error) throw new Error(error.message);
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
