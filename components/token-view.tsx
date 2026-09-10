'use client';
import Link from 'next/link';
import type {Address} from 'viem';
import type {Launch} from '@/lib/data';
import {short} from '@/lib/utils';
import {TokenImage} from '@/components/token-image';
import {SwapWidget} from '@/components/swap-widget';
import {TokenStats} from '@/components/token-stats';
import {TokenChart} from '@/components/token-chart';
import {TokenFeePanel} from '@/components/token-fee-panel';
import {LatestSwaps} from '@/components/latest-swaps';

export function TokenView({launch}:{launch:Launch}){
  const links=[['Website',launch.website],['X',launch.twitter],['Telegram',launch.telegram],['Farcaster',launch.farcaster],['Discord',launch.discord]].filter(item=>item[1]);
  return <div className="mx-auto max-w-7xl px-4 py-10"><section className="flex flex-col gap-5 md:flex-row md:items-center"><div className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-magenta/40 to-cyan/20 text-4xl font-black"><TokenImage src={launch.image} alt={`${launch.name} logo`} width={96} height={96} fallback={launch.symbol||'?'}/></div><div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-4xl font-black">{launch.name}</h1><span className="rounded-full border border-cyan/30 px-2 py-1 text-xs text-cyan">◆ LP locked</span></div><p className="mt-1 text-muted">{launch.symbol} · B20 · VVV pair · <Link className="text-cyan" href={`/creator/${launch.creator}`}>{short(launch.creator)}</Link></p><div className="mt-3 flex flex-wrap gap-4 text-sm">{links.map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer" className="text-magenta">{name} ↗</a>)}</div></div><div className="flex gap-2 md:ml-auto"><button className="btn btn-ghost" onClick={()=>navigator.clipboard.writeText(launch.token)}>Copy CA</button><button className="btn btn-ghost" onClick={()=>navigator.share?.({title:`${launch.name} on Liqpad`,url:location.href})}>Share</button></div></section>
    <TokenStats token={launch.token as Address}/><div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_390px]"><div className="min-w-0 space-y-6"><TokenChart token={launch.token as Address} symbol={launch.symbol}/><LatestSwaps token={launch.token as Address} symbol={launch.symbol}/></div><aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start"><SwapWidget token={launch.token as Address} symbol={launch.symbol}/><TokenFeePanel token={launch.token as Address} creator={launch.creator}/><div className="paper rounded-2xl p-5"><b>Fee route</b><p className="mt-2 text-sm">1% assessed VVV fee · B20 sell fee burned · 70% creator / 30% protocol-owned Venice capital.</p><Link href="/transparency#methodology" className="mt-2 inline-block text-sm font-bold text-violet-700">View methodology →</Link></div></aside></div></div>;
}
