import { base } from 'wagmi/chains';
import { CHAIN_ID } from './constants';
export const chain=base;
if(chain.id!==CHAIN_ID)throw new Error('Invalid Liqpad production chain configuration.');
export const rpcUrl=process.env.NEXT_PUBLIC_BASE_RPC_URL;
