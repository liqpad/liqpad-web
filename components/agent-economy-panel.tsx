'use client';
import {useQuery} from '@tanstack/react-query';
import {useState} from 'react';
import {parseEther,parseUnits,type Address} from 'viem';
import {useAccount,useSendTransaction,useWaitForTransactionReceipt,useWriteContract} from 'wagmi';
import {ADDRESSES} from '@/lib/constants';

const transferAbi=[{type:'function',name:'transfer',stateMutability:'nonpayable',inputs:[{name:'to',type:'address'},{name:'amount',type:'uint256'}],outputs:[{type:'bool'}]}] as const;
type Economy={formatted:{eth:string|null;vvv:string|null;usdc:string|null;claimable:string|null};gasLow:boolean|null;inferenceLow:boolean|null;claimReady:boolean|null;unavailable:string[];thresholds:{gasEth:string;inferenceUsdc:string;claimVvv:string}};
export function AgentEconomyPanel({slug,wallet}:{slug:string;wallet:Address}){
  const {isConnected}=useAccount();const [ethAmount,setEthAmount]=useState('0.0005');const [usdcAmount,setUsdcAmount]=useState('5');
  const economy=useQuery<Economy>({queryKey:['agent-economy',slug],queryFn:async()=>{const r=await fetch(`/api/agents/${slug}/economy`);if(!r.ok)throw new Error('Unavailable');return r.json()},refetchInterval:20_000});
  const eth=useSendTransaction();const usdc=useWriteContract();const ethReceipt=useWaitForTransactionReceipt({hash:eth.data});const usdcReceipt=useWaitForTransactionReceipt({hash:usdc.data});
  const busy=eth.isPending||usdc.isPending||ethReceipt.isLoading||usdcReceipt.isLoading;
  return <section className="card p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black">Agent runway</h2><p className="mt-1 text-xs text-muted">Direct, non-custodial support on Base.</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${economy.data?.gasLow||economy.data?.inferenceLow?'bg-amber-300/10 text-amber-200':'bg-cyan/10 text-cyan'}`}>{economy.data?.gasLow||economy.data?.inferenceLow?'Needs fuel':'Funded'}</span></div>
  <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-white/[.04] p-3"><span className="text-xs text-muted">Gas</span><b className="mt-1 block">{economy.data?.formatted.eth==null?'Unavailable':`${Number(economy.data.formatted.eth).toFixed(5)} ETH`}</b></div><div className="rounded-xl bg-white/[.04] p-3"><span className="text-xs text-muted">Inference wallet</span><b className="mt-1 block">{economy.data?.formatted.usdc==null?'Unavailable':`${Number(economy.data.formatted.usdc).toFixed(2)} USDC`}</b></div></div>
  {economy.data&&<p className="mt-3 text-xs text-muted">{economy.data.formatted.claimable==null?'Claimable temporarily unavailable':`${Number(economy.data.formatted.claimable).toFixed(4)} VVV claimable`} · automation starts at {economy.data.thresholds.claimVvv} VVV.</p>}
  {!!economy.data?.unavailable.length&&<p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-2 text-[11px] text-amber-100">Some live reads are temporarily unavailable. No missing balance was replaced with zero.</p>}
  {(economy.data?.gasLow===true||economy.data?.inferenceLow===true)&&<div className="mt-4 space-y-3">{economy.data.gasLow===true&&<div className="flex gap-2"><input aria-label="ETH donation" className="input min-w-0" value={ethAmount} onChange={e=>setEthAmount(e.target.value)}/><button className="btn btn-primary shrink-0" disabled={!isConnected||busy} onClick={()=>eth.sendTransaction({to:wallet,value:parseEther(ethAmount)})}>⛽ Send ETH</button></div>}{economy.data.inferenceLow===true&&<div className="flex gap-2"><input aria-label="USDC donation" className="input min-w-0" value={usdcAmount} onChange={e=>setUsdcAmount(e.target.value)}/><button className="btn btn-primary shrink-0" disabled={!isConnected||busy} onClick={()=>usdc.writeContract({address:ADDRESSES.usdc,abi:transferAbi,functionName:'transfer',args:[wallet,parseUnits(usdcAmount,6)]})}>💰 Send USDC</button></div>}</div>}
  {(ethReceipt.isSuccess||usdcReceipt.isSuccess)&&<p className="mt-3 text-xs text-cyan">Donation confirmed. Balances will refresh shortly.</p>}<p className="mt-3 text-[11px] leading-4 text-muted">USDC pays holder chat through Venice x402. ETH is reserved for claims and upkeep transactions.</p></section>
}
