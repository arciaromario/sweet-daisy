// Creates a Stripe Checkout session for an order that place_order already saved and priced.
// Secrets: STRIPE_SECRET_KEY (required; Edge Function secret or private.app_secrets),
// ALLOWED_ORIGINS (optional, comma-separated).
import postgres from 'npm:postgres@3';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false });

/** Edge Function secret first, then the private.app_secrets table (set from SQL). */
async function secret(name: string): Promise<string | undefined> {
  const fromEnv = Deno.env.get(name);
  if (fromEnv) return fromEnv;
  const [row] = await sql<{ value: string }[]>`select value from private.app_secrets where key = ${name}`;
  return row?.value || undefined;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://arciaromario.github.io,http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

Deno.serve(async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error(e);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeKey = await secret('STRIPE_SECRET_KEY');
  if (!stripeKey) return json({ error: 'Online payments are not set up yet.' }, 503);

  let body: { order_number?: string; email?: string; return_url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const { order_number, email, return_url } = body;
  if (!order_number || !email || !return_url) return json({ error: 'Invalid request.' }, 400);

  // Only send customers back to our own site.
  let back: URL;
  try {
    back = new URL(return_url);
  } catch {
    return json({ error: 'Invalid return URL.' }, 400);
  }
  if (!allowedOrigins.includes(back.origin)) return json({ error: 'Invalid return URL.' }, 400);

  type Item = { product_name: string; size_label: string; quantity: number; unit_price: string };
  const [order] = await sql<{ id: string; order_number: string; email: string; payment_status: string; delivery_fee: string }[]>`
    select id, order_number, email, payment_status, delivery_fee
      from public.orders where order_number = ${order_number}`;
  // The email acts as a light proof of ownership so order numbers can't be enumerated.
  if (!order || order.email !== email.trim().toLowerCase()) return json({ error: 'Order not found.' }, 404);
  if (order.payment_status === 'paid') return json({ error: 'This order is already paid.' }, 409);
  const items = await sql<Item[]>`
    select product_name, size_label, quantity, unit_price
      from public.order_items where order_id = ${order.id}`;

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('customer_email', order.email);
  form.set('client_reference_id', order.id);
  form.set('metadata[order_id]', order.id);
  form.set('metadata[order_number]', order.order_number);
  form.set('payment_intent_data[metadata][order_id]', order.id);
  form.set('payment_intent_data[metadata][order_number]', order.order_number);
  form.set('payment_intent_data[description]', `Sweet Daisy order ${order.order_number}`);

  const withParam = (key: string, value: string) => {
    const u = new URL(back);
    u.searchParams.set(key, value);
    return u.toString();
  };
  form.set('success_url', withParam('paid', order.order_number));
  form.set('cancel_url', withParam('unpaid', order.order_number));

  const lines = [
    ...items.map((i) => ({ name: `${i.product_name} — ${i.size_label}`, amount: Number(i.unit_price), qty: i.quantity })),
    ...(Number(order.delivery_fee) > 0 ? [{ name: 'Local delivery', amount: Number(order.delivery_fee), qty: 1 }] : []),
  ];
  lines.forEach((l, n) => {
    form.set(`line_items[${n}][quantity]`, String(l.qty));
    form.set(`line_items[${n}][price_data][currency]`, 'usd');
    form.set(`line_items[${n}][price_data][unit_amount]`, String(Math.round(l.amount * 100)));
    form.set(`line_items[${n}][price_data][product_data][name]`, l.name);
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const session = await res.json();
  if (!res.ok) {
    console.error('Stripe error', session?.error?.message);
    return json({ error: 'The payment page could not be opened. Please try again.' }, 502);
  }

  await sql`update public.orders set stripe_session_id = ${session.id} where id = ${order.id}`;
  return json({ url: session.url });
}
