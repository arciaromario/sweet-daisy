-- Sweet Daisy — Cakes and Treats
-- Initial schema: catalogue, availability, orders, custom cake requests, newsletter and contact.
--
-- Security model
--   * The catalogue and availability are publicly readable.
--   * Orders can only be created through the `place_order` function, which re-prices every
--     line from the products table, so a tampered cart cannot change what the customer pays.
--   * Signed-in customers can read their own orders. Everything else is write-only for the public
--     and is managed from the Supabase dashboard (service role).


-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table public.categories (
  id          text primary key,
  name        text not null,
  blurb       text not null default '',
  sort        int  not null default 0
);

create table public.products (
  slug          text primary key,
  name          text not null,
  category      text not null references public.categories (id),
  short         text not null default '',
  description   text not null default '',
  images        jsonb not null default '[]'::jsonb,   -- ["photo-key" | "/images/x.jpg" | "https://..."]
  sizes         jsonb not null default '[]'::jsonb,   -- [{id,label,servings,price}]
  flavors       jsonb not null default '[]'::jsonb,   -- [{label,price}]
  decorations   jsonb not null default '[]'::jsonb,   -- [{id,label,price}]
  allow_message boolean not null default false,
  lead_days     int not null default 1 check (lead_days >= 0),
  badge         text,
  bestseller    boolean not null default false,
  details       jsonb not null default '[]'::jsonb,   -- [{label,value}]
  tint          text not null default '#F4EDE1',
  sort          int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index products_category_idx on public.products (category) where active;

-- Dates the studio is fully booked, has limited capacity, or is closed.
create table public.availability_overrides (
  day     date primary key,
  status  text not null check (status in ('limited', 'booked', 'closed')),
  note    text
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create sequence public.order_number_seq start 10001;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique default ('SD-' || nextval('public.order_number_seq')),
  user_id           uuid references auth.users (id) on delete set null,
  status            text not null default 'received'
                      check (status in ('received', 'confirmed', 'baking', 'ready', 'completed', 'cancelled')),
  customer_name     text not null,
  email             text not null,
  phone             text not null,
  fulfillment       text not null check (fulfillment in ('pickup', 'delivery')),
  address           jsonb,
  fulfillment_date  date not null,
  time_slot         text not null,
  instructions      text,
  payment_method    text not null check (payment_method in ('card', 'in_person')),
  payment_status    text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  subtotal          numeric(10, 2) not null,
  delivery_fee      numeric(10, 2) not null default 0,
  total             numeric(10, 2) not null,
  created_at        timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_date_idx on public.orders (fulfillment_date);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_slug  text not null references public.products (slug),
  product_name  text not null,
  size_label    text not null,
  flavor        text,
  decoration    text,
  message       text,
  notes         text,
  quantity      int not null check (quantity between 1 and 50),
  unit_price    numeric(10, 2) not null,
  line_total    numeric(10, 2) not null
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Custom cakes, newsletter, contact
-- ---------------------------------------------------------------------------

create table public.custom_cake_requests (
  id                uuid primary key default gen_random_uuid(),
  size              text not null,
  flavor            text not null,
  filling           text not null,
  frosting          text not null,
  decoration_style  text not null,
  inspiration_paths text[] not null default '{}',   -- objects in the `cake-inspiration` bucket
  event_date        date not null,
  occasion          text,
  instructions      text,
  name              text not null,
  email             text not null,
  phone             text,
  status            text not null default 'new' check (status in ('new', 'quoted', 'confirmed', 'declined')),
  created_at        timestamptz not null default now()
);

create table public.newsletter_subscribers (
  email       text primary key check (position('@' in email) > 1),
  created_at  timestamptz not null default now()
);

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  topic       text,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.availability_overrides enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.custom_cake_requests   enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages       enable row level security;

create policy "Categories are public" on public.categories
  for select to anon, authenticated using (true);

create policy "Active products are public" on public.products
  for select to anon, authenticated using (active);

create policy "Availability is public" on public.availability_overrides
  for select to anon, authenticated using (true);

create policy "Customers read their own orders" on public.orders
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Customers read their own order items" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

create policy "Anyone can request a custom cake" on public.custom_cake_requests
  for insert to anon, authenticated with check (status = 'new');

create policy "Anyone can join the newsletter" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

create policy "Anyone can send a message" on public.contact_messages
  for insert to anon, authenticated with check (true);

-- ---------------------------------------------------------------------------
-- place_order: validates the cart and the date, prices it server-side and stores it.
-- ---------------------------------------------------------------------------

create or replace function public.place_order(payload jsonb)
returns table (order_number text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_order_id     uuid;
  v_number       text;
  v_item         jsonb;
  v_product      public.products%rowtype;
  v_size         jsonb;
  v_flavor_price numeric;
  v_deco_price   numeric;
  v_unit         numeric;
  v_qty          int;
  v_subtotal     numeric := 0;
  v_fee          numeric := 0;
  v_max_lead     int := 0;
  v_date         date := (payload ->> 'fulfillment_date')::date;
  v_fulfillment  text := payload ->> 'fulfillment';
begin
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'Your bag is empty.';
  end if;

  if extract(isodow from v_date) = 1 then
    raise exception 'We are closed on Mondays. Please choose another date.';
  end if;

  if exists (select 1 from public.availability_overrides a where a.day = v_date and a.status in ('booked', 'closed')) then
    raise exception 'That date is fully booked. Please choose another date.';
  end if;

  insert into public.orders (
    user_id, customer_name, email, phone, fulfillment, address, fulfillment_date, time_slot,
    instructions, payment_method, subtotal, delivery_fee, total
  ) values (
    auth.uid(),
    payload ->> 'customer_name',
    lower(payload ->> 'email'),
    payload ->> 'phone',
    v_fulfillment,
    case when v_fulfillment = 'delivery' then payload -> 'address' else null end,
    v_date,
    payload ->> 'time_slot',
    nullif(payload ->> 'instructions', ''),
    payload ->> 'payment_method',
    0, 0, 0
  )
  returning id, orders.order_number into v_order_id, v_number;

  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    select * into v_product from public.products p where p.slug = v_item ->> 'slug' and p.active;
    if not found then
      raise exception 'A product in your bag is no longer available.';
    end if;

    select s into v_size from jsonb_array_elements(v_product.sizes) s where s ->> 'id' = v_item ->> 'size_id';
    if v_size is null then
      raise exception 'Please choose a valid size for %.', v_product.name;
    end if;

    select coalesce((f ->> 'price')::numeric, 0) into v_flavor_price
      from jsonb_array_elements(v_product.flavors) f where f ->> 'label' = v_item ->> 'flavor';
    select coalesce((d ->> 'price')::numeric, 0) into v_deco_price
      from jsonb_array_elements(v_product.decorations) d where d ->> 'id' = v_item ->> 'decoration_id';

    v_qty  := greatest(1, least(50, coalesce((v_item ->> 'quantity')::int, 1)));
    v_unit := (v_size ->> 'price')::numeric + coalesce(v_flavor_price, 0) + coalesce(v_deco_price, 0);
    v_subtotal := v_subtotal + v_unit * v_qty;
    v_max_lead := greatest(v_max_lead, v_product.lead_days);

    insert into public.order_items (
      order_id, product_slug, product_name, size_label, flavor, decoration, message, notes,
      quantity, unit_price, line_total
    ) values (
      v_order_id, v_product.slug, v_product.name, v_size ->> 'label',
      nullif(v_item ->> 'flavor', ''),
      (select d ->> 'label' from jsonb_array_elements(v_product.decorations) d where d ->> 'id' = v_item ->> 'decoration_id'),
      left(nullif(v_item ->> 'message', ''), 60),
      left(nullif(v_item ->> 'notes', ''), 500),
      v_qty, v_unit, v_unit * v_qty
    );
  end loop;

  if v_date < current_date + v_max_lead then
    raise exception 'Some items need % days notice. Please choose a later date.', v_max_lead;
  end if;

  if v_fulfillment = 'delivery' and v_subtotal < 120 then
    v_fee := 12;
  end if;

  update public.orders o
     set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
   where o.id = v_order_id;

  return query select v_number, v_subtotal + v_fee;
end;
$$;

revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: inspiration images uploaded from the custom cake builder (private bucket).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cake-inspiration', 'cake-inspiration', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "Anyone can upload cake inspiration" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'cake-inspiration');
