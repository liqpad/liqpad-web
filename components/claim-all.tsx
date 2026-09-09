'use client';
import {useEffect,useMemo} from 'react';
import {formatUnits,type Address} from 'viem';
import {useAccount,useReadContracts,useWaitForTransactionReceipt,useWriteContract} from 'wagmi';
import {ADDRESSES} from '@/lib/constants';
import {compactToken} from '@/lib/swap';
import {feeRouterAbi} from '@/src/abi/feeRouter';

export function ClaimAll({creator,tokens}:{creator:Address;tokens:Address[]}){
  const {address}=useAccount();const own=address?.toLowerCase()===creator.toLowerCase();
  const reads=useReadContracts({contracts:tokens.map(token=>({address:ADDRESSES.feeRouter,abi:feeRouterAbi,functionName:'creatorAccrued' as const,args:[creator,token] as const})),query:{enabled:tokens.length>0}});
  const total=useMemo(()=>reads.data?.reduce((sum,item)=>sum+(item.status==='success'?item.result:0n),0n),[reads.data]);
  const write=useWriteContract();const receipt=useWaitForTransactionReceipt({hash:write.data,query:{enabled:!!write.data}});
  useEffect(()=>{if(receipt.isSuccess)void reads.refetch()},[reads,receipt.isSuccess]);
  const loading=reads.isLoading;const failed=reads.isError||reads.data?.some(item=>item.status==='failure');
  const full=total===undefined?'':`${formatUnits(total,18)} VVV`;
  return <div className="card min-w-0 overflow-hidden p-5"><p className="text-sm text-muted">Unclaimed creator fees</p><p title={full} className="mt-2 min-w-0 truncate font-display text-2xl font-black sm:text-3xl">{loading?'…':failed?'Unavailable':`${compactToken(total||0n)} VVV`}</p>{failed&&<p className="mt-2 text-xs text-red-300">FeeRouter read failed. Check the Base RPC connection.</p>}<button disabled={!own||!total||write.isPending||receipt.isLoading} onClick={()=>write.writeContract({address:ADDRESSES.feeRouter,abi:feeRouterAbi,functionName:'claimAll'})} className="btn btn-primary mt-5 w-full disabled:opacity-40">{!own?'Connect creator wallet':write.isPending?'Confirm in wallet…':receipt.isLoading?'Claiming…':'Claim all'}</button>{write.error&&<p className="mt-2 break-words text-xs text-red-300">{write.error.message}</p>}</div>;
}
