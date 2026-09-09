import {NextResponse} from 'next/server';
import {LIQPAD_TOKEN} from '@/lib/constants';

export const revalidate=30;

type Pair={
  chainId?:string;url?:string;pairAddress?:string;
  baseToken?:{address?:string};priceUsd?:string|null;
  liquidity?:{usd?:number|null};volume?:{h24?:number};priceChange?:{h24?:number}|null;
  marketCap?:number|null;fdv?:number|null;
};

export async function GET(){
  try{
    const response=await fetch(`https://api.dexscreener.com/token-pairs/v1/base/${LIQPAD_TOKEN}`,{next:{revalidate:30,tags:['liqpad-market']},signal:AbortSignal.timeout(8_000)});
    if(!response.ok)throw new Error(`DEX Screener returned ${response.status}.`);
    const pairs=await response.json() as Pair[];
    const token=LIQPAD_TOKEN.toLowerCase();
    const pair=pairs.filter(item=>item.chainId==='base'&&item.baseToken?.address?.toLowerCase()===token&&Number(item.priceUsd)>0)
      .sort((a,b)=>Number(b.liquidity?.usd||0)-Number(a.liquidity?.usd||0))[0];
    if(!pair)throw new Error('No indexed LIQPAD market was found.');
    return NextResponse.json({
      priceUsd:Number(pair.priceUsd),marketCapUsd:pair.marketCap??pair.fdv??null,
      volume24hUsd:pair.volume?.h24??null,change24h:pair.priceChange?.h24??null,
      liquidityUsd:pair.liquidity?.usd??null,pairUrl:pair.url??null,pairAddress:pair.pairAddress??null,
      source:'dexscreener',updatedAt:new Date().toISOString(),
    },{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=300'}});
  }catch{return NextResponse.json({priceUsd:null,marketCapUsd:null,volume24hUsd:null,change24h:null,liquidityUsd:null,pairUrl:null,source:null,error:'Market data unavailable'},{status:200,headers:{'Cache-Control':'public, s-maxage=15, stale-while-revalidate=60'}})}
}
