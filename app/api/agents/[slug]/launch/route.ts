import {NextResponse} from 'next/server';
import {getAddress,isAddress,isHash,type Hex} from 'viem';
import {normalizeAgentSlug} from '@/lib/agents';
import {requirePrivyUser} from '@/lib/privy-server';
import {supabaseAdmin} from '@/lib/supabase';
import {publicClient} from '@/lib/data';
import {ADDRESSES} from '@/lib/constants';
import {factoryAbi} from '@/src/abi/factory';
import {agentFeeSplitterAbi} from '@/src/abi/agentFeeSplitter';

export async function POST(req:Request,{params}:{params:Promise<{slug:string}>}){
  let auth:{user_id:string};try{auth=await requirePrivyUser(req)}catch{return NextResponse.json({error:'Unauthorized.'},{status:401})}
  const db=supabaseAdmin();if(!db)return NextResponse.json({error:'Agent database is not configured.'},{status:503});
  try{
    const slug=normalizeAgentSlug((await params).slug);const {data:agent,error}=await db.from('agents').select('*').eq('slug',slug).single();if(error||!agent)return NextResponse.json({error:'Agent not found.'},{status:404});const {data:binding}=await db.from('agent_wallet_bindings').select('agent_id').eq('agent_id',agent.id).eq('owner_privy_user_id',auth.user_id).maybeSingle();if(!binding)return NextResponse.json({error:'Only the registered agent owner can confirm this launch.'},{status:403});
    const body=await req.json();if(!isAddress(body.token)||!isAddress(body.splitter)||!isHash(body.splitterTxHash)||!isHash(body.launchTxHash))return NextResponse.json({error:'Invalid launch confirmation.'},{status:400});
    const token=getAddress(body.token),splitter=getAddress(body.splitter);const [splitReceipt,launchReceipt,isLaunch,profile,splitToken,human,treasury]=await Promise.all([
      publicClient.getTransactionReceipt({hash:body.splitterTxHash as Hex}),publicClient.getTransactionReceipt({hash:body.launchTxHash as Hex}),
      publicClient.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'isLiqpadLaunch',args:[token]}),publicClient.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'getProfile',args:[token]}),
      publicClient.readContract({address:splitter,abi:agentFeeSplitterAbi,functionName:'token'}),publicClient.readContract({address:splitter,abi:agentFeeSplitterAbi,functionName:'humanCreator'}),publicClient.readContract({address:splitter,abi:agentFeeSplitterAbi,functionName:'agentTreasury'}),
    ]);
    if(splitReceipt.status!=='success'||launchReceipt.status!=='success'||!isLaunch||getAddress(profile.creator)!==splitter||getAddress(splitToken)!==token||getAddress(human)!==getAddress(agent.human_creator)||getAddress(treasury)!==getAddress(agent.agent_wallet_address))throw new Error('On-chain agent launch verification failed.');
    const {data,error:updateError}=await db.from('agents').update({token_address:token,fee_splitter_address:splitter,splitter_tx_hash:body.splitterTxHash,launch_tx_hash:body.launchTxHash,status:'active',vitality:'dormant',updated_at:new Date().toISOString()}).eq('id',agent.id).select('slug,token_address,fee_splitter_address,status').single();if(updateError)throw updateError;
    return NextResponse.json({agent:data});
  }catch(cause){return NextResponse.json({error:cause instanceof Error?cause.message:'Agent launch confirmation failed.'},{status:422})}
}
