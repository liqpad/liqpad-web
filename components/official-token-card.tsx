'use client';

import Image from 'next/image';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {LIQPAD_TOKEN} from '@/lib/constants';
import {short} from '@/lib/utils';
import {usd,usdPrice} from '@/lib/swap';
import {BurnBadge} from '@/components/burn-indicator';

type Market={priceUsd:number|null;marketCapUsd:number|null;volume24hUsd:number|null;change24h:number|null;burnedRaw:string|null;tokenUrl:string;poolUrl:string;source:'geckoterminal'|'liqpad-indexer'|null};

export function OfficialTokenCard(){
  const [copied,setCopied]=useState(false);
  const market=useQuery({queryKey:['official-liqpad-market'],queryFn:async()=>{const response=await fetch('/api/market/liqpad');if(!response.ok)throw new Error('Market data unavailable');return response.json() as Promise<Market>},staleTime:30_000,retry:1});
  async function copy(){await navigator.clipboard.writeText(LIQPAD_TOKEN);setCopied(true);window.setTimeout(()=>setCopied(false),2_000)}
  const change=market.data?.change24h;

  return <aside className="relative min-w-0 overflow-hidden rounded-[1.75rem] border border-cyan/25 bg-[radial-gradient(circle_at_top_right,rgba(64,232,255,.18),transparent_45%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.025))] p-5 shadow-neon backdrop-blur sm:p-6">
    <Image aria-hidden src="/logo.png" alt="" width={220} height={220} className="pointer-events-none absolute -bottom-16 -right-10 h-52 w-52 object-contain opacity-[.08]"/>
    <div className="relative">
      <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[.2em] text-muted">Official ecosystem token</p><span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[11px] font-bold text-cyan">✓ VERIFIED</span></div>
      <div className="mt-5 flex items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/25"><Image src="/logo.png" alt="Liqpad logo" width={52} height={52} className="h-12 w-12 object-contain"/></div><div className="min-w-0"><h2 className="font-display text-3xl font-black">LIQPAD</h2><p className="text-sm text-muted">Base · Official contract</p></div></div>
      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-y border-white/10 py-4 sm:grid-cols-4">
        <Metric label="Price" value={market.isLoading?'…':usdPrice(market.data?.priceUsd)}/>
        <Metric label="Market cap" value={market.isLoading?'…':usd(market.data?.marketCapUsd)}/>
        <Metric label="24h volume" value={market.isLoading?'…':usd(market.data?.volume24hUsd)}/>
        <Metric label="24h" value={market.isLoading?'…':change==null?'—':`${change>=0?'+':''}${change.toFixed(2)}%`} tone={change==null?'':change>=0?'text-cyan':'text-red-300'}/>
      </div>
      <div className="mt-4 rounded-2xl border border-orange-300/15 bg-orange-400/[.06] p-3.5 text-sm"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted">Deflation in motion</p><BurnBadge raw={market.data?.burnedRaw} symbol="LIQPAD"/></div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3.5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted">Contract address</p><p className="mt-2 truncate font-mono text-sm text-white sm:hidden">{short(LIQPAD_TOKEN)}</p><p className="mt-2 hidden break-all font-mono text-xs leading-5 text-white sm:block">{LIQPAD_TOKEN}</p></div>
      <div className="mt-3 grid grid-cols-2 gap-3"><button type="button" onClick={copy} className="btn btn-primary min-h-11">{copied?'Copied ✓':'Copy address'}</button><a className="btn btn-ghost inline-flex min-h-11 items-center justify-center" href={market.data?.tokenUrl||`/token/${LIQPAD_TOKEN}`}>Trade LIQPAD →</a></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted"><span className="inline-flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${market.data?.source==='geckoterminal'?'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]':'bg-cyan'}`}/>{market.isLoading?'Loading live market…':market.data?.source==='geckoterminal'?'Live via GeckoTerminal':'Liqpad indexed fallback'}</span><a href={market.data?.poolUrl||'#'} target="_blank" rel="noopener noreferrer" className={market.data?.poolUrl?'text-cyan hover:text-white':'pointer-events-none opacity-40'}>View pool ↗</a></div>
      <p className="mt-2 text-[10px] leading-4 text-muted">Market cap uses current supply · burn is verified from totalSupply().</p>
    </div>
  </aside>
}

function Metric({label,value,tone='text-white'}:{label:string;value:string;tone?:string}){return <div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-muted">{label}</p><p className={`mt-1 truncate text-sm font-bold sm:text-base ${tone}`} title={value}>{value}</p></div>}
