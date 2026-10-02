import {NextResponse} from 'next/server';
import {getAddress} from 'viem';
import {hasLaunchedAgentEconomy,normalizeAgentSlug} from '@/lib/agents';
import {agentEconomy} from '@/lib/agent-economy';
import {supabaseAdmin} from '@/lib/supabase';
import {safeErrorMessage} from '@/lib/safe-error';
import {getVeniceBalance} from '@/lib/venice-x402';

export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const db=supabaseAdmin();if(!db)throw new Error('Database unavailable.');
    const {data,error}=await db.from('agents').select('agent_wallet_address,fee_splitter_address,token_address,status,agent_wallet_bindings(privy_wallet_id)').eq('slug',normalizeAgentSlug((await params).slug)).maybeSingle();
    if(error)throw new Error(error.message);
    if(!data||!hasLaunchedAgentEconomy(data.status,data.token_address))return NextResponse.json({error:'Agent economy is not available before token launch.'},{status:404});
    const wallet=getAddress(data.agent_wallet_address),binding=Array.isArray(data.agent_wallet_bindings)?data.agent_wallet_bindings[0]:data.agent_wallet_bindings;
    const [economy,venice]=await Promise.all([agentEconomy(wallet,data.fee_splitter_address?getAddress(data.fee_splitter_address):null,data.token_address?getAddress(data.token_address):null),binding?.privy_wallet_id?getVeniceBalance(binding.privy_wallet_id,wallet).catch(()=>null):Promise.resolve(null)]);
    const inferenceLow=venice?.canConsume===true?false:economy.inferenceLow;
    return NextResponse.json({...economy,inferenceLow,venice,thresholds:{gasEth:process.env.AGENT_MIN_GAS_ETH||'0.0002',inferenceUsdc:process.env.AGENT_MIN_INFERENCE_USDC||'1',claimVvv:process.env.AGENT_CLAIM_THRESHOLD_VVV||'1'},updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=0, s-maxage=15, stale-while-revalidate=30'}});
  }catch(error){console.error('Agent economy unavailable',safeErrorMessage(error));return NextResponse.json({error:'Agent economy is temporarily unavailable.'},{status:503})}
}
