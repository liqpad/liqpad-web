import 'server-only';
import {getAddress,parseAbiItem,zeroAddress} from 'viem';
import {ADDRESSES,FACTORY_START_BLOCK,SWAP_INDEXER_KEY} from '@/lib/constants';
import {publicClient} from '@/lib/data';
import {supabaseAdmin} from '@/lib/supabase';

const CONFIRMATIONS=12n;
function asset(address:string,b20:string){const value=address.toLowerCase();if(value===zeroAddress||value===ADDRESSES.weth.toLowerCase())return {symbol:'ETH',decimals:18};if(value===ADDRESSES.usdc.toLowerCase())return {symbol:'USDC',decimals:6};if(value===ADDRESSES.vvv.toLowerCase())return {symbol:'VVV',decimals:18};if(value===b20.toLowerCase())return {symbol:'B20',decimals:18};return {symbol:'TOKEN',decimals:18}}

export async function syncSwapEvents(latestBlock?:bigint){
  const db=supabaseAdmin();if(!db)throw new Error('Supabase service role is not configured.');
  const tip=latestBlock??await publicClient.getBlockNumber();const confirmed=tip>CONFIRMATIONS?tip-CONFIRMATIONS:0n;
  const {data:state,error:stateError}=await db.from('indexer_state').select('last_block').eq('key',SWAP_INDEXER_KEY).maybeSingle();if(stateError)throw new Error(stateError.message);
  const configured=process.env.SWAP_INDEXER_START_BLOCK;const start=configured&&/^\d+$/.test(configured)?BigInt(configured):FACTORY_START_BLOCK;
  let last=BigInt(state?.last_block||0),next=last>0n?last+1n:start,synced=0,batches=0;
  const batchSize=Math.max(1,Math.min(2_000,Number(process.env.INDEXER_BLOCK_BATCH_SIZE||10)));const maxBatches=Math.max(1,Math.min(100,Number(process.env.INDEXER_MAX_BATCHES||20)));
  while(next<=confirmed&&batches<maxBatches){
    const end=next+BigInt(batchSize-1)>confirmed?confirmed:next+BigInt(batchSize-1);
    const logs=await publicClient.getLogs({address:ADDRESSES.swapRouter,event:parseAbiItem('event SwapExecuted(address indexed payer,address indexed recipient,address indexed b20,address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOut)'),fromBlock:next,toBlock:end});
    const rows=[];
    for(const log of logs){
      const {payer,recipient,b20,tokenIn,tokenOut,amountIn,amountOut}=log.args;
      if(!payer||!recipient||!b20||!tokenIn||!tokenOut||amountIn===undefined||amountOut===undefined||log.blockNumber===null||log.transactionHash===null||log.logIndex===null)continue;
      const input=asset(tokenIn,b20),output=asset(tokenOut,b20),side=tokenOut.toLowerCase()===b20.toLowerCase()?'buy':'sell';
      const block=await publicClient.getBlock({blockNumber:log.blockNumber});
      rows.push({id:`8453:${log.transactionHash}:${log.logIndex}`,token:getAddress(b20),tx_hash:log.transactionHash,log_index:log.logIndex,block_number:log.blockNumber.toString(),block_timestamp:new Date(Number(block.timestamp)*1000).toISOString(),sender:getAddress(payer),recipient:getAddress(recipient),token_in:getAddress(tokenIn),token_out:getAddress(tokenOut),amount_in_raw:amountIn.toString(),amount_out_raw:amountOut.toString(),input_symbol:input.symbol,output_symbol:output.symbol,input_decimals:input.decimals,output_decimals:output.decimals,amount_b20:(side==='buy'?amountOut:amountIn).toString(),amount_vvv:tokenIn.toLowerCase()===ADDRESSES.vvv.toLowerCase()?amountIn.toString():tokenOut.toLowerCase()===ADDRESSES.vvv.toLowerCase()?amountOut.toString():null,side});
    }
    if(rows.length){const {error}=await db.from('swaps').upsert(rows,{onConflict:'id'});if(error)throw new Error(error.message);synced+=rows.length}
    last=end;batches++;
    const {error}=await db.from('indexer_state').upsert({key:SWAP_INDEXER_KEY,last_block:last.toString(),updated_at:new Date().toISOString(),error:null});if(error)throw new Error(error.message);
    next=end+1n;
  }
  return {synced,batches,lastBlock:last.toString(),latestBlock:tip.toString(),confirmedBlock:confirmed.toString(),caughtUp:last>=confirmed};
}
