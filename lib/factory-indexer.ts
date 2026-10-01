import {parseAbiItem} from 'viem';
import {publicClient} from '@/lib/data';
import {ADDRESSES,FACTORY_INDEXER_KEY,FACTORY_START_BLOCK} from '@/lib/constants';
import {upsertLaunchLog} from '@/lib/launch-indexer';
import {supabaseAdmin} from '@/lib/supabase';
import {boundedInteger} from '@/lib/indexer-config';

export async function syncFactoryLaunches(latestBlock?:bigint){
  const db=supabaseAdmin();if(!db)throw new Error('Supabase service role is not configured.');
  const tip=latestBlock??await publicClient.getBlockNumber();
  const confirmations=BigInt(boundedInteger(process.env.INDEXER_CONFIRMATIONS,12,0,128));
  const confirmed=tip>confirmations?tip-confirmations:0n;
  const {data:state,error:stateError}=await db.from('indexer_state').select('last_block').eq('key',FACTORY_INDEXER_KEY).maybeSingle();
  if(stateError)throw new Error(stateError.message);
  const configuredStart=process.env.INDEXER_START_BLOCK;
  const start=configuredStart&&/^\d+$/.test(configuredStart)?BigInt(configuredStart):FACTORY_START_BLOCK;
  let last=BigInt(state?.last_block||0),next=last>0n?last+1n:start,synced=0,batches=0;
  const batchSize=boundedInteger(process.env.INDEXER_BLOCK_BATCH_SIZE,2_000,1,10_000);
  const maxBatches=boundedInteger(process.env.INDEXER_MAX_BATCHES,25,1,250);
  try{
    while(next<=confirmed&&batches<maxBatches){
      const end=next+BigInt(batchSize-1)>confirmed?confirmed:next+BigInt(batchSize-1);
      const [logs,quoteLogs]=await Promise.all([
        publicClient.getLogs({address:ADDRESSES.factory,event:parseAbiItem('event Launch(address indexed token,address indexed creator,bytes32 indexed poolId,bytes32 profileHash)'),fromBlock:next,toBlock:end}),
        publicClient.getLogs({address:ADDRESSES.factory,event:parseAbiItem('event LaunchQuoteUsed(address indexed token,int24 quotedFrame,uint64 validUntil,bytes32 quoteDigest)'),fromBlock:next,toBlock:end}),
      ]);
      for(const log of logs){
        const {token,creator,poolId,profileHash}=log.args;
        if(!token||!creator||!poolId||!profileHash||log.blockNumber===null||log.transactionHash===null)continue;
        const quote=quoteLogs.find(item=>item.args.token?.toLowerCase()===token.toLowerCase());
        await upsertLaunchLog({address:log.address,blockNumber:log.blockNumber,transactionHash:log.transactionHash,args:{token,creator,poolId,profileHash}},quote?.args.token&&quote.args.quotedFrame!==undefined&&quote.args.validUntil!==undefined&&quote.args.quoteDigest?{args:{token:quote.args.token,quotedFrame:quote.args.quotedFrame,validUntil:quote.args.validUntil,quoteDigest:quote.args.quoteDigest}}:undefined);
        synced++;
      }
      last=end;batches++;
      const {error}=await db.from('indexer_state').upsert({key:FACTORY_INDEXER_KEY,last_block:last.toString(),updated_at:new Date().toISOString(),error:null});
      if(error)throw new Error(error.message);
      next=end+1n;
    }
    return {synced,batches,lastBlock:last.toString(),latestBlock:tip.toString(),confirmedBlock:confirmed.toString(),caughtUp:last>=confirmed};
  }catch(error){
    const message=error instanceof Error?error.message:'Factory indexer failed.';
    await db.from('indexer_state').upsert({key:FACTORY_INDEXER_KEY,last_block:last.toString(),updated_at:new Date().toISOString(),error:message});
    throw error;
  }
}
