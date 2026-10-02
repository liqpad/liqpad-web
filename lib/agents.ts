import {getAddress,isAddress,keccak256,stringToHex,type Address,type Hex} from 'viem';

export const AGENT_HUMAN_FEE_BPS=3_000;
export const AGENT_TREASURY_FEE_BPS=4_000;
export const AGENT_PROTOCOL_FEE_BPS=3_000;

export type AgentStatus='draft'|'wallet_ready'|'splitter_ready'|'launch_pending'|'active'|'failed';

export function hasLaunchedAgentEconomy(status:AgentStatus|string,tokenAddress:string|null|undefined){
  return status!=='draft'&&Boolean(tokenAddress);
}
export type AgentVitality='unlaunched'|'active'|'conserving'|'low_compute'|'dormant';

export type PublicAgent={
  id:string;agent_id:Hex;slug:string;name:string;symbol:string;avatar_url:string|null;description:string;
  mission:string;personality:string;communication_style:string|null;website:string|null;twitter:string|null;
  human_creator:Address;agent_wallet_address:Address;fee_splitter_address:Address|null;token_address:Address|null;
  status:AgentStatus;vitality:AgentVitality;created_at:string;updated_at:string;
};

export function normalizeAgentSlug(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-').slice(0,48)}
export function agentIdFor(id:string):Hex{return keccak256(stringToHex(`liqpad-agent:${id}`))}
export function validAgentAddress(value:unknown):value is Address{return typeof value==='string'&&isAddress(value)&&getAddress(value)!=='0x0000000000000000000000000000000000000000'}
export function vitalityForVolume(volumeUsd:number):AgentVitality{
  if(volumeUsd>=10_000)return'active';
  if(volumeUsd>=1_000)return'conserving';
  if(volumeUsd>0)return'low_compute';
  return'dormant';
}
