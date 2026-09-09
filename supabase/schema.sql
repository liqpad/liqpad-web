create extension if not exists pgcrypto;

create table if not exists public.tokens (
  address text primary key check (address ~ '^0x[0-9a-fA-F]{40}$'),
  factory_address text check (factory_address ~ '^0x[0-9a-fA-F]{40}$'),
  creator text not null check (creator ~ '^0x[0-9a-fA-F]{40}$'),
  pool_id text not null,
  profile_hash text not null,
  block_number numeric(78,0) not null,
  block_timestamp timestamptz,
  tx_hash text,
  name text not null default '', symbol text not null default '', image text not null default '',
  description text not null default '', website text not null default '', twitter text not null default '',
  telegram text not null default '', farcaster text not null default '', discord text not null default '', contract_uri text not null default '',
  price_vvv numeric, price_usd numeric, market_cap_usd numeric, volume_24h_usd numeric,
  change_24h numeric, traders_24h integer, tx_24h integer, holders integer, burned_b20 numeric,
  quote_frame integer, quote_valid_until timestamptz, quote_digest text,
  launch_version text not null default 'legacy', is_legacy boolean not null default true,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
alter table public.tokens add column if not exists factory_address text;
alter table public.tokens add column if not exists quote_frame integer;
alter table public.tokens add column if not exists quote_valid_until timestamptz;
alter table public.tokens add column if not exists quote_digest text;
alter table public.tokens add column if not exists launch_version text not null default 'legacy';
alter table public.tokens add column if not exists is_legacy boolean not null default true;
create index if not exists tokens_creator_idx on public.tokens (lower(creator));
create index if not exists tokens_factory_idx on public.tokens (lower(factory_address));
create index if not exists tokens_block_idx on public.tokens (block_number desc);
create index if not exists tokens_volume_idx on public.tokens (volume_24h_usd desc nulls last);
create unique index if not exists tokens_tx_hash_idx on public.tokens (lower(tx_hash)) where tx_hash is not null;

create table if not exists public.swaps (
  id text primary key, token text not null references public.tokens(address) on delete cascade,
  tx_hash text not null, log_index integer not null, block_number numeric(78,0) not null,
  block_timestamp timestamptz, sender text, amount_b20 numeric not null, amount_vvv numeric not null,
  side text check (side in ('buy','sell')), created_at timestamptz not null default now()
);
create index if not exists swaps_token_time_idx on public.swaps (token, block_timestamp desc);

create table if not exists public.indexer_state (
  key text primary key, last_block numeric(78,0) not null default 0,
  updated_at timestamptz not null default now(), error text
);
-- Deprecated rows are retained and explicitly classified as legacy.
update public.tokens set is_legacy=true,launch_version='legacy' where lower(factory_address) <> lower('0x7e22764f1A1CBB8B60A5Ca1D3bAed720A48AA3D2');
insert into public.indexer_state(key,last_block) values ('factory_launches:v1:0x7e22764f1a1cbb8b60a5ca1d3baed720a48aa3d2',51050148) on conflict (key) do nothing;

alter table public.tokens enable row level security;
alter table public.swaps enable row level security;
alter table public.indexer_state enable row level security;
drop policy if exists "public read tokens" on public.tokens;
create policy "public read tokens" on public.tokens for select using (true);
drop policy if exists "public read swaps" on public.swaps;
create policy "public read swaps" on public.swaps for select using (true);
drop policy if exists "public read indexer state" on public.indexer_state;
create policy "public read indexer state" on public.indexer_state for select using (true);

-- Writes intentionally have no public policy. Server sync uses SUPABASE_SERVICE_ROLE_KEY.
