'use client';
import type { Hex } from 'viem';
import { useEffect, useState } from 'react';
import { useMineB07 } from '@/hooks/useMineB07';

export function B07Miner({ onVerified }: { onVerified: (salt?: Hex, token?: string) => void }) {
  const m = useMineB07(); const [showSalt, setShowSalt] = useState(false);
  useEffect(() => { onVerified(m.result?.salt, m.result?.token); }, [m.result, onVerified]);
  const busy = m.status === 'mining' || m.status === 'verifying';
  return <div className="rounded-2xl border border-cyan/20 bg-cyan/[.04] p-5">
    <div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-lg font-bold">0xb07 address miner</h3><p className="mt-1 text-sm text-muted">Expected hit: 1 in 4,096 salts. Runs off the main thread.</p></div><span className={`rounded-full px-3 py-1 text-xs ${m.status === 'verified' ? 'bg-cyan/15 text-cyan' : 'bg-white/10 text-muted'}`}>{m.status}</span></div>
    {busy && <div className="mt-5"><div className="h-2 overflow-hidden rounded bg-white/10"><div className="h-full w-1/2 animate-pulse rounded bg-gradient-to-r from-magenta to-cyan"/></div><div className="mt-3 flex justify-between text-sm text-muted"><span>Mining 0xb07… {m.attempts.toLocaleString()} attempts</span><span>{m.rate.toLocaleString()} salts/sec</span></div></div>}
    {m.result && <div className="mt-5"><p className="text-xs text-muted">Verified predicted B20 address</p><p className="mt-1 break-all font-mono text-sm text-cyan">{m.result.token}</p><p className="mt-2 font-bold">✓ Ends with 0xb07</p><button className="mt-2 text-xs text-muted underline" onClick={() => setShowSalt(x => !x)}>{showSalt ? 'Hide salt' : 'Show raw salt'}</button>{showSalt && <p className="mt-2 break-all font-mono text-xs text-muted">{m.result.salt}</p>}</div>}
    {m.error && <p className="mt-4 text-sm text-red-300">{m.error}</p>}{m.status === 'exhausted' && <p className="mt-4 text-sm text-muted">No hit within 5,000,000 attempts. Try again with a fresh random start.</p>}
    <div className="mt-5 flex gap-3">{!busy && m.status !== 'verified' && <button type="button" onClick={m.start} className="btn btn-primary">Mine 0xb07</button>}{busy && <button type="button" onClick={m.stop} className="btn btn-ghost">Cancel</button>}{m.status === 'verified' && <button type="button" onClick={m.start} className="btn btn-ghost">Mine another</button>}</div>
  </div>;
}
