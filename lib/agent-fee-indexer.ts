import {decodeEventLog,getAddress,type Address} from 'viem';
import {publicClient} from '@/lib/data';
import {ADDRESSES,AGENT_FEE_INDEXER_KEY} from '@/lib/constants';
import {supabaseAdmin} from '@/lib/supabase';
import {agentFeeSplitterAbi,agentFeeSplitterFactoryAbi} from '@/src/abi/agentFeeSplitter';

const CONFIRMATIONS=12n;
export async function syncAgentFeeEvents(latestBlock?:bigint){
  const db=supabaseAdmin();if(!db)throw new Error('Supabase service role is not configured.');const tip=latestBlock??await publicClient.getBlockNumber();const confirmed=tip>CONFIRMATIONS?tip-CONFIRMATIONS:0n;
  const {data:state,error:stateError}=await db.from('indexer_state').select('last_block').eq('key',AGENT_FEE_INDEXER_KEY).maybeSingle();if(stateError)throw new Error(stateError.message);
  const configured=process.env.AGENT_FEE_SPLITTER_START_BLOCK;let last=BigInt(state?.last_block||0);let next=last>0n?last+1n:configured&&/^\d+$/.test(configured)?BigInt(configured):confirmed;
  const batchSize=Math.max(1,Math.min(2_000,Number(process.env.INDEXER_BLOCK_BATCH_SIZE||10)));const maxBatches=Math.max(1,Math.min(100,Number(process.env.INDEXER_MAX_BATCHES||20)));let synced=0,batches=0;
  while(next<=confirmed&&batches<maxBatches){const end=next+BigInt(batchSize-1)>confirmed?confirmed:next+BigInt(batchSize-1);const {data:agents,error:agentError}=await db.from('agents').select('fee_splitter_address').not('fee_splitter_address','is',null);if(agentError)throw new Error(agentError.message);const splitters=(agents||[]).map(row=>row.fee_splitter_address).filter(Boolean).map(getAddress) as Address[];const addresses=[ADDRESSES.agentFeeSplitterFactory,...splitters];const logs=await publicClient.getLogs({address:addresses,fromBlock:next,toBlock:end});const blocks=new Map<bigint,string>();
    for(const log of logs){try{if(getAddress(log.address)===ADDRESSES.agentFeeSplitterFactory){const decoded=decodeEventLog({abi:agentFeeSplitterFactoryAbi,data:log.data,topics:log.topics});if(decoded.eventName!=='AgentFeeSplitterCreated')continue;const args=decoded.args;const updatedAt=new Date().toISOString();const {error:addressError}=await db.from('agents').update({fee_splitter_address:args.splitter.toLowerCase(),updated_at:updatedAt}).eq('agent_id',args.agentId);if(addressError)throw new Error(addressError.message);
      // The splitter event can be indexed after launch confirmation. Only pre-launch
      // rows may advance to splitter_ready; a row with a token must never be
      // downgraded from active by an older event.
      const {error:statusError}=await db.from('agents').update({status:'splitter_ready',updated_at:updatedAt}).eq('agent_id',args.agentId).is('token_address',null).neq('status','active');if(statusError)throw new Error(statusError.message);synced++;continue}const decoded=decodeEventLog({abi:agentFeeSplitterAbi,data:log.data,topics:log.topics});if(decoded.eventName!=='AgentFeesDistributed')continue;let timestamp=blocks.get(log.blockNumber);if(!timestamp){const block=await publicClient.getBlock({blockNumber:log.blockNumber});timestamp=new Date(Number(block.timestamp)*1000).toISOString();blocks.set(log.blockNumber,timestamp)}const args=decoded.args;const {error}=await db.from('agent_fee_distributions').upsert({tx_hash:log.transactionHash,log_index:log.logIndex,block_number:log.blockNumber.toString(),block_timestamp:timestamp,splitter:log.address.toLowerCase(),token:args.token.toLowerCase(),human_creator:args.humanCreator.toLowerCase(),agent_treasury:args.agentTreasury.toLowerCase(),total_amount:args.totalAmount.toString(),human_amount:args.humanAmount.toString(),agent_amount:args.agentAmount.toString()},{onConflict:'tx_hash,log_index'});if(error)throw new Error(error.message);synced++}catch(cause){if(cause instanceof Error&&/Supabase|column|relation|permission|duplicate/i.test(cause.message))throw cause}}
    last=end;batches++;const {error}=await db.from('indexer_state').upsert({key:AGENT_FEE_INDEXER_KEY,last_block:last.toString(),updated_at:new Date().toISOString(),error:null});if(error)throw new Error(error.message);next=end+1n;
  }
  return{synced,batches,lastBlock:last.toString(),latestBlock:tip.toString(),confirmedBlock:confirmed.toString(),caughtUp:last>=confirmed};
}
