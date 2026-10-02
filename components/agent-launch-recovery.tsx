'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {isHash} from 'viem';
import {usePrivy} from '@privy-io/react-auth';

export function AgentLaunchRecovery({slug}:{slug:string}){
  const [hash,setHash]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const {authenticated,login,getAccessToken}=usePrivy();const router=useRouter();
  async function recover(candidate=hash){
    if(!authenticated){login();return}
    const launchHash=candidate.trim();
    if(!isHash(launchHash)){setError('Enter the successful agent token transaction hash.');return}
    setBusy(true);setError('');
    try{
      const auth=await getAccessToken();if(!auth)throw new Error('Your session expired. Sign in again.');
      const response=await fetch(`/api/agents/${slug}/launch`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${auth}`},body:JSON.stringify({launchTxHash:launchHash})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Recovery failed.');
      window.localStorage.removeItem(`liqpad:agent-launch:${slug}`);
      router.push(`/agent/${slug}`);router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'Recovery failed.')}finally{setBusy(false)}
  }
  function useSaved(){const saved=window.localStorage.getItem(`liqpad:agent-launch:${slug}`)||'';if(!saved){setError('No saved launch transaction was found in this browser. Paste the Base transaction hash instead.');return}setHash(saved);void recover(saved)}
  return <details className="card mt-6 p-5"><summary className="cursor-pointer font-bold text-white">Token already succeeded on-chain?</summary><p className="mt-3 text-sm leading-6 text-muted">Recover a launch whose final database save was interrupted. This verifies the Factory event and deterministic splitter; it never submits another transaction.</p><label className="mt-4 block"><span className="mb-2 block text-xs uppercase tracking-wider text-muted">Agent token transaction hash</span><input className="input font-mono" value={hash} onChange={event=>setHash(event.target.value.trim())} placeholder="0x…" disabled={busy}/></label>{error&&<p className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={useSaved} disabled={busy} className="btn btn-ghost disabled:opacity-40">Use saved transaction</button><button type="button" onClick={()=>void recover()} disabled={busy||!hash} className="btn btn-primary disabled:opacity-40">{busy?'Verifying on Base…':'Recover agent launch'}</button></div></details>;
}
