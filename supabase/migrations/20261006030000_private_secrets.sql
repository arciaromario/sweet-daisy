-- Server-side settings for Edge Functions (read through SUPABASE_DB_URL).
-- The private schema is not exposed by the Data API, and API roles get no access.
-- Values here are a fallback for Edge Function secrets of the same name.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_secrets (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
revoke all on private.app_secrets from public, anon, authenticated;
