-- Private runtime accounting for holder-gated agent chat and autonomous upkeep.
create table if not exists public.agent_chat_usage (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  wallet_address text not null check (wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  request_id text not null unique,
  usage_day date not null default (now() at time zone 'utc')::date,
  prompt_hash text not null,
  prompt text not null,
  response text,
  status text not null default 'reserved' check (status in ('reserved','completed','failed')),
  cost_micro_usd bigint,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists agent_chat_daily_idx on public.agent_chat_usage(agent_id, lower(wallet_address), usage_day);

create table if not exists public.agent_automation_events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  action text not null check (action in ('claim','swap_eth','swap_usdc','venice_topup')),
  idempotency_key text not null unique,
  status text not null check (status in ('pending','submitted','confirmed','failed')),
  tx_hash text,
  amount_in numeric,
  amount_out numeric,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_automation_agent_idx on public.agent_automation_events(agent_id, created_at desc);

-- Atomic daily reservation prevents concurrent requests from exceeding ten messages.
create or replace function public.reserve_agent_chat(
  p_agent_id uuid, p_wallet_address text, p_request_id text, p_prompt_hash text, p_prompt text
) returns boolean language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  if exists(select 1 from agent_chat_usage where request_id=p_request_id) then return false; end if;
  select count(*) into n from agent_chat_usage
   where agent_id=p_agent_id and lower(wallet_address)=lower(p_wallet_address)
     and usage_day=(now() at time zone 'utc')::date and status <> 'failed';
  if n >= 10 then return false; end if;
  insert into agent_chat_usage(agent_id,wallet_address,request_id,prompt_hash,prompt)
  values(p_agent_id,p_wallet_address,p_request_id,p_prompt_hash,left(p_prompt,600));
  return true;
end $$;

revoke all on function public.reserve_agent_chat(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.reserve_agent_chat(uuid,text,text,text,text) to service_role;
alter table public.agent_chat_usage enable row level security;
alter table public.agent_automation_events enable row level security;
-- No public policies: prompts, responses, wallet IDs and operational failures remain server-only.
