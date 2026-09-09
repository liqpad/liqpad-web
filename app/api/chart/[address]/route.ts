import {NextResponse} from 'next/server';
import {getAddress,isAddress} from 'viem';
import {ADDRESSES} from '@/lib/constants';

export const dynamic='force-dynamic';
type Params={params:Promise<{address:string}>};
type GeckoPool={attributes?:{address?:string;volume_usd?:{h24?:string}};relationships?:{base_token?:{data?:{id?:string}};quote_token?:{data?:{id?:string}}}};
type DexPair={pairAddress?:string;baseToken?:{address?:string};quoteToken?:{address?:string};volume?:{h24?:number}};
const relationAddress=(id?:string)=>id?.split('_').at(-1)?.toLowerCase();
const isPoolIdentifier=(value?:string)=>!!value&&/^0x(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})$/.test(value);

export async function GET(_:Request,{params}:Params){
  const {address}=await params;if(!isAddress(address))return NextResponse.json({error:'Invalid token address.'},{status:400});
  const token=getAddress(address);const target=token.toLowerCase();const vvv=ADDRESSES.vvv.toLowerCase();
  const [gecko,dex]=await Promise.allSettled([
    fetch(`https://api.geckoterminal.com/api/v2/networks/base/tokens/${token}/pools?page=1`,{next:{revalidate:60},headers:{accept:'application/json'}}).then(async response=>response.ok?response.json():Promise.reject(new Error('GeckoTerminal unavailable'))),
    fetch(`https://api.dexscreener.com/token-pairs/v1/base/${token}`,{next:{revalidate:60},headers:{accept:'application/json'}}).then(async response=>response.ok?response.json():Promise.reject(new Error('Dexscreener unavailable'))),
  ]);
  if(gecko.status==='fulfilled'){
    const pools=(gecko.value.data||[]) as GeckoPool[];const matches=pools.filter(pool=>{const base=relationAddress(pool.relationships?.base_token?.data?.id);const quote=relationAddress(pool.relationships?.quote_token?.data?.id);return (base===target&&quote===vvv)||(base===vvv&&quote===target)}).sort((a,b)=>Number(b.attributes?.volume_usd?.h24||0)-Number(a.attributes?.volume_usd?.h24||0));
    const pool=matches[0]?.attributes?.address;if(isPoolIdentifier(pool))return NextResponse.json({provider:'geckoterminal',pool:pool!.toLowerCase(),embedUrl:`https://www.geckoterminal.com/base/pools/${pool}?embed=1&info=0&swaps=0`},{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'}});
  }
  if(dex.status==='fulfilled'){
    const pairs=(Array.isArray(dex.value)?dex.value:[]) as DexPair[];const matches=pairs.filter(pair=>{const base=pair.baseToken?.address?.toLowerCase();const quote=pair.quoteToken?.address?.toLowerCase();return (base===target&&quote===vvv)||(base===vvv&&quote===target)}).sort((a,b)=>(b.volume?.h24||0)-(a.volume?.h24||0));
    const pair=matches[0]?.pairAddress;if(isPoolIdentifier(pair))return NextResponse.json({provider:'dexscreener',pool:pair!.toLowerCase(),embedUrl:`https://dexscreener.com/base/${pair}?embed=1&theme=dark&trades=0&info=0&chartLeftToolbar=0`},{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'}});
  }
  return NextResponse.json({provider:null,pool:null,embedUrl:null,indexing:true},{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=120'}});
}
