import { base } from 'wagmi/chains';
import { CHAIN_ID } from './constants';
export const chain=base;
if(chain.id!==CHAIN_ID)throw new Error('Invalid Liqpad production chain configuration.');
export const rpcUrl=process.env.NEXT_PUBLIC_BASE_RPC_URL||'/api/rpc';
export const serverRpcUrl=process.env.BASE_RPC_URL||(rpcUrl.startsWith('http')?rpcUrl:'https://mainnet.base.org');
