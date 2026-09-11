'use client';

import {useState} from 'react';
import {useAccount,usePublicClient,useWriteContract} from 'wagmi';
import {ADDRESSES,CHAIN_ID,PROTOCOL_OPERATOR} from '@/lib/constants';
import {feeRouterAbi} from '@/src/abi/feeRouter';
import {diemEngineAbi} from '@/src/abi/diemEngine';
import {formatToken} from '@/lib/transparency';
import {short} from '@/lib/utils';

type Step='idle'|'simulating-sweep'|'wallet-sweep'|'confirming-sweep'|'simulating-harvest'|'wallet-harvest'|'confirming-harvest'|'success'|'error';

export function ProtocolActions({pending,engineBalance,harvestPaused,onComplete}:{pending:string|null;engineBalance:string|null;harvestPaused:boolean|null;onComplete:()=>Promise<unknown>}){
  const {address,chainId}=useAccount();const client=usePublicClient();const {writeContractAsync}=useWriteContract();const [step,setStep]=useState<Step>('idle');const [hash,setHash]=useState<`0x${string}`|null>(null);const [error,setError]=useState('');
  const isOperator=address?.toLowerCase()===PROTOCOL_OPERATOR.toLowerCase();
  const pendingRaw=BigInt(pending||0),engineRaw=BigInt(engineBalance||0);const busy=!['idle','success','error'].includes(step);const wrongChain=!!address&&chainId!==CHAIN_ID;
  const execute=async(mode:'sweep'|'harvest'|'both')=>{if(!address||!client||wrongChain||busy)return;setError('');setHash(null);
    try{
      if((mode==='sweep'||mode==='both')&&pendingRaw>0n){setStep('simulating-sweep');await client.simulateContract({account:address,address:ADDRESSES.feeRouter,abi:feeRouterAbi,functionName:'sweepPlatform'});setStep('wallet-sweep');const sweepHash=await writeContractAsync({account:address,address:ADDRESSES.feeRouter,chainId:CHAIN_ID,abi:feeRouterAbi,functionName:'sweepPlatform'});setHash(sweepHash);setStep('confirming-sweep');await client.waitForTransactionReceipt({hash:sweepHash,confirmations:1});}
      if(mode==='harvest'||mode==='both'){setStep('simulating-harvest');await client.simulateContract({account:address,address:ADDRESSES.diemEngine,abi:diemEngineAbi,functionName:'harvest'});setStep('wallet-harvest');const harvestHash=await writeContractAsync({account:address,address:ADDRESSES.diemEngine,chainId:CHAIN_ID,abi:diemEngineAbi,functionName:'harvest'});setHash(harvestHash);setStep('confirming-harvest');await client.waitForTransactionReceipt({hash:harvestHash,confirmations:1});}
      setStep('success');await onComplete();
    }catch(cause){setError(cause instanceof Error?cause.message:'The protocol operation failed.');setStep('error');}
  };
  const labels:Record<Step,string>={idle:'Ready', 'simulating-sweep':'Checking sweep…','wallet-sweep':'Confirm sweep in wallet…','confirming-sweep':'Confirming sweep…','simulating-harvest':'Checking harvest…','wallet-harvest':'Confirm harvest in wallet…','confirming-harvest':'Confirming harvest…',success:'Protocol fees processed',error:'Action needs attention'};
  if(!isOperator)return null;
  return <section className="mt-12"><div className="mb-5"><h2 className="font-display text-2xl font-bold sm:text-3xl">Process protocol fees</h2><p className="mt-1 text-sm text-muted">Permissionless execution: move protocol VVV to DiemEngine, then stake it through Venice.</p></div><div className="card overflow-hidden"><div className="grid gap-px bg-white/10 md:grid-cols-2"><div className="bg-ink/95 p-5"><p className="text-xs uppercase tracking-wider text-muted">Step 1 · FeeRouter</p><p className="mt-2 text-2xl font-black">{formatToken(pending)} <span className="text-sm text-muted">VVV pending</span></p><button className="btn btn-ghost mt-5 min-h-11 w-full disabled:opacity-40" disabled={!address||wrongChain||busy||pendingRaw===0n} onClick={()=>execute('sweep')}>Sweep to DiemEngine</button></div><div className="bg-ink/95 p-5"><p className="text-xs uppercase tracking-wider text-muted">Step 2 · DiemEngine</p><p className="mt-2 text-2xl font-black">{formatToken(engineBalance)} <span className="text-sm text-muted">VVV liquid</span></p><button className="btn btn-ghost mt-5 min-h-11 w-full disabled:opacity-40" disabled={!address||wrongChain||busy||harvestPaused===true||engineRaw===0n} onClick={()=>execute('harvest')}>Harvest &amp; stake</button></div></div><div className="p-5"><button className="btn btn-primary min-h-12 w-full disabled:opacity-40" disabled={!address||wrongChain||busy||harvestPaused===true||(pendingRaw===0n&&engineRaw===0n)} onClick={()=>execute('both')}>{busy?labels[step]:'Process protocol fees'}</button><div aria-live="polite" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs"><span className={step==='error'?'text-red-300':step==='success'?'text-emerald-300':'text-muted'}>{!address?'Connect a wallet to run this permissionless action.':wrongChain?'Switch your wallet to Base Mainnet.':labels[step]}</span>{hash&&<a className="text-cyan" href={`https://basescan.org/tx/${hash}`} target="_blank" rel="noreferrer">{short(hash)} ↗</a>}</div>{error&&<p className="mt-3 line-clamp-4 rounded-xl border border-red-400/20 bg-red-400/[.07] p-3 text-xs text-red-200">{error}</p>}<p className="mt-4 text-xs leading-5 text-muted">Each step is simulated first. The combined action opens the wallet once for Sweep and again for Harvest after the first transaction confirms. DIEM is minted only when the configured minimum is reached.</p></div></div></section>;
}
