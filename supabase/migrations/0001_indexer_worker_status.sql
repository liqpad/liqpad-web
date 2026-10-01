create table if not exists public.indexer_workers (
  id text primary key,
  status text not null check (status in ('starting','running','degraded','stopping')),
  last_heartbeat_at timestamptz not null default now(),
  last_success_at timestamptz,
  last_error text,
  result jsonb,
  updated_at timestamptz not null default now()
);

alter table public.indexer_workers enable row level security;
drop policy if exists "public read indexer workers" on public.indexer_workers;
create policy "public read indexer workers" on public.indexer_workers for select using (true);

-- There is intentionally no public write policy. The VPS uses the service role.
