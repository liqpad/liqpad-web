import 'server-only';
import {decodeEventLog,type Hex} from 'viem';
import {publicClient} from '@/lib/data';
import {ADDRESSES,FEE_ROUTER_START_BLOCK,PROTOCOL_INDEXER_KEY} from '@/lib/constants';
import {supabaseAdmin} from '@/lib/supabase';
import {protocolEventsAbi} from '@/src/abi/diemEngine';

const CONFIRMATIONS=12n;
const jsonValue=(value:unknown):unknown=>typeof value==='bigint'?value.toString():Array.isArray(value)?value.map(jsonValue):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,jsonValue(v)])):value;

export async function syncProtocolEvents(latestBlock?:bigint){
  const db=supabaseAdmin();if(!db)throw new Error('Supabase service role is not configured.');
  const tip=latestBlock??await publicClient.getBlockNumber();
  const confirmed=tip>CONFIRMATIONS?tip-CONFIRMATIONS:0n;
  const {data:state,error:stateError}=await db.from('indexer_state').select('last_block').eq('key',PROTOCOL_INDEXER_KEY).maybeSingle();
  if(stateError)throw new Error(stateError.message);
  const configuredStart=process.env.DIEM_ENGINE_START_BLOCK;
  const startBlock=configuredStart&&/^\d+$/.test(configuredStart)?BigInt(configuredStart):FEE_ROUTER_START_BLOCK;
  let last=BigInt(state?.last_block||0);let next=last>0n?last+1n:startBlock;
  const batchSize=Math.max(1,Math.min(2_000,Number(process.env.INDEXER_BLOCK_BATCH_SIZE||10)));
  const maxBatches=Math.max(1,Math.min(100,Number(process.env.INDEXER_MAX_BATCHES||20)));
  let synced=0,batches=0;
  while(next<=confirmed&&batches<maxBatches){
    const end=next+BigInt(batchSize-1)>confirmed?confirmed:next+BigInt(batchSize-1);
    const logs=await publicClient.getLogs({address:[ADDRESSES.feeRouter,ADDRESSES.diemEngine],fromBlock:next,toBlock:end});
    const rows=[];
    for(const log of logs){
      try{
        const decoded=decodeEventLog({abi:protocolEventsAbi,data:log.data,topics:log.topics});
        if(!['FeeAccrued','PlatformSwept','Harvest','UnwindBegun','UnwindProgressed','HarvestPausedSet'].includes(decoded.eventName))continue;
        const args=jsonValue(decoded.args) as Record<string,string|boolean|number>;
        const block=await publicClient.getBlock({blockNumber:log.blockNumber});
        rows.push({id:`8453:${log.transactionHash}:${log.logIndex}`,chain_id:8453,contract_address:log.address.toLowerCase(),event_name:decoded.eventName,token:typeof args.token==='string'?args.token.toLowerCase():null,creator:typeof args.creator==='string'?args.creator.toLowerCase():null,amount_vvv:decoded.eventName==='FeeAccrued'?String(args.platformAmount):decoded.eventName==='PlatformSwept'?String(args.amount):decoded.eventName==='Harvest'?String(args.vvvReceived):null,amount_diem:decoded.eventName==='UnwindBegun'?String(args.diemAmount):decoded.eventName==='Harvest'?String(args.diemMinted):null,data:args,tx_hash:log.transactionHash as Hex,log_index:log.logIndex,block_number:log.blockNumber.toString(),block_timestamp:new Date(Number(block.timestamp)*1000).toISOString()});
      }catch{/* unrelated contract event */}
    }
    if(rows.length){const {error}=await db.from('protocol_events').upsert(rows,{onConflict:'id'});if(error)throw new Error(error.message);synced+=rows.length}
    last=end;batches++;
    const {error}=await db.from('indexer_state').upsert({key:PROTOCOL_INDEXER_KEY,last_block:last.toString(),updated_at:new Date().toISOString(),error:null});if(error)throw new Error(error.message);
    next=end+1n;
  }
  return {synced,batches,lastBlock:last.toString(),latestBlock:tip.toString(),confirmedBlock:confirmed.toString(),caughtUp:last>=confirmed};
}
