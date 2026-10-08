/**
 * Data access for /admin. Uses Supabase (protected by the admin RLS policies) or, in demo
 * mode, the browser-local database.
 */
import type { Category, Product } from '../data/products';
import { mergeSettings, type Settings, type SettingsKey } from '../data/settings';
import { fromRow, toRow, wait, type ProductRow } from './api';
import { readDb, writeDb } from './localDb';
import { supabase } from './supabase';
import type { CustomRequestRecord, DayOverride, DayStatus, MessageRecord, OrderRecord, SubscriberRecord } from './types';

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(translate(error.message));
};

function translate(msg: string) {
  if (/row-level security|permission denied/i.test(msg)) return 'No tienes permisos de administrador para esta acción.';
  if (/foreign key/i.test(msg)) return 'No se puede borrar porque hay elementos que dependen de esto.';
  if (/duplicate key/i.test(msg)) return 'Ya existe un elemento con ese identificador.';
  return msg;
}

/* ------------------------------------------------------------------------- auth */

export interface AdminSession {
  email: string;
  isAdmin: boolean;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!supabase) return { email: 'demo', isAdmin: true };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase.rpc('is_admin');
  fail(error);
  return { email: session.user.email ?? '', isAdmin: Boolean(data) };
}

export async function signIn(email: string, password: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message);
}

export async function signOut() {
  await supabase?.auth.signOut();
}

export async function sendPasswordReset(email: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}admin`,
  });
  fail(error);
}

export async function updatePassword(password: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ password });
  fail(error);
}

/* ---------------------------------------------------------------------- products */

export async function listProducts(): Promise<Product[]> {
  if (!supabase) return [...readDb().products].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const { data, error } = await supabase.from('products').select('*').order('sort');
  fail(error);
  return (data as ProductRow[]).map(fromRow);
}

/** Create or update a product. `originalSlug` is the slug it had before editing (if any). */
export async function saveProduct(product: Product, originalSlug?: string) {
  if (!supabase) {
    await wait(200);
    writeDb((db) => {
      const clash = db.products.find((p) => p.slug === product.slug && p.slug !== originalSlug);
      if (clash) throw new Error('Ya existe un producto con ese identificador (slug).');
      const i = db.products.findIndex((p) => p.slug === (originalSlug ?? product.slug));
      if (i >= 0) db.products[i] = product;
      else db.products.push(product);
    });
    return;
  }
  if (originalSlug && originalSlug !== product.slug) {
    const { error } = await supabase.from('products').update(toRow(product)).eq('slug', originalSlug);
    return fail(error);
  }
  const { error } = await supabase.from('products').upsert(toRow(product));
  fail(error);
}

export async function deleteProduct(slug: string) {
  if (!supabase) {
    writeDb((db) => {
      db.products = db.products.filter((p) => p.slug !== slug);
    });
    return;
  }
  const { error } = await supabase.from('products').delete().eq('slug', slug);
  if (error && /foreign key/i.test(error.message)) {
    throw new Error('Este producto aparece en pedidos anteriores, así que no se puede borrar. Desactívalo para ocultarlo de la tienda.');
  }
  fail(error);
}

export async function reorderProducts(slugs: string[]) {
  if (!supabase) {
    writeDb((db) => {
      db.products.forEach((p) => (p.sort = slugs.indexOf(p.slug)));
    });
    return;
  }
  await Promise.all(slugs.map((slug, i) => supabase!.from('products').update({ sort: i }).eq('slug', slug).then(({ error }) => fail(error))));
}

/** Uploads a product photo and returns its public URL. */
export async function uploadProductImage(file: File): Promise<string> {
  if (!supabase) return downscaleToDataUrl(file, 1400);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  fail(error);
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

function downscaleToDataUrl(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    img.src = URL.createObjectURL(file);
  });
}

/* -------------------------------------------------------------------- categories */

export async function listCategories(): Promise<Category[]> {
  if (!supabase) return readDb().categories;
  const { data, error } = await supabase.from('categories').select('id,name,blurb,i18n').order('sort');
  fail(error);
  return data as Category[];
}

export async function saveCategories(list: Category[], removed: string[]) {
  if (!supabase) {
    writeDb((db) => {
      const used = removed.filter((id) => db.products.some((p) => p.category === id));
      if (used.length) throw new Error('No se puede borrar una categoría que tiene productos. Muévelos primero.');
      db.categories = list;
    });
    return;
  }
  if (removed.length) {
    const { error } = await supabase.from('categories').delete().in('id', removed);
    if (error && /foreign key/i.test(error.message)) throw new Error('No se puede borrar una categoría que tiene productos. Muévelos primero.');
    fail(error);
  }
  const { error } = await supabase.from('categories').upsert(list.map((c, i) => ({ ...c, sort: i })));
  fail(error);
}

/* ------------------------------------------------------------------ availability */

export async function listOverrides(): Promise<DayOverride[]> {
  const today = new Date().toISOString().slice(0, 10);
  if (!supabase) return readDb().overrides.filter((o) => o.day >= today);
  const { data, error } = await supabase.from('availability_overrides').select('day,status,note').gte('day', today).order('day');
  fail(error);
  return data as DayOverride[];
}

export async function setOverride(day: string, status: DayStatus | null, note?: string) {
  if (!supabase) {
    writeDb((db) => {
      db.overrides = db.overrides.filter((o) => o.day !== day);
      if (status) db.overrides.push({ day, status, note: note || null });
    });
    return;
  }
  if (!status) {
    const { error } = await supabase.from('availability_overrides').delete().eq('day', day);
    return fail(error);
  }
  const { error } = await supabase.from('availability_overrides').upsert({ day, status, note: note || null });
  fail(error);
}

/* ---------------------------------------------------------------------- settings */

export async function getSettings(): Promise<Settings> {
  if (!supabase) return mergeSettings(readDb().settings);
  const { data, error } = await supabase.from('settings').select('key,value');
  fail(error);
  return mergeSettings(Object.fromEntries((data as { key: SettingsKey; value: unknown }[]).map((r) => [r.key, r.value])));
}

export async function saveSettings<K extends SettingsKey>(key: K, value: Settings[K]) {
  if (!supabase) {
    await wait(200);
    writeDb((db) => {
      db.settings[key] = value;
    });
    return;
  }
  const { error } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
  fail(error);
}

/* ------------------------------------------------------------------------ orders */

export async function listOrders(): Promise<OrderRecord[]> {
  if (!supabase) return readDb().orders;
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(500);
  fail(error);
  return (data as OrderRecord[]).map((o) => ({ ...o, subtotal: Number(o.subtotal), delivery_fee: Number(o.delivery_fee), total: Number(o.total) }));
}

export async function updateOrder(id: string, patch: Partial<Pick<OrderRecord, 'status' | 'payment_status' | 'admin_notes'>>) {
  if (!supabase) {
    writeDb((db) => {
      const o = db.orders.find((x) => x.id === id);
      if (o) Object.assign(o, patch);
    });
    return;
  }
  const { error } = await supabase.from('orders').update(patch).eq('id', id);
  fail(error);
}

/* ---------------------------------------------------------------- custom requests */

export async function listRequests(): Promise<CustomRequestRecord[]> {
  if (!supabase) return readDb().requests;
  const { data, error } = await supabase.from('custom_cake_requests').select('*').order('created_at', { ascending: false }).limit(500);
  fail(error);
  return (data as CustomRequestRecord[]).map((r) => ({ ...r, quote_amount: r.quote_amount == null ? null : Number(r.quote_amount) }));
}

export async function updateRequest(id: string, patch: Partial<Pick<CustomRequestRecord, 'status' | 'quote_amount' | 'admin_notes'>>) {
  if (!supabase) {
    writeDb((db) => {
      const r = db.requests.find((x) => x.id === id);
      if (r) Object.assign(r, patch);
    });
    return;
  }
  const { error } = await supabase.from('custom_cake_requests').update(patch).eq('id', id);
  fail(error);
}

export async function deleteRequest(id: string) {
  if (!supabase) {
    writeDb((db) => {
      db.requests = db.requests.filter((r) => r.id !== id);
    });
    return;
  }
  const { error } = await supabase.from('custom_cake_requests').delete().eq('id', id);
  fail(error);
}

/** Temporary links (1 hour) to the private inspiration photos of a request. */
export async function inspirationUrls(paths: string[]): Promise<string[]> {
  if (!supabase || paths.length === 0) return [];
  const { data, error } = await supabase.storage.from('cake-inspiration').createSignedUrls(paths, 3600);
  fail(error);
  return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
}

/* ------------------------------------------------------------ messages & newsletter */

export async function listMessages(): Promise<MessageRecord[]> {
  if (!supabase) return readDb().messages;
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(500);
  fail(error);
  return data as MessageRecord[];
}

export async function deleteMessage(id: string) {
  if (!supabase) {
    writeDb((db) => {
      db.messages = db.messages.filter((m) => m.id !== id);
    });
    return;
  }
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  fail(error);
}

export async function listSubscribers(): Promise<SubscriberRecord[]> {
  if (!supabase) return readDb().subscribers;
  const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
  fail(error);
  return data as SubscriberRecord[];
}

export async function deleteSubscriber(email: string) {
  if (!supabase) {
    writeDb((db) => {
      db.subscribers = db.subscribers.filter((s) => s.email !== email);
    });
    return;
  }
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('email', email);
  fail(error);
}
