-- Stripe Checkout: remember the session that paid (or is paying) each order.
alter table public.orders add column if not exists stripe_session_id text;
