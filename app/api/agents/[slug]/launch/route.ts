import {NextResponse} from 'next/server';
import {decodeEventLog,getAddress,isAddress,isHash,type Address,type Hex} from 'viem';
import {normalizeAgentSlug} from '@/lib/agents';
import {requirePrivyUser} from '@/lib/privy-server';
import {supabaseAdmin} from '@/lib/supabase';
import {serverPublicClient} from '@/lib/server-public-client';
import {ADDRESSES} from '@/lib/constants';
import {factoryAbi} from '@/src/abi/factory';
import {agentFeeSplitterAbi,agentFeeSplitterFactoryAbi} from '@/src/abi/agentFeeSplitter';
import {confirmLaunchTransaction} from '@/lib/launch-indexer';
import {isPendingReceiptError,logSafeError} from '@/lib/safe-error';

function tokenFromLaunchReceipt(logs:readonly {address:Address;data:Hex;topics:readonly Hex[]}[]) {
  for(const log of logs){
    if(getAddress(log.address)!==ADDRESSES.factory)continue;
    try{
      const decoded=decodeEventLog({abi:factoryAbi,eventName:'Launch',data:log.data,topics:log.topics as []|[Hex,...Hex[]]});
      return getAddress(decoded.args.token);
    }catch{/* Ignore unrelated Factory logs. */}
  }
  throw new Error('The transaction does not contain a Liqpad Launch event.');
}

export async function POST(req:Request,{params}:{params:Promise<{slug:string}>}){
  let auth:{user_id:string};
  try{auth=await requirePrivyUser(req)}catch{return NextResponse.json({error:'Unauthorized.'},{status:401})}
  const db=supabaseAdmin();
  if(!db)return NextResponse.json({error:'Agent database is not configured.'},{status:503});
  try{
    const slug=normalizeAgentSlug((await params).slug);
    const {data:agent,error}=await db.from('agents').select('*').eq('slug',slug).single();
    if(error||!agent)return NextResponse.json({error:'Agent not found.'},{status:404});
    const {data:binding}=await db.from('agent_wallet_bindings').select('agent_id').eq('agent_id',agent.id).eq('owner_privy_user_id',auth.user_id).maybeSingle();
    if(!binding)return NextResponse.json({error:'Only the registered agent owner can confirm this launch.'},{status:403});

    const body=await req.json();
    if(typeof body.launchTxHash!=='string'||!isHash(body.launchTxHash))return NextResponse.json({error:'A valid agent token transaction hash is required.'},{status:400});
    if(body.splitterTxHash!==undefined&&(typeof body.splitterTxHash!=='string'||!isHash(body.splitterTxHash)))return NextResponse.json({error:'Invalid splitter transaction hash.'},{status:400});

    const launchTxHash=body.launchTxHash as Hex;
    const launchReceipt=await serverPublicClient.getTransactionReceipt({hash:launchTxHash});
    if(launchReceipt.status!=='success')throw new Error('The agent token transaction was not successful.');
    const token=tokenFromLaunchReceipt(launchReceipt.logs);
    if(body.token!==undefined&&(!isAddress(body.token)||getAddress(body.token)!==token))throw new Error('The supplied token does not match the Launch event.');

    const predictedSplitter=await serverPublicClient.readContract({address:ADDRESSES.agentFeeSplitterFactory,abi:agentFeeSplitterFactoryAbi,functionName:'predictSplitter',args:[agent.agent_id as Hex,token,getAddress(agent.human_creator),getAddress(agent.agent_wallet_address)]});
    const splitter=getAddress(predictedSplitter);
    if(body.splitter!==undefined&&(!isAddress(body.splitter)||getAddress(body.splitter)!==splitter))throw new Error('The supplied splitter does not match the agent configuration.');

    const [isLaunch,profile,splitToken,human,treasury]=await Promise.all([
      serverPublicClient.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'isLiqpadLaunch',args:[token]}),
      serverPublicClient.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'getProfile',args:[token]}),
      serverPublicClient.readContract({address:splitter,abi:agentFeeSplitterAbi,functionName:'token'}),
      serverPublicClient.readContract({address:splitter,abi:agentFeeSplitterAbi,functionName:'humanCreator'}),
      serverPublicClient.readContract({address:splitter,abi:agentFeeSplitterAbi,functionName:'agentTreasury'}),
    ]);
    if(!isLaunch||getAddress(profile.creator)!==splitter||getAddress(splitToken)!==token||getAddress(human)!==getAddress(agent.human_creator)||getAddress(treasury)!==getAddress(agent.agent_wallet_address))throw new Error('On-chain agent launch verification failed.');

    if(body.splitterTxHash){const splitReceipt=await serverPublicClient.getTransactionReceipt({hash:body.splitterTxHash as Hex});if(splitReceipt.status!=='success')throw new Error('The fee splitter transaction was not successful.');}

    await confirmLaunchTransaction(launchTxHash,token);
    const update={token_address:token.toLowerCase(),fee_splitter_address:splitter.toLowerCase(),splitter_tx_hash:body.splitterTxHash||agent.splitter_tx_hash||null,launch_tx_hash:launchTxHash,status:'active',vitality:'dormant',updated_at:new Date().toISOString()};
    const {data,error:updateError}=await db.from('agents').update(update).eq('id',agent.id).select('slug,token_address,fee_splitter_address,status').single();
    if(updateError)throw updateError;
    return NextResponse.json({agent:data,recovered:!body.token});
  }catch(cause){
    const pending=isPendingReceiptError(cause);logSafeError('Agent launch confirmation failed',cause);
    return NextResponse.json({error:pending?'Transaction receipt is not available yet.':'Agent launch verification is temporarily unavailable. No transaction was resubmitted.'},{status:pending?409:422});
  }
}
