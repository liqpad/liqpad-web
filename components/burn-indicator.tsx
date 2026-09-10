import {burnedPercent,supplyDisplay} from '@/lib/burn';

export function BurnFlame({active=true,className=''}:{active?:boolean;className?:string}){
  return <span aria-hidden className={`burn-flame ${active?'burn-flame-active':''} ${className}`}><span/><i/></span>;
}

export function BurnBadge({raw,symbol}:{raw?:string|null;symbol:string}){
  if(raw==null)return <span className="text-muted">Burn indexing…</span>;
  const active=BigInt(raw)>0n;
  return <span className={`inline-flex min-w-0 items-center gap-2 ${active?'text-orange-200':'text-muted'}`} title={`${supplyDisplay(raw)??'0'} ${symbol} permanently burned`}><BurnFlame active={active}/><span className="truncate"><b>{supplyDisplay(raw)??'0'} {symbol}</b> burned</span></span>;
}

export function BurnProgress({raw}:{raw:string}){
  const percentage=burnedPercent(raw)??0;
  const visual=Math.min(100,Math.max(percentage>0?0.4:0,percentage));
  return <div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan via-magenta to-orange-400 transition-[width] duration-500" style={{width:`${visual}%`}}/></div><p className="mt-2 text-right text-[10px] text-muted">{percentage.toLocaleString('en-US',{maximumFractionDigits:4})}% of initial supply burned</p></div>;
}
