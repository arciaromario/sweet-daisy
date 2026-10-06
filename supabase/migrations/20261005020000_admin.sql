-- Sweet Daisy — admin panel
-- Admin users, editable settings, admin RLS policies, product image storage, and a
-- settings-aware place_order.
--
-- To make someone an admin (after they have signed up once):
--   insert into public.admins (user_id, email)
--   select id, email from auth.users where email = 'owner@example.com';

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "Admins can see their own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Settings (business info, store rules, custom cake builder options)
-- ---------------------------------------------------------------------------

create table public.settings (
  key        text primary key check (key in ('business', 'store', 'custom')),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "Settings are public" on public.settings
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Admin-only columns
-- ---------------------------------------------------------------------------

-- 'open' re-opens a day that is normally closed (e.g. a Monday for a wedding).
alter table public.availability_overrides drop constraint availability_overrides_status_check;
alter table public.availability_overrides add constraint availability_overrides_status_check
  check (status in ('limited', 'booked', 'closed', 'open'));

alter table public.orders add column admin_notes text;
alter table public.custom_cake_requests add column quote_amount numeric(10, 2);
alter table public.custom_cake_requests add column admin_notes text;

-- The public may only create brand-new requests, never set admin fields.
drop policy "Anyone can request a custom cake" on public.custom_cake_requests;
create policy "Anyone can request a custom cake" on public.custom_cake_requests
  for insert to anon, authenticated
  with check (status = 'new' and quote_amount is null and admin_notes is null);

-- ---------------------------------------------------------------------------
-- Admin policies
-- ---------------------------------------------------------------------------

create policy "Admins manage categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage availability" on public.availability_overrides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage settings" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins read orders" on public.orders
  for select to authenticated using (public.is_admin());
create policy "Admins update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins read order items" on public.order_items
  for select to authenticated using (public.is_admin());

create policy "Admins read custom requests" on public.custom_cake_requests
  for select to authenticated using (public.is_admin());
create policy "Admins update custom requests" on public.custom_cake_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete custom requests" on public.custom_cake_requests
  for delete to authenticated using (public.is_admin());

create policy "Admins read messages" on public.contact_messages
  for select to authenticated using (public.is_admin());
create policy "Admins delete messages" on public.contact_messages
  for delete to authenticated using (public.is_admin());

create policy "Admins read subscribers" on public.newsletter_subscribers
  for select to authenticated using (public.is_admin());
create policy "Admins delete subscribers" on public.newsletter_subscribers
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: public product photos (admin-managed); admins can view inspiration uploads.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "Admins delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

create policy "Admins view cake inspiration" on storage.objects
  for select to authenticated using (bucket_id = 'cake-inspiration' and public.is_admin());

-- ---------------------------------------------------------------------------
-- place_order now reads closed days, time slots and delivery pricing from settings.
-- ---------------------------------------------------------------------------

create or replace function public.place_order(payload jsonb)
returns table (order_number text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_store        jsonb := coalesce((select s.value from public.settings s where s.key = 'store'), '{}'::jsonb);
  -- Missing setting => closed on Mondays; an explicitly empty list => open every day.
  v_closed       int[] := case when v_store ? 'closedWeekdays'
                            then array(select jsonb_array_elements_text(v_store -> 'closedWeekdays')::int)
                            else array[1] end;
  v_fee_amount   numeric := coalesce((v_store ->> 'deliveryFee')::numeric, 12);
  v_free_over    numeric := coalesce((v_store ->> 'freeDeliveryOver')::numeric, 120);
  v_slots        jsonb;
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

  if extract(dow from v_date)::int = any (v_closed)
     and not exists (select 1 from public.availability_overrides a where a.day = v_date and a.status = 'open') then
    raise exception 'The studio is closed on that day. Please choose another date.';
  end if;

  if exists (select 1 from public.availability_overrides a where a.day = v_date and a.status in ('booked', 'closed')) then
    raise exception 'That date is fully booked. Please choose another date.';
  end if;

  v_slots := v_store -> (case when v_fulfillment = 'delivery' then 'deliverySlots' else 'pickupSlots' end);
  if jsonb_typeof(v_slots) = 'array' and not (v_slots ? (payload ->> 'time_slot')) then
    raise exception 'Please choose one of the available times.';
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

  if v_fulfillment = 'delivery' and v_subtotal < v_free_over then
    v_fee := v_fee_amount;
  end if;

  update public.orders o
     set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
   where o.id = v_order_id;

  return query select v_number, v_subtotal + v_fee;
end;
$$;

revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
