import {NextResponse} from 'next/server';
import {getAddress} from 'viem';
import {normalizeAgentSlug} from '@/lib/agents';
import {agentEconomy} from '@/lib/agent-economy';
import {supabaseAdmin} from '@/lib/supabase';
import {safeErrorMessage} from '@/lib/safe-error';

export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const db=supabaseAdmin();if(!db)throw new Error('Database unavailable.');
    const {data,error}=await db.from('agents').select('agent_wallet_address,fee_splitter_address,token_address').eq('slug',normalizeAgentSlug((await params).slug)).eq('status','active').single();
    if(error||!data)return NextResponse.json({error:'Agent not found.'},{status:404});
    const economy=await agentEconomy(getAddress(data.agent_wallet_address),data.fee_splitter_address?getAddress(data.fee_splitter_address):null,data.token_address?getAddress(data.token_address):null);
    return NextResponse.json({...economy,thresholds:{gasEth:process.env.AGENT_MIN_GAS_ETH||'0.0002',inferenceUsdc:process.env.AGENT_MIN_INFERENCE_USDC||'1',claimVvv:process.env.AGENT_CLAIM_THRESHOLD_VVV||'1'},updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=0, s-maxage=15, stale-while-revalidate=30'}});
  }catch(error){console.error('Agent economy unavailable',safeErrorMessage(error));return NextResponse.json({error:'Agent economy is temporarily unavailable.'},{status:503})}
}
