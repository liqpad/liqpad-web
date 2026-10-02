import 'server-only';
import {createPublicClient,fallback,http} from 'viem';
import {chain} from '@/lib/chain';

function resolveServerRpcUrls(){
  const candidates=[process.env.BASE_RPC_URL,process.env.INDEXER_RPC_URL,'https://mainnet.base.org'];
  const urls=candidates.map(value=>value?.trim()).filter((value):value is string=>Boolean(value)&&/^https?:\/\//i.test(value!));
  const unique=[...new Set(urls)];if(!unique.length)throw new Error('A server-side Base RPC URL is required.');return unique;
}

// Route Handlers must never use the browser-only /api/rpc transport. Keeping
// this client in a server-only module also prevents private RPC URLs from being
// included in client bundles.
export const serverPublicClient=createPublicClient({
  chain,
  transport:fallback(resolveServerRpcUrls().map(url=>http(url,{retryCount:1,retryDelay:250,timeout:8_000})),{rank:false,retryCount:0}),
});
