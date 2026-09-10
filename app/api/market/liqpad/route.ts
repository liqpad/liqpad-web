import {NextResponse} from 'next/server';
import {parseUnits} from 'viem';
import {LIQPAD_TOKEN} from '@/lib/constants';
import {burnedSupplyRaw} from '@/lib/burn';
import {publicClient} from '@/lib/data';
import {supabaseAdmin,supabaseBrowser} from '@/lib/supabase';
import {erc20Abi} from '@/src/abi/common';

export const revalidate=30;

type MarketRow={price_usd:string|number|null;market_cap_usd:string|number|null;volume_24h_usd:string|number|null;change_24h:string|number|null;burned_b20:string|number|null;updated_at:string|null};
const numberOrNull=(value:string|number|null|undefined)=>{if(value==null)return null;const number=Number(value);return Number.isFinite(number)?number:null};
const cachedBurnRaw=(value:string|number|null|undefined)=>{try{return value==null?null:parseUnits(String(value),18).toString()}catch{return null}};

export async function GET(){
  const db=supabaseAdmin()||supabaseBrowser();
  const [databaseResult,supplyResult]=await Promise.allSettled([
    db?db.from('tokens').select('price_usd,market_cap_usd,volume_24h_usd,change_24h,burned_b20,updated_at').ilike('address',LIQPAD_TOKEN).maybeSingle():Promise.reject(new Error('Supabase is not configured.')),
    publicClient.readContract({address:LIQPAD_TOKEN,abi:erc20Abi,functionName:'totalSupply'}),
  ]);
  const response=databaseResult.status==='fulfilled'?databaseResult.value:null;
  const row=response?.data as MarketRow|null|undefined;
  const databaseError=response?.error?.message||(databaseResult.status==='rejected'?'Liqpad market cache is unavailable.':null);
  const burnedRaw=supplyResult.status==='fulfilled'?burnedSupplyRaw(supplyResult.value).toString():cachedBurnRaw(row?.burned_b20);
  return NextResponse.json({
    priceUsd:numberOrNull(row?.price_usd),marketCapUsd:numberOrNull(row?.market_cap_usd),
    volume24hUsd:numberOrNull(row?.volume_24h_usd),change24h:numberOrNull(row?.change_24h),burnedRaw,
    tokenUrl:`/token/${LIQPAD_TOKEN}`,source:row?'liqpad-indexer':null,updatedAt:row?.updated_at||null,
    warnings:{database:databaseError||(!row?'Official LIQPAD has not been indexed yet.':null),supply:burnedRaw==null?'Live supply is temporarily unavailable.':null},
  },{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=120'}});
}
