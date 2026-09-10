import 'server-only';
import {formatUnits,getAddress,type Address} from 'viem';
import {ADDRESSES,SUPPLY} from '@/lib/constants';
import {burnedSupplyRaw} from '@/lib/burn';
import {publicClient} from '@/lib/data';
import {getAssetUsdPrices} from '@/lib/asset-prices';
import {swapUsdSnapshot,type PendingSwap} from '@/lib/market';
import {supabaseAdmin,supabaseBrowser} from '@/lib/supabase';
import {swapRouterAbi} from '@/src/abi/swapRouter';
import {v4QuoterAbi} from '@/src/abi/swapSupport';
import {erc20Abi} from '@/src/abi/common';

const SAMPLE_VVV=100_000_000_000_000_000n;
async function updateTokenPrice(token:Address,vvvUsd:number|null){
  const key=await publicClient.readContract({address:ADDRESSES.swapRouter,abi:swapRouterAbi,functionName:'poolKey',args:[token]});
  const zeroForOne=key.currency0.toLowerCase()===ADDRESSES.vvv.toLowerCase();
  const quote=await publicClient.simulateContract({address:ADDRESSES.v4Quoter,abi:v4QuoterAbi,functionName:'quoteExactInputSingle',args:[{poolKey:key,zeroForOne,exactAmount:SAMPLE_VVV,hookData:'0x'}]});
  const tokenOut=Number(formatUnits(quote.result[0],18));
  if(!Number.isFinite(tokenOut)||tokenOut<=0)return null;
  const priceVvv=Number(formatUnits(SAMPLE_VVV,18))/tokenOut;
  const priceUsd=vvvUsd==null?null:priceVvv*vvvUsd;
  return {price_vvv:priceVvv,price_usd:priceUsd,market_cap_usd:priceUsd==null?null:priceUsd*Number(SUPPLY),updated_at:new Date().toISOString()};
}

export async function syncMarketMetrics(){
  const db=supabaseAdmin();if(!db)throw new Error('Supabase service role is not configured.');
  const priceData=await getAssetUsdPrices();
  const [{data:tokens,error:tokenError},{data:pending,error:swapError}]=await Promise.all([
    db.from('tokens').select('address').eq('factory_address',ADDRESSES.factory.toLowerCase()).eq('is_legacy',false).limit(500),
    db.from('swaps').select('id,side,amount_in_raw,amount_out_raw,input_symbol,output_symbol,input_decimals,output_decimals').is('volume_usd',null).limit(1000),
  ]);
  if(tokenError)throw new Error(tokenError.message);if(swapError)throw new Error(swapError.message);
  let pricedTokens=0,pricedSwaps=0;
  for(const row of (pending||[]) as PendingSwap[]){
    const snapshot=swapUsdSnapshot(row,priceData.prices);if(!snapshot)continue;
    const {error}=await db.from('swaps').update({volume_usd:snapshot.volumeUsd,usd_price:snapshot.usdPrice,usd_price_source:priceData.source}).eq('id',row.id);
    if(error)throw new Error(error.message);pricedSwaps++;
  }
  for(const item of tokens||[]){
    const token=getAddress(item.address);
    try{
      const totalSupply=await publicClient.readContract({address:token,abi:erc20Abi,functionName:'totalSupply'});
      const {error}=await db.from('tokens').update({burned_b20:formatUnits(burnedSupplyRaw(totalSupply),18),updated_at:new Date().toISOString()}).eq('address',item.address);
      if(error)throw new Error(error.message);
    }catch{/* A failed supply read must not block price indexing. */}
    try{const values=await updateTokenPrice(token,priceData.prices.VVV);if(!values)continue;const {error}=await db.from('tokens').update(values).eq('address',item.address);if(error)throw new Error(error.message);if(values.price_usd!=null){const {error:snapshotError}=await db.from('token_price_snapshots').insert({token,price_vvv:values.price_vvv,price_usd:values.price_usd,market_cap_usd:values.market_cap_usd});if(snapshotError)throw new Error(snapshotError.message)}pricedTokens++}catch{/* A new/uninitialized pool must not block other tokens. */}
  }
  const {error:aggregateError}=await db.rpc('refresh_market_aggregates',{production_factory:ADDRESSES.factory.toLowerCase()});
  if(aggregateError)throw new Error(aggregateError.message);
  const {count:pendingSwaps,error:countError}=await db.from('swaps').select('id',{count:'exact',head:true}).is('volume_usd',null);
  if(countError)throw new Error(countError.message);
  return {pricedTokens,pricedSwaps,pendingSwaps:pendingSwaps||0,caughtUp:(pendingSwaps||0)===0,vvvUsdAvailable:priceData.prices.VVV!=null,updatedAt:new Date().toISOString()};
}

export type ProtocolMetrics={totalLaunches:number;totalVolumeUsd:number|null;uniqueTraders:number;highestMarketCapUsd:number|null;highestMarketCapToken:string|null;highestMarketCapSymbol:string|null;updatedAt:string|null};
export async function getProtocolMetrics():Promise<ProtocolMetrics>{
  const db=supabaseAdmin()||supabaseBrowser();if(!db)return {totalLaunches:0,totalVolumeUsd:null,uniqueTraders:0,highestMarketCapUsd:null,highestMarketCapToken:null,highestMarketCapSymbol:null,updatedAt:null};
  const {data,error}=await db.from('protocol_metrics').select('*').eq('id','liqpad-v1').maybeSingle();
  if(error||!data)return {totalLaunches:0,totalVolumeUsd:null,uniqueTraders:0,highestMarketCapUsd:null,highestMarketCapToken:null,highestMarketCapSymbol:null,updatedAt:null};
  return {totalLaunches:Number(data.total_launches||0),totalVolumeUsd:data.total_volume_usd==null?null:Number(data.total_volume_usd),uniqueTraders:Number(data.unique_traders||0),highestMarketCapUsd:data.highest_market_cap_usd==null?null:Number(data.highest_market_cap_usd),highestMarketCapToken:data.highest_market_cap_token||null,highestMarketCapSymbol:data.highest_market_cap_symbol||null,updatedAt:data.updated_at||null};
}
