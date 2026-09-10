import { createPublicClient, fallback, http, parseAbiItem, type Address } from 'viem';
import { chain, rpcUrl, serverRpcUrl } from './chain';
import { ADDRESSES, FACTORY_START_BLOCK } from './constants';
import { factoryAbi } from '@/src/abi/factory';
import { hasSupabase, supabaseBrowser } from './supabase';

export type Launch = { token:Address; creator:Address; poolId:`0x${string}`; profileHash:`0x${string}`; blockNumber:bigint; blockTimestamp?:string; name:string; symbol:string; image:string; description:string; website:string; twitter:string; telegram:string; farcaster:string; discord:string; contractURI:string; quoteFrame?:number; legacy?:boolean;priceVvv?:number|null;priceUsd?:number|null;marketCapUsd?:number|null;volume24hUsd?:number|null;change24h?:number|null;traders24h?:number|null;tx24h?:number|null };
export type LaunchPage={items:Launch[];page:number;pageSize:number;total:number;totalPages:number};
type LaunchRow={address:string;creator:string;pool_id:string;profile_hash:string;block_number:string|number;block_timestamp?:string|null;name:string;symbol:string;image:string;description:string;website:string;twitter:string;telegram:string;farcaster:string;discord:string;contract_uri:string;quote_frame?:number|null;is_legacy?:boolean|null;price_vvv?:string|number|null;price_usd?:string|number|null;market_cap_usd?:string|number|null;volume_24h_usd?:string|number|null;change_24h?:string|number|null;traders_24h?:string|number|null;tx_24h?:string|number|null};
export const launchFromRow=(r:LaunchRow):Launch=>({token:r.address as Address,creator:r.creator as Address,poolId:r.pool_id as `0x${string}`,profileHash:r.profile_hash as `0x${string}`,blockNumber:BigInt(r.block_number),blockTimestamp:r.block_timestamp||undefined,name:r.name,symbol:r.symbol,image:r.image,description:r.description,website:r.website,twitter:r.twitter,telegram:r.telegram,farcaster:r.farcaster,discord:r.discord,contractURI:r.contract_uri,quoteFrame:r.quote_frame??undefined,legacy:!!r.is_legacy,priceVvv:r.price_vvv==null?null:Number(r.price_vvv),priceUsd:r.price_usd==null?null:Number(r.price_usd),marketCapUsd:r.market_cap_usd==null?null:Number(r.market_cap_usd),volume24hUsd:r.volume_24h_usd==null?null:Number(r.volume_24h_usd),change24h:r.change_24h==null?null:Number(r.change_24h),traders24h:r.traders_24h==null?null:Number(r.traders_24h),tx24h:r.tx_24h==null?null:Number(r.tx_24h)});
const rpcTransports=[serverRpcUrl,rpcUrl]
  .filter((url,index,urls):url is string=>Boolean(url)&&urls.indexOf(url)===index)
  .map(url=>http(url,{retryCount:2,retryDelay:250,timeout:10_000}));
export const publicClient = createPublicClient({chain,transport:rpcTransports.length>1?fallback(rpcTransports):rpcTransports[0]||http()});

export async function getOnchainLaunches(): Promise<Launch[]> {
  try {
    const logs=await publicClient.getLogs({ address:ADDRESSES.factory,event:parseAbiItem('event Launch(address indexed token,address indexed creator,bytes32 indexed poolId,bytes32 profileHash)'),fromBlock:FACTORY_START_BLOCK,toBlock:'latest' });
    const rows=await Promise.all(logs.map(async l=>{const p=await publicClient.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'getProfile',args:[l.args.token!]});return {token:l.args.token!,creator:p.creator,poolId:p.poolId,profileHash:l.args.profileHash!,blockNumber:l.blockNumber,name:p.name,symbol:p.symbol,image:p.logoURI,description:p.description,website:p.website,twitter:p.socials.twitter,telegram:p.socials.telegram,farcaster:p.socials.farcaster,discord:p.socials.discord,contractURI:p.contractURI} as Launch;}));
    return rows.reverse();
  } catch { return []; }
}

export async function getLaunches(): Promise<Launch[]> {
  if (hasSupabase) {
    try {
      const db=supabaseBrowser(); const {data,error}=await db!.from('tokens').select('*').eq('factory_address',ADDRESSES.factory.toLowerCase()).order('block_number',{ascending:false}).limit(500);
      if (!error && data?.length) return data.map(launchFromRow);
    } catch { /* on-chain fallback below */ }
  }
  return getOnchainLaunches();
}

export async function getLaunchPage({page=1,pageSize=24,q='',sort='new',creator}:{page?:number;pageSize?:number;q?:string;sort?:string;creator?:string}={}):Promise<LaunchPage>{
  const safePage=Math.max(1,Math.floor(page)),safeSize=Math.max(1,Math.min(48,Math.floor(pageSize)));const db=hasSupabase?supabaseBrowser():null;
  if(db){
    let query=db.from('tokens').select('*',{count:'exact'}).eq('factory_address',ADDRESSES.factory.toLowerCase()).eq('is_legacy',false);
    if(creator)query=query.ilike('creator',creator);const term=q.trim().replace(/[%(),]/g,'').slice(0,80);if(term)query=query.or(`name.ilike.%${term}%,symbol.ilike.%${term}%,address.ilike.%${term}%`);
    const columns:Record<string,string>={volume:'volume_24h_usd',mc:'market_cap_usd',change:'change_24h',traders:'traders_24h',new:'block_number'};query=query.order(columns[sort]||'block_number',{ascending:false,nullsFirst:false});
    const from=(safePage-1)*safeSize;const {data,error,count}=await query.range(from,from+safeSize-1);if(!error){const total=count||0;return {items:(data||[]).map(launchFromRow),page:safePage,pageSize:safeSize,total,totalPages:Math.max(1,Math.ceil(total/safeSize))}}
  }
  let all=await getOnchainLaunches();if(creator)all=all.filter(item=>item.creator.toLowerCase()===creator.toLowerCase());if(q)all=all.filter(item=>`${item.name} ${item.symbol} ${item.token}`.toLowerCase().includes(q.toLowerCase()));const total=all.length,from=(safePage-1)*safeSize;return {items:all.slice(from,from+safeSize),page:safePage,pageSize:safeSize,total,totalPages:Math.max(1,Math.ceil(total/safeSize))};
}

export {short} from './utils';
