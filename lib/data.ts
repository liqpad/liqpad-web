import { createPublicClient, fallback, http, parseAbiItem, type Address } from 'viem';
import { chain, rpcUrl, serverRpcUrl } from './chain';
import { ADDRESSES, FACTORY_START_BLOCK } from './constants';
import { factoryAbi } from '@/src/abi/factory';
import { hasSupabase, supabaseBrowser } from './supabase';

export type Launch = { token:Address; creator:Address; poolId:`0x${string}`; profileHash:`0x${string}`; blockNumber:bigint; blockTimestamp?:string; name:string; symbol:string; image:string; description:string; website:string; twitter:string; telegram:string; farcaster:string; discord:string; contractURI:string; quoteFrame?:number; legacy?:boolean };
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
      if (!error && data?.length) return data.map(r=>({ token:r.address as Address, creator:r.creator as Address, poolId:r.pool_id, profileHash:r.profile_hash, blockNumber:BigInt(r.block_number), blockTimestamp:r.block_timestamp||undefined, name:r.name, symbol:r.symbol, image:r.image, description:r.description, website:r.website, twitter:r.twitter, telegram:r.telegram, farcaster:r.farcaster, discord:r.discord, contractURI:r.contract_uri,quoteFrame:r.quote_frame??undefined,legacy:!!r.is_legacy }));
    } catch { /* on-chain fallback below */ }
  }
  return getOnchainLaunches();
}

export const short=(a:string)=>`${a.slice(0,6)}…${a.slice(-4)}`;
