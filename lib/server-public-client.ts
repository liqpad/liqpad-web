import 'server-only';
import {createPublicClient,http} from 'viem';
import {chain} from '@/lib/chain';

function resolveServerRpcUrl(){
  const candidates=[process.env.BASE_RPC_URL,process.env.INDEXER_RPC_URL,'https://mainnet.base.org'];
  const url=candidates.map(value=>value?.trim()).find(value=>value&&/^https?:\/\//i.test(value));
  if(!url)throw new Error('A server-side Base RPC URL is required.');
  return url;
}

// Route Handlers must never use the browser-only /api/rpc transport. Keeping
// this client in a server-only module also prevents private RPC URLs from being
// included in client bundles.
export const serverPublicClient=createPublicClient({
  chain,
  transport:http(resolveServerRpcUrl(),{retryCount:2,retryDelay:250,timeout:12_000}),
});
