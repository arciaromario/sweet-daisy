-- Customer reviews. One review per order, left with the order number and the email used to
-- place it, and shown on the site only after the owner approves it in /admin.
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null unique references public.orders (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  rating      int  not null check (rating between 1 and 5),
  comment     text not null check (char_length(comment) between 10 and 1000),
  products    text[] not null default '{}',
  lang        text not null default 'en' check (lang in ('en', 'es')),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at  timestamptz not null default now()
);

create index if not exists reviews_status_created_idx on public.reviews (status, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Approved reviews are public" on public.reviews;
create policy "Approved reviews are public" on public.reviews
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Customers never insert directly: the order is checked here first.
create or replace function public.submit_review(
  p_order_number text,
  p_email        text,
  p_name         text,
  p_rating       int,
  p_comment      text,
  p_lang         text default 'en'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store jsonb := (select value from public.settings where key = 'store');
  v_today date  := (now() at time zone coalesce(nullif(v_store ->> 'timezone', ''), 'America/Chicago'))::date;
  v_order public.orders%rowtype;
  v_name  text := btrim(coalesce(p_name, ''));
  v_text  text := btrim(coalesce(p_comment, ''));
begin
  select * into v_order
    from public.orders
   where upper(order_number) = upper(btrim(coalesce(p_order_number, '')))
     and lower(email) = lower(btrim(coalesce(p_email, '')))
   limit 1;

  if not found or v_order.status = 'cancelled' then
    raise exception 'We couldn''t find an order with that number and email.';
  end if;
  if v_order.fulfillment_date > v_today then
    raise exception 'You can leave a review once your order has been picked up or delivered.';
  end if;
  if exists (select 1 from public.reviews where order_id = v_order.id) then
    raise exception 'This order already has a review. Thank you!';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Please choose a rating from 1 to 5 stars.';
  end if;
  if char_length(v_text) < 10 then
    raise exception 'Please write a few words about your order.';
  end if;

  if v_name = '' then
    v_name := split_part(btrim(v_order.customer_name), ' ', 1);
  end if;

  insert into public.reviews (order_id, name, rating, comment, products, lang)
  values (
    v_order.id,
    left(v_name, 60),
    p_rating,
    left(v_text, 1000),
    coalesce((select array_agg(distinct product_slug) from public.order_items where order_id = v_order.id and product_slug is not null), '{}'),
    case when p_lang = 'es' then 'es' else 'en' end
  );
end;
$$;

revoke all on function public.submit_review(text, text, text, int, text, text) from public;
grant execute on function public.submit_review(text, text, text, int, text, text) to anon, authenticated;
