'use client';
import {useEffect} from 'react';
import {formatUnits,type Address} from 'viem';
import {useAccount,useReadContract,useWaitForTransactionReceipt,useWriteContract} from 'wagmi';
import {ADDRESSES} from '@/lib/constants';
import {compactToken} from '@/lib/swap';
import {feeRouterAbi} from '@/src/abi/feeRouter';

export function TokenFeePanel({token,creator}:{token:Address;creator:Address}){
  const {address}=useAccount();const own=address?.toLowerCase()===creator.toLowerCase();const accrued=useReadContract({address:ADDRESSES.feeRouter,abi:feeRouterAbi,functionName:'creatorAccrued',args:[creator,token]});const write=useWriteContract();const receipt=useWaitForTransactionReceipt({hash:write.data,query:{enabled:!!write.data}});
  useEffect(()=>{if(receipt.isSuccess)void accrued.refetch()},[accrued,receipt.isSuccess]);
  const full=accrued.data===undefined?'':`${formatUnits(accrued.data,18)} VVV`;
  return <div className="card min-w-0 overflow-hidden p-5"><p className="text-sm text-muted">Unclaimed creator fees</p><p title={full} className="mt-1 min-w-0 truncate text-2xl font-bold">{accrued.isLoading?'…':accrued.isError?'Unavailable':`${compactToken(accrued.data||0n)} VVV`}</p>{accrued.isError&&<p className="mt-2 text-xs text-red-300">FeeRouter read failed. Check the Base RPC connection.</p>}{own&&<button disabled={!accrued.data||write.isPending||receipt.isLoading} onClick={()=>write.writeContract({address:ADDRESSES.feeRouter,abi:feeRouterAbi,functionName:'claim',args:[token]})} className="btn btn-primary mt-4 w-full disabled:opacity-40">{write.isPending?'Confirm in wallet…':receipt.isLoading?'Claiming…':'Claim VVV'}</button>}{write.error&&<p className="mt-2 break-words text-xs text-red-300">{write.error.message}</p>}</div>;
}
