'use client';

type Phase='registering'|'redirecting'|'preparing'|'splitter-wallet'|'splitter-confirming'|'token-wallet'|'token-confirming'|'saving';

const copy:Record<Phase,{title:string;detail:string;step:string}>={
  registering:{title:'Creating your agent',detail:'Securing the agent wallet and registering its identity. Keep this page open.',step:'Identity · Wallet · Registry'},
  redirecting:{title:'Opening launch studio',detail:'The agent is ready. Loading its protected token launch flow.',step:'Registration complete'},
  preparing:{title:'Preparing agent launch',detail:'Verifying the 0xb07 address, uploading metadata, and requesting a signed quote.',step:'Metadata · Address · Quote'},
  'splitter-wallet':{title:'Confirm fee splitter',detail:'Review transaction 1 of 2 in your wallet. This creates the agent fee split.',step:'Transaction 1 of 2'},
  'splitter-confirming':{title:'Creating fee splitter',detail:'Transaction 1 of 2 was submitted and is confirming on Base.',step:'Transaction 1 of 2'},
  'token-wallet':{title:'Confirm agent token',detail:'Review transaction 2 of 2 in your wallet. Do not refresh this page.',step:'Transaction 2 of 2'},
  'token-confirming':{title:'Launching agent token',detail:'Transaction 2 of 2 was submitted and is confirming on Base.',step:'Transaction 2 of 2'},
  saving:{title:'Finalizing agent economy',detail:'Verifying both Base transactions and saving the agent-token relationship.',step:'On-chain verification'},
};

export function AgentProcessOverlay({phase}:{phase:Phase}){
  const text=copy[phase];
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-[#090812]/92 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-live="polite"><div className="card w-full max-w-md p-7 text-center shadow-neon"><div className="relative mx-auto grid h-24 w-24 place-items-center"><div className="absolute inset-0 animate-spin rounded-full border-2 border-cyan/15 border-t-cyan motion-reduce:animate-none"/><div className="absolute inset-3 animate-[spin_2.5s_linear_infinite_reverse] rounded-full border border-magenta/15 border-t-magenta motion-reduce:animate-none"/><div className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-cyan/20 to-magenta/20 text-2xl text-cyan">◆</div></div><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-cyan">{text.step}</p><h2 className="mt-3 text-2xl font-black">{text.title}</h2><p className="mt-3 leading-6 text-muted">{text.detail}</p><div className="mt-6 flex justify-center gap-1.5" aria-hidden="true">{[0,1,2].map(index=><span key={index} className="h-1.5 w-8 animate-pulse rounded-full bg-cyan/50" style={{animationDelay:`${index*180}ms`}}/>)}</div><p className="mt-5 text-xs text-muted">Controls are temporarily locked to prevent duplicate requests.</p></div></div>;
}
