import {PrivyClient} from '@privy-io/node';
import {createPublicClient,http} from 'viem';
import {chain} from '@/lib/chain';

let privy:PrivyClient|undefined;

function workerRpcUrl(){
  const value=(process.env.INDEXER_RPC_URL||process.env.BASE_RPC_URL||'').trim();
  if(!/^https?:\/\//i.test(value))throw new Error('INDEXER_RPC_URL or BASE_RPC_URL is required for agent automation.');
  return value;
}

// These clients are intentionally free of Next.js `server-only` markers because
// the VPS loads this module directly through Node + tsx.
export const agentWorkerPublicClient=createPublicClient({
  chain,
  transport:http(workerRpcUrl(),{retryCount:2,retryDelay:250,timeout:12_000}),
});

export function agentWorkerPrivy(){
  const appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret=process.env.PRIVY_APP_SECRET;
  if(!appId||!appSecret)throw new Error('Privy worker credentials are not configured.');
  return privy??=new PrivyClient({appId,appSecret});
}
