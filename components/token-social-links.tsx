import type {SocialKind} from '@/lib/social-links';
import {normalizeSocialUrl} from '@/lib/social-links';

type Item={kind:SocialKind;label:string;value:string};

function SocialIcon({kind}:{kind:SocialKind}){
  if(kind==='website')return <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>;
  if(kind==='x')return <svg viewBox="0 0 24 24" aria-hidden><path d="m5 4 14 16M19 4 5 20"/></svg>;
  if(kind==='telegram')return <svg viewBox="0 0 24 24" aria-hidden><path d="m3 11 18-7-6.5 16-4-6-4 3 1-5 9-5-11 6z"/></svg>;
  if(kind==='farcaster')return <svg viewBox="0 0 24 24" aria-hidden><path d="M5 5h14v3M7 8v11M17 8v11M5 19h4M15 19h4M8 8c1.5 2 6.5 2 8 0"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden><path d="M7 7.5A13 13 0 0 1 12 6a13 13 0 0 1 5 1.5c1.3 2.4 2 5 2 7.8-1.5 1.2-3 2-4.5 2.4l-1-1.4M7 7.5c-1.3 2.4-2 5-2 7.8 1.5 1.2 3 2 4.5 2.4l1-1.4M9.5 13h.01M14.5 13h.01"/></svg>;
}

export function TokenSocialLinks({name,website,x,telegram,farcaster,discord}:{name:string;website:string;x:string;telegram:string;farcaster:string;discord:string}){
  const items:Item[]=[{kind:'website',label:'Website',value:website},{kind:'x',label:'X',value:x},{kind:'telegram',label:'Telegram',value:telegram},{kind:'farcaster',label:'Farcaster',value:farcaster},{kind:'discord',label:'Discord',value:discord}];
  return <div className="mt-4 flex flex-wrap gap-2" aria-label={`${name} social links`}>{items.map(item=>{const href=normalizeSocialUrl(item.kind,item.value);const content=<><span className="social-icon"><SocialIcon kind={item.kind}/></span><span className="hidden sm:inline">{item.label}</span></>;return href?<a key={item.kind} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${name} ${item.label}`} title={`Open ${name} ${item.label}`} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.045] px-3 text-sm font-bold text-cyan transition hover:-translate-y-0.5 hover:border-cyan/40 hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">{content}</a>:<button key={item.kind} type="button" disabled aria-label={`${item.label} not provided`} title={`${item.label} not provided`} className="inline-flex min-h-11 min-w-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/[.06] bg-white/[.02] px-3 text-sm font-bold text-muted opacity-40">{content}</button>})}</div>;
}
