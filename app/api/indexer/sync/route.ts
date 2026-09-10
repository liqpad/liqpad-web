import { NextResponse } from 'next/server';
import { parseAbiItem } from 'viem';
import { publicClient } from '@/lib/data';
import { ADDRESSES, FACTORY_INDEXER_KEY, FACTORY_START_BLOCK } from '@/lib/constants';
import { upsertLaunchLog } from '@/lib/launch-indexer';
import { supabaseAdmin } from '@/lib/supabase';
import { syncProtocolEvents } from '@/lib/protocol-indexer';
import { syncSwapEvents } from '@/lib/swap-indexer';
import { syncMarketMetrics } from '@/lib/market-indexer';

export async function POST(req:Request) {
  const secret=process.env.INDEXER_SECRET;
  if (!secret || req.headers.get('authorization')!==`Bearer ${secret}`) return NextResponse.json({error:'Unauthorized'},{status:401});
  const db=supabaseAdmin(); if(!db)return NextResponse.json({error:'Supabase service role is not configured.'},{status:503});
  const batchSize=Math.max(1,Math.min(2_000,Number(process.env.INDEXER_BLOCK_BATCH_SIZE||10)));
  const maxBatches=Math.max(1,Math.min(100,Number(process.env.INDEXER_MAX_BATCHES||20)));
  const latest=await publicClient.getBlockNumber();
  const {data:state,error:stateError}=await db.from('indexer_state').select('last_block').eq('key',FACTORY_INDEXER_KEY).maybeSingle();
  if(stateError)return NextResponse.json({error:stateError.message},{status:500});

  let last=BigInt(state?.last_block||0);
  let next=last>0n?last+1n:BigInt(process.env.INDEXER_START_BLOCK||FACTORY_START_BLOCK);
  let synced=0; let batches=0;
  try {
    while(next<=latest&&batches<maxBatches){
      const end=next+BigInt(batchSize-1)>latest?latest:next+BigInt(batchSize-1);
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
      last=end; batches++;
      const {error}=await db.from('indexer_state').upsert({key:FACTORY_INDEXER_KEY,last_block:last.toString(),updated_at:new Date().toISOString(),error:null});
      if(error)throw new Error(error.message);
      next=end+1n;
    }
    const safe=async<T>(job:Promise<T>)=>job.catch(error=>({error:error instanceof Error?error.message:'Indexer failed.'}));
    const [protocol,swaps]=await Promise.all([safe(syncProtocolEvents(latest)),safe(syncSwapEvents(latest))]);
    const market=await safe(syncMarketMetrics());
    return NextResponse.json({synced,batches,lastBlock:last.toString(),latestBlock:latest.toString(),caughtUp:last>=latest,protocol,swaps,market});
  } catch(error) {
    const message=error instanceof Error?error.message:'Indexer sync failed.';
    await db.from('indexer_state').upsert({key:FACTORY_INDEXER_KEY,last_block:last.toString(),updated_at:new Date().toISOString(),error:message});
    return NextResponse.json({error:message,synced,batches,lastBlock:last.toString()},{status:502});
  }
}
