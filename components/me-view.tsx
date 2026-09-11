'use client';

import Link from 'next/link';
import {useAccount,useDisconnect} from 'wagmi';
import type {Launch} from '@/lib/data';
import {short} from '@/lib/utils';
import {ClaimAll} from './claim-all';
import {useEffect,useState} from 'react';

export function MeView({launches}:{launches:Launch[]}){
  const {address}=useAccount();
  const {disconnect}=useDisconnect();
  const [visible,setVisible]=useState(12);
  useEffect(()=>setVisible(12),[address]);
  if(!address)return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="font-display text-4xl font-black">Your lantern is offline</h1><p className="mt-3 text-muted">Connect a wallet from the header to see your launches and creator fees.</p></div>;
  const own=launches.filter(item=>item.creator.toLowerCase()===address.toLowerCase());
  return <div className="mx-auto max-w-5xl px-4 py-12">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-cyan">Creator dashboard</p><h1 className="mt-2 font-display text-4xl font-black">My Liqpad</h1></div><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-2 pl-4"><span className="font-mono text-xs text-muted" title={address}>{short(address)}</span><button type="button" onClick={()=>disconnect()} className="btn btn-ghost min-h-10 px-3">Disconnect</button></div></div>
    <div className="mt-8 grid gap-4 md:grid-cols-2"><ClaimAll creator={address} tokens={own.map(item=>item.token)}/><div className="card p-5"><p className="text-sm text-muted">Harvest status</p><p className="mt-2 text-xl font-bold">On-chain · live</p><p className="mt-2 text-sm text-muted">FeeRouter accrual is read directly from Base.</p></div></div>
    <h2 className="mt-10 font-display text-2xl font-bold">Created tokens</h2><div className="mt-4 space-y-3">{own.slice(0,visible).map(item=><Link href={`/token/${item.token}`} className="card flex p-4" key={item.token}><b>{item.name}</b><span className="ml-2 text-muted">{item.symbol}</span><span className="ml-auto">View →</span></Link>)}{!own.length&&<div className="card p-8 text-center text-muted">No launches from this wallet in the indexed window.</div>}</div>{visible<own.length&&<button onClick={()=>setVisible(value=>value+12)} className="btn btn-ghost mt-5 w-full">Load more · {own.length-visible} remaining</button>}
  </div>;
}
