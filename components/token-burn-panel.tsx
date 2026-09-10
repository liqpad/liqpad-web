'use client';
import type {Address} from 'viem';
import {INITIAL_SUPPLY_RAW} from '@/lib/constants';
import {burnedPercent,supplyDisplay} from '@/lib/burn';
import {BurnFlame,BurnProgress} from '@/components/burn-indicator';
import {useTokenBurn} from '@/hooks/useTokenBurn';

export function TokenBurnPanel({token,symbol,cachedBurnedRaw}:{token:Address;symbol:string;cachedBurnedRaw?:string|null}){
  const burn=useTokenBurn(token,cachedBurnedRaw);
  const raw=burn.data;
  const burned=raw==null?null:BigInt(raw);
  const remaining=burned==null?null:INITIAL_SUPPLY_RAW-burned;
  const active=burned!=null&&burned>0n;
  return <section className="card relative overflow-hidden p-5 sm:p-6">
    <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl"/>
    <div className="relative flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-orange-300/20 bg-orange-400/10"><BurnFlame active={active} className="scale-125"/></div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-200">Total {symbol} burned</p><div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1"><p className="truncate text-2xl font-black text-white sm:text-3xl">{burn.isLoading&&raw==null?'…':raw==null?'Unavailable':`${supplyDisplay(raw)} ${symbol}`}</p><p className="text-sm text-muted">{raw==null?'Supply read unavailable':`${(burnedPercent(raw)??0).toLocaleString('en-US',{maximumFractionDigits:4})}% permanently removed`}</p></div>{raw!=null&&<div className="mt-4"><BurnProgress raw={raw}/><div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted"><span>Initial supply <b className="text-white">1B {symbol}</b></span><span>Remaining <b className="text-white">{supplyDisplay(remaining)} {symbol}</b></span></div></div>}{burn.isError&&<p className="mt-3 text-xs text-red-300">Live supply could not be refreshed. The last indexed value is shown when available.</p>}</div></div>
  </section>;
}
