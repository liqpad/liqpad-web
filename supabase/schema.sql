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
-- Human-readable B20 units (18-decimal raw values are normalized by the market indexer).
alter table public.tokens add column if not exists burned_b20 numeric;
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
alter table public.swaps alter column amount_b20 drop not null;
alter table public.swaps alter column amount_vvv drop not null;
alter table public.swaps add column if not exists recipient text;
alter table public.swaps add column if not exists token_in text;
alter table public.swaps add column if not exists token_out text;
alter table public.swaps add column if not exists amount_in_raw numeric(78,0);
alter table public.swaps add column if not exists amount_out_raw numeric(78,0);
alter table public.swaps add column if not exists input_symbol text;
alter table public.swaps add column if not exists output_symbol text;
alter table public.swaps add column if not exists input_decimals integer;
alter table public.swaps add column if not exists output_decimals integer;
alter table public.swaps add column if not exists volume_usd numeric;
alter table public.swaps add column if not exists usd_price numeric;
alter table public.swaps add column if not exists usd_price_source text;
create index if not exists swaps_token_time_idx on public.swaps (token, block_timestamp desc);

create table if not exists public.indexer_state (
  key text primary key, last_block numeric(78,0) not null default 0,
  updated_at timestamptz not null default now(), error text
);
-- Deprecated rows are retained and explicitly classified as legacy.
update public.tokens set is_legacy=true,launch_version='legacy' where lower(factory_address) <> lower('0x7e22764f1A1CBB8B60A5Ca1D3bAed720A48AA3D2');
insert into public.indexer_state(key,last_block) values ('factory_launches:v1:0x7e22764f1a1cbb8b60a5ca1d3baed720a48aa3d2',51050148) on conflict (key) do nothing;

-- Read-only protocol transparency ledger. Every row is sourced from a confirmed Base log.
create table if not exists public.protocol_events (
  id text primary key,
  chain_id integer not null check (chain_id = 8453),
  contract_address text not null check (contract_address ~ '^0x[0-9a-fA-F]{40}$'),
  event_name text not null check (event_name in ('FeeAccrued','PlatformSwept','Harvest','UnwindBegun','UnwindProgressed','HarvestPausedSet')),
  token text, creator text,
  amount_vvv numeric(78,0), amount_diem numeric(78,0), data jsonb not null default '{}'::jsonb,
  tx_hash text not null, log_index integer not null, block_number numeric(78,0) not null,
  block_timestamp timestamptz, created_at timestamptz not null default now(),
  unique(chain_id,tx_hash,log_index)
);
create index if not exists protocol_events_block_idx on public.protocol_events (block_number desc,log_index desc);
create index if not exists protocol_events_token_idx on public.protocol_events (lower(token)) where token is not null;
create index if not exists protocol_events_name_idx on public.protocol_events (event_name,block_number desc);
insert into public.indexer_state(key,last_block) values ('protocol_events:v1:0x1a1d815dbeadcc8ce783ed001f9733280f3e2e5e',51050149) on conflict (key) do nothing;
insert into public.indexer_state(key,last_block) values ('swap_events:v1:0xf5ea55a69307cf2cf598ccb0ea947ffdc52f985e',51050148) on conflict (key) do nothing;

-- Cached launchpad-wide metrics. Values are derived only from production Factory tokens and indexed SwapRouter events.
create table if not exists public.protocol_metrics (
  id text primary key,
  total_launches integer not null default 0,
  total_volume_usd numeric,
  unique_traders integer not null default 0,
  highest_market_cap_usd numeric,
  highest_market_cap_token text,
  highest_market_cap_symbol text,
  updated_at timestamptz not null default now()
);

create table if not exists public.token_price_snapshots (
  id bigint generated always as identity primary key,
  token text not null,
  price_vvv numeric not null,
  price_usd numeric not null,
  market_cap_usd numeric not null,
  recorded_at timestamptz not null default now()
);
create index if not exists token_price_snapshots_lookup_idx on public.token_price_snapshots (lower(token),recorded_at desc);

create or replace function public.refresh_market_aggregates(production_factory text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with recent as (
    select lower(token) token_key,
      case when count(*)=count(volume_usd) then sum(volume_usd) else null end volume_usd,
      count(distinct lower(sender)) filter (where sender is not null) traders,
      count(*) transactions
    from public.swaps
    where block_timestamp >= now() - interval '24 hours'
    group by lower(token)
  )
  update public.tokens token
  set volume_24h_usd=case when recent.token_key is null then 0 else recent.volume_usd end,
      traders_24h=coalesce(recent.traders,0),
      tx_24h=coalesce(recent.transactions,0)
  from (select lower(address) token_key from public.tokens where lower(factory_address)=lower(production_factory)) eligible
  left join recent using (token_key)
  where lower(token.address)=eligible.token_key;

  with baselines as (
    select candidate.address,
      (select snapshot.price_usd from public.token_price_snapshots snapshot
       where lower(snapshot.token)=lower(candidate.address)
         and snapshot.recorded_at <= now()-interval '24 hours'
       order by snapshot.recorded_at desc limit 1) price_usd
    from public.tokens candidate
    where lower(candidate.factory_address)=lower(production_factory) and candidate.is_legacy=false
  )
  update public.tokens token
  set change_24h=case when baseline.price_usd>0 and token.price_usd is not null
    then ((token.price_usd/baseline.price_usd)-1)*100 else null end
  from baselines baseline
  where lower(token.address)=lower(baseline.address);

  insert into public.protocol_metrics(id,total_launches,total_volume_usd,unique_traders,highest_market_cap_usd,highest_market_cap_token,highest_market_cap_symbol,updated_at)
  select 'liqpad-v1',
    (select count(*) from public.tokens where lower(factory_address)=lower(production_factory) and is_legacy=false),
    case
      when exists(select 1 from public.swaps where volume_usd is null) then null
      else coalesce((select sum(volume_usd) from public.swaps),0)
    end,
    (select count(distinct lower(sender)) from public.swaps where sender is not null),
    leader.market_cap_usd,leader.address,leader.symbol,now()
  from (select 1) seed
  left join lateral (
    select market_cap_usd,address,symbol
    from public.tokens
    where lower(factory_address)=lower(production_factory) and is_legacy=false and market_cap_usd is not null
    order by market_cap_usd desc
    limit 1
  ) leader on true
  on conflict(id) do update set
    total_launches=excluded.total_launches,total_volume_usd=excluded.total_volume_usd,
    unique_traders=excluded.unique_traders,highest_market_cap_usd=excluded.highest_market_cap_usd,
    highest_market_cap_token=excluded.highest_market_cap_token,highest_market_cap_symbol=excluded.highest_market_cap_symbol,
    updated_at=excluded.updated_at;
end;
$$;

revoke all on function public.refresh_market_aggregates(text) from public,anon,authenticated;
grant execute on function public.refresh_market_aggregates(text) to service_role;

alter table public.tokens enable row level security;
alter table public.swaps enable row level security;
alter table public.indexer_state enable row level security;
alter table public.protocol_events enable row level security;
alter table public.protocol_metrics enable row level security;
alter table public.token_price_snapshots enable row level security;
drop policy if exists "public read tokens" on public.tokens;
create policy "public read tokens" on public.tokens for select using (true);
drop policy if exists "public read swaps" on public.swaps;
create policy "public read swaps" on public.swaps for select using (true);
drop policy if exists "public read indexer state" on public.indexer_state;
create policy "public read indexer state" on public.indexer_state for select using (true);
drop policy if exists "public read protocol events" on public.protocol_events;
create policy "public read protocol events" on public.protocol_events for select using (true);
drop policy if exists "public read protocol metrics" on public.protocol_metrics;
create policy "public read protocol metrics" on public.protocol_metrics for select using (true);

-- Writes intentionally have no public policy. Server sync uses SUPABASE_SERVICE_ROLE_KEY.
