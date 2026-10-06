// Receives Stripe events and marks orders as paid.
// Secrets: STRIPE_WEBHOOK_SECRET (the endpoint's signing secret, whsec_…).
// Deployed with verify_jwt = false: Stripe authenticates with its signature instead.
import postgres from 'npm:postgres@3';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false });

const TOLERANCE_SECONDS = 300;

async function verify(payload: string, header: string, secret: string) {
  const pairs = header.split(',').map((p) => p.split('=') as [string, string]);
  const t = pairs.find(([k]) => k === 't')?.[1];
  const signatures = pairs.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > TOLERANCE_SECONDS) return false;

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`)));
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
  return signatures.some((s) => s.length === expected.length && timingSafeEqual(s, expected));
}

function timingSafeEqual(a: string, b: string) {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) return new Response('Webhook not configured', { status: 503 });

  const payload = await req.text();
  const ok = await verify(payload, req.headers.get('stripe-signature') ?? '', secret);
  if (!ok) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(payload);
  const session = event.data?.object;
  const paid =
    (event.type === 'checkout.session.completed' && session?.payment_status === 'paid') ||
    event.type === 'checkout.session.async_payment_succeeded';

  if (paid) {
    const orderId = session.metadata?.order_id ?? session.client_reference_id;
    if (orderId) {
      try {
        await sql`
          update public.orders
             set payment_status = 'paid', stripe_session_id = ${session.id}
           where id = ${orderId} and payment_status <> 'refunded'`;
      } catch (e) {
        console.error('Could not mark order as paid', e);
        return new Response('Database error', { status: 500 }); // Stripe retries.
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
