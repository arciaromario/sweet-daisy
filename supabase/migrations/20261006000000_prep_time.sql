-- Average preparation time per product (hours), set from /admin and shown to customers.
alter table public.products
  add column if not exists prep_hours numeric(6, 1) check (prep_hours is null or prep_hours >= 0);
