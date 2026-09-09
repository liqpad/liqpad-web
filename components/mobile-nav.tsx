'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

const items=[
  {href:'/',label:'Discover',icon:<><path d="M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z"/><circle cx="12" cy="12" r="2.5"/></>},
  {href:'/launch',label:'Launch',icon:<><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M12 8v8M8 12h8"/></>},
  {href:'/me',label:'Me',icon:<><circle cx="12" cy="8.5" r="3.5"/><path d="M5.5 20c.5-3.7 2.7-5.5 6.5-5.5s6 1.8 6.5 5.5"/></>},
] as const;

export function MobileNav(){
  const pathname=usePathname();
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_36px_rgba(0,0,0,.28)] backdrop-blur-xl md:hidden"><div className="mx-auto grid max-w-md grid-cols-3 gap-1">{items.map(item=>{const active=item.href==='/'?pathname==='/':pathname.startsWith(item.href);return <Link href={item.href} key={item.href} aria-current={active?'page':undefined} className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold tracking-wide transition-colors ${active?'bg-cyan/[.07] text-cyan':'text-muted hover:bg-white/[.04] hover:text-white'}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">{item.icon}</svg><span>{item.label}</span>{active&&<span aria-hidden="true" className="absolute bottom-1 h-0.5 w-4 rounded-full bg-cyan"/>}</Link>})}</div></nav>;
}
