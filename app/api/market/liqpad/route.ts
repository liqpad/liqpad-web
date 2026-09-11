import {NextResponse} from 'next/server';
import {formatUnits,parseUnits} from 'viem';
import {LIQPAD_POOL_ID,LIQPAD_TOKEN} from '@/lib/constants';
import {burnedSupplyRaw} from '@/lib/burn';
import {publicClient} from '@/lib/data';
import {geckoPoolMarket,type GeckoPool} from '@/lib/gecko-market';
import {supabaseAdmin,supabaseBrowser} from '@/lib/supabase';
import {erc20Abi} from '@/src/abi/common';

export const revalidate=30;
export const dynamic='force-dynamic';
type MarketRow={price_usd:string|number|null;market_cap_usd:string|number|null;volume_24h_usd:string|number|null;change_24h:string|number|null;burned_b20:string|number|null;updated_at:string|null};
const numberOrNull=(value:string|number|null|undefined)=>{if(value==null)return null;const number=Number(value);return Number.isFinite(number)?number:null};
const cachedBurnRaw=(value:string|number|null|undefined)=>{try{return value==null?null:parseUnits(String(value),18).toString()}catch{return null}};
const choose=(primary:number|null|undefined,fallback:number|null)=>primary??fallback;

async function fetchGeckoPool(){
  const response=await fetch(`https://api.geckoterminal.com/api/v2/networks/base/pools/${LIQPAD_POOL_ID}?include=base_token%2Cquote_token`,{headers:{Accept:'application/json;version=20230302'},next:{revalidate:30,tags:['liqpad-market']},signal:AbortSignal.timeout(8_000)});
  if(!response.ok)throw new Error(`GeckoTerminal returned ${response.status}.`);
  return (await response.json() as {data:GeckoPool}).data;
}

export async function GET(){
  const db=supabaseAdmin()||supabaseBrowser();
  const [geckoResult,databaseResult,supplyResult]=await Promise.allSettled([
    fetchGeckoPool(),
    db?db.from('tokens').select('price_usd,market_cap_usd,volume_24h_usd,change_24h,burned_b20,updated_at').ilike('address',LIQPAD_TOKEN).maybeSingle():Promise.reject(new Error('Supabase is not configured.')),
    publicClient.readContract({address:LIQPAD_TOKEN,abi:erc20Abi,functionName:'totalSupply'}),
  ]);
  const response=databaseResult.status==='fulfilled'?databaseResult.value:null;const row=response?.data as MarketRow|null|undefined;
  const cached={price:numberOrNull(row?.price_usd),marketCap:numberOrNull(row?.market_cap_usd),volume:numberOrNull(row?.volume_24h_usd),change:numberOrNull(row?.change_24h)};
  const gecko=geckoResult.status==='fulfilled'?geckoPoolMarket(geckoResult.value,LIQPAD_TOKEN):null;
  const priceUsd=choose(gecko?.priceUsd,cached.price);const volume24hUsd=choose(gecko?.volume24hUsd,cached.volume);const change24h=choose(gecko?.change24h,cached.change);
  const totalSupplyRaw=supplyResult.status==='fulfilled'?supplyResult.value:null;const currentSupply=totalSupplyRaw==null?null:Number(formatUnits(totalSupplyRaw,18));
  const marketCapUsd=priceUsd!=null&&currentSupply!=null?priceUsd*currentSupply:cached.marketCap;
  const burnedRaw=totalSupplyRaw!=null?burnedSupplyRaw(totalSupplyRaw).toString():cachedBurnRaw(row?.burned_b20);
  const priceSource=gecko?.priceUsd!=null?'geckoterminal':cached.price!=null?'liqpad-indexer':null;const volumeSource=gecko?.volume24hUsd!=null?'geckoterminal':cached.volume!=null?'liqpad-indexer':null;
  return NextResponse.json({priceUsd,marketCapUsd,volume24hUsd,change24h,burnedRaw,currentSupply,tokenUrl:`/token/${LIQPAD_TOKEN}`,poolUrl:`https://www.geckoterminal.com/base/pools/${LIQPAD_POOL_ID}`,source:priceSource,sources:{price:priceSource,volume:volumeSource,burn:'onchain'},updatedAt:gecko?new Date().toISOString():row?.updated_at||null,warnings:{gecko:gecko?null:'GeckoTerminal is unavailable; indexed Liqpad data is being used.',database:response?.error?.message||(!row?'Liqpad cache is unavailable.':null),supply:burnedRaw==null?'Live supply is temporarily unavailable.':null}},{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=120'}});
}
