'use client';

type Phase='wallet'|'confirming'|'database'|'success'|'error';
type Props={phase:Phase;hash?:string;token?:string;error?:string;onRetry?:()=>void};

const copy:Record<Exclude<Phase,'error'>,{title:string;detail:string}>={
  wallet:{title:'Confirm in your wallet',detail:'Review the Liqpad Factory transaction in your wallet.'},
  confirming:{title:'Launching on Base',detail:'Transaction submitted. Waiting for on-chain confirmation.'},
  database:{title:'Saving your launch',detail:'The token exists on Base. Verifying its event and adding it to Discover.'},
  success:{title:'Launch complete',detail:'Token verified and saved. Opening the token page…'},
};

export function LaunchTransactionOverlay({phase,hash,token,error,onRetry}:Props){const failed=phase==='error';const done=phase==='success';const text=failed?{title:'Database sync needs attention',detail:error||'The token transaction may have succeeded, but database confirmation is pending.'}:copy[phase];return <div className="fixed inset-0 z-[100] grid place-items-center bg-[#090812]/90 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-live="polite"><div className="card w-full max-w-md p-7 text-center shadow-neon"><div className="relative mx-auto grid h-20 w-20 place-items-center"><div className={`absolute inset-0 rounded-full border-2 ${failed?'border-red-400/40':done?'border-cyan/60':'animate-spin border-cyan/20 border-t-cyan'}`}/><div className={`grid h-14 w-14 place-items-center rounded-full text-2xl ${failed?'bg-red-400/10 text-red-300':done?'bg-cyan/15 text-cyan':'animate-pulse bg-magenta/15 text-magenta'}`}>{failed?'!':done?'✓':'◆'}</div></div><h2 className="mt-6 font-display text-2xl font-black">{text.title}</h2><p className="mt-3 leading-6 text-muted">{text.detail}</p>{hash&&<a href={`https://basescan.org/tx/${hash}`} target="_blank" rel="noreferrer" className="mt-5 block text-sm text-cyan">View transaction on BaseScan ↗</a>}{failed&&<div className="mt-6 grid gap-3">{onRetry&&<button type="button" onClick={onRetry} className="btn btn-primary">Retry database sync</button>}{token&&<a href={`/token/${token}`} className="btn btn-ghost">Open token page</a>}</div>}</div></div>}
