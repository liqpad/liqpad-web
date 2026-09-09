'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePublicClient } from 'wagmi';
import type { Address, Hex } from 'viem';
import { ADDRESSES } from '@/lib/constants';
import { predictAddressAbi } from '@/lib/b20Predict';
import { hasB07Suffix } from '@/lib/suffix';

export type MineResult = { salt: Hex; token: Address; attempts: number; elapsedMs: number };
type Status = 'idle' | 'mining' | 'verifying' | 'verified' | 'cancelled' | 'exhausted' | 'error';

export function useMineB07() {
  const client = usePublicClient();
  const worker = useRef<Worker | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [attempts, setAttempts] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [best, setBest] = useState<Address>();
  const [result, setResult] = useState<MineResult>();
  const [error, setError] = useState<string>();

  useEffect(() => () => worker.current?.terminate(), []);
  const stop = useCallback(() => { worker.current?.postMessage({ type: 'cancel' }); worker.current?.terminate(); worker.current = null; setStatus('cancelled'); }, []);
  const start = useCallback(() => {
    worker.current?.terminate(); setResult(undefined); setError(undefined); setAttempts(0); setElapsedMs(0); setStatus('mining');
    const w = new Worker(new URL('../workers/mineB07.ts', import.meta.url), { type: 'module' }); worker.current = w;
    w.onmessage = async ({ data }) => {
      setAttempts(data.attempts || 0); setElapsedMs(data.elapsedMs || 0); if (data.best) setBest(data.best);
      if (data.type === 'exhausted') { setStatus('exhausted'); w.terminate(); return; }
      if (data.type !== 'found') return;
      setStatus('verifying');
      try {
        const onchain = await client!.readContract({ address: ADDRESSES.factory, abi: predictAddressAbi, functionName: 'predictAddress', args: [data.salt] });
        if (onchain.toLowerCase() !== data.token.toLowerCase() || !hasB07Suffix(onchain)) throw new Error('Local prediction did not match Factory v2.');
        setResult({ ...data, token: onchain }); setStatus('verified');
      } catch (e) { setError(e instanceof Error ? e.message : 'On-chain verification failed.'); setStatus('error'); }
      finally { w.terminate(); worker.current = null; }
    };
    w.onerror = () => { setError('The mining worker stopped unexpectedly.'); setStatus('error'); };
    w.postMessage({ type: 'start', factory: ADDRESSES.factory, maxAttempts: 5_000_000 });
  }, [client]);
  return { status, attempts, elapsedMs, rate: elapsedMs ? Math.round(attempts / (elapsedMs / 1000)) : 0, best, result, error, start, stop };
}
