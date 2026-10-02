'use client';
import Link from 'next/link';
import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { chain } from '@/lib/chain';
import Image from 'next/image';
import { MobileNav } from '@/components/mobile-nav';

const nav = [['/', 'Discover'], ['/launch', 'Launch'], ['/transparency', 'Transparency'], ['/docs', 'Docs']];
export function Header() {
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { switchChain } = useSwitchChain();
  const connector = connectors.find(x => x.id === 'injected') || connectors[0];
  return <>
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" aria-label="Liqpad Beta home" className="flex min-w-0 items-center gap-2 font-display text-xl font-black tracking-tight"><Image src="/logo.png" width={38} height={38} alt="" priority/><span className="whitespace-nowrap">LIQ<span className="text-magenta">PAD</span></span><span className="rounded-md border border-cyan/25 bg-cyan/[.07] px-1.5 py-0.5 font-sans text-[9px] font-bold tracking-[.16em] text-cyan shadow-[0_0_18px_rgba(64,232,255,.08)] sm:text-[10px]">BETA</span></Link>
        <nav className="hidden gap-6 text-sm text-muted md:flex">{nav.map(([h,l]) => <Link key={h} href={h} className="hover:text-white">{l}</Link>)}</nav>
        {isConnected ? <Link href="/me" aria-label={`Open creator dashboard for ${address}`} className="btn btn-ghost hidden min-h-11 items-center gap-2 md:inline-flex"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5"><circle cx="12" cy="8.5" r="3.5"/><path d="M5.5 20c.5-3.7 2.7-5.5 6.5-5.5s6 1.8 6.5 5.5"/></svg><span>Creator</span></Link> : <button disabled={!connector || isPending} className="btn btn-primary" onClick={() => connector && connect({ connector })}>{isPending ? 'Connecting…' : 'Connect'}</button>}
      </div>
      {isConnected && chainId !== chain.id && <button onClick={() => switchChain({ chainId: chain.id })} className="w-full bg-magenta px-4 py-2 text-sm font-bold">Wrong network — switch to {chain.name}</button>}
    </header>
    <MobileNav/>
  </>;
}
