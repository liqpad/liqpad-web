+-- Liqpad agent registry and fee-splitter accounting.
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null unique check (agent_id ~ '^0x[0-9a-fA-F]{64}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 64),
  symbol text not null check (symbol ~ '^[A-Z0-9]{2,12}$'),
  avatar_url text,
  description text not null,
  mission text not null,
  personality text not null,
  communication_style text,
  website text,
  twitter text,
  human_creator text not null check (human_creator ~ '^0x[0-9a-fA-F]{40}$'),
  agent_wallet_address text not null check (agent_wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  fee_splitter_address text check (fee_splitter_address is null or fee_splitter_address ~ '^0x[0-9a-fA-F]{40}$'),
  token_address text unique check (token_address is null or token_address ~ '^0x[0-9a-fA-F]{40}$'),
  status text not null default 'wallet_ready' check (status in ('draft','wallet_ready','splitter_ready','launch_pending','active','failed')),
  vitality text not null default 'unlaunched' check (vitality in ('unlaunched','active','conserving','low_compute','dormant')),
  splitter_tx_hash text,
  launch_tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_token_idx on public.agents(lower(token_address));

-- Privy wallet IDs are operational identifiers and are deliberately not exposed through public.agents.
create table if not exists public.agent_wallet_bindings (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  owner_privy_user_id text not null,
  privy_wallet_id text not null unique,
  external_id text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists agent_wallet_owner_idx on public.agent_wallet_bindings(owner_privy_user_id, created_at desc);

create table if not exists public.agent_fee_distributions (
  tx_hash text not null,
  log_index integer not null,
  block_number numeric not null,
  block_timestamp timestamptz,
  splitter text not null,
  token text not null,
  human_creator text not null,
  agent_treasury text not null,
  total_amount numeric not null,
  human_amount numeric not null,
  agent_amount numeric not null,
  primary key(tx_hash, log_index)
);

create index if not exists agent_fee_splitter_idx on public.agent_fee_distributions(lower(splitter), block_number desc);
create index if not exists agent_fee_token_idx on public.agent_fee_distributions(lower(token), block_number desc);

alter table public.agents enable row level security;
alter table public.agent_wallet_bindings enable row level security;
alter table public.agent_fee_distributions enable row level security;

drop policy if exists "public read agents" on public.agents;
create policy "public read agents" on public.agents for select using (status <> 'draft');
drop policy if exists "public read agent fee distributions" on public.agent_fee_distributions;
create policy "public read agent fee distributions" on public.agent_fee_distributions for select using (true);

-- No public policy is created for wallet bindings or writes. Server routes use service_role.
