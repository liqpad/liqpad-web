-- Repair launched agents affected by delayed AgentFeeSplitterCreated indexing.
-- A token address is only stored after the launch route verifies the Factory,
-- splitter, token, creator and treasury on-chain.
update public.agents
set status='active', updated_at=now()
where token_address is not null
  and fee_splitter_address is not null
  and status <> 'active';
