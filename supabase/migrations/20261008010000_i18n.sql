-- Optional Spanish copy for products and categories. English stays in the main columns and is
-- always the fallback, e.g. products.i18n = {"es": {"name": "…", "short": "…", "sizes": {"pack2": {"label": "…"}}}}.
alter table public.products add column if not exists i18n jsonb not null default '{}'::jsonb;
alter table public.categories add column if not exists i18n jsonb not null default '{}'::jsonb;
