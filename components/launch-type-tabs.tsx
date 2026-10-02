'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

const tabs=[
  {href:'/launch',label:'Token',detail:'Standard B20'},
  {href:'/agents/create',label:'Agent',detail:'Identity + economy'},
] as const;

export function LaunchTypeTabs(){
  const pathname=usePathname();
  return <nav aria-label="Launch type" className="mx-auto mb-8 grid max-w-md grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1.5">{tabs.map(tab=>{const active=tab.href==='/launch'?pathname==='/launch':pathname.startsWith('/agent');return <Link key={tab.href} href={tab.href} aria-current={active?'page':undefined} className={`min-h-14 rounded-xl px-3 py-2 text-center transition ${active?'bg-gradient-to-r from-cyan/15 to-magenta/15 text-white shadow-[inset_0_0_0_1px_rgba(64,232,255,.2)]':'text-muted hover:bg-white/[.04] hover:text-white'}`}><span className="block text-sm font-black">{tab.label}</span><span className="mt-0.5 block text-[10px] uppercase tracking-wider opacity-70">{tab.detail}</span></Link>})}</nav>;
}
