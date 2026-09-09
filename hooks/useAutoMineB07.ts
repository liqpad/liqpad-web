'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {getAddress,type Address,type Hex} from 'viem';
import {usePublicClient} from 'wagmi';
import {ADDRESSES} from '@/lib/constants';
import {factoryAbi} from '@/src/abi/factory';
import {hasB07Suffix} from '@/lib/suffix';

type Result={salt:Hex;token:Address;attempts:number;elapsedMs:number};
type WorkerMessage={type:'started'|'progress'|'found'|'exhausted'|'cancelled';salt?:Hex;token?:Address;attempts:number;elapsedMs:number};
const WORKER_COUNT=2;

export function useAutoMineB07(){
  const client=usePublicClient();
  const workers=useRef<Worker[]>([]);const won=useRef(false);const progress=useRef(new Map<number,{attempts:number;elapsedMs:number}>());const resultRef=useRef<Result|undefined>(undefined);
  const [status,setStatus]=useState<'idle'|'starting'|'mining'|'verifying'|'verified'|'error'>('idle');const [result,setResultState]=useState<Result|undefined>(undefined);const [attempts,setAttempts]=useState(0);const [rate,setRate]=useState(0);const [error,setError]=useState('');
  const setResult=useCallback((next:Result|undefined)=>{resultRef.current=next;setResultState(next)},[]);
  const stop=useCallback(()=>{workers.current.forEach(item=>item.terminate());workers.current=[]},[]);
  const start=useCallback(()=>{
    stop();won.current=false;progress.current.clear();setResult(undefined);setAttempts(0);setRate(0);setError('');setStatus('starting');
    const fail=(message:string)=>{if(won.current)return;won.current=true;stop();setStatus('error');setError(message)};
    for(let id=0;id<WORKER_COUNT;id++){
      const instance=new Worker(new URL('../workers/mineB07.ts',import.meta.url),{type:'module'});workers.current.push(instance);
      const startupTimer=setTimeout(()=>fail('Address miner did not start. Select Try again.'),8000);
      instance.onerror=()=>{clearTimeout(startupTimer);fail('Address miner failed to load. Select Try again.')};
      instance.onmessageerror=()=>{clearTimeout(startupTimer);fail('Address miner message failed. Select Try again.')};
      instance.onmessage=(event:MessageEvent<WorkerMessage>)=>{
        const data=event.data;if(data.type==='started'){clearTimeout(startupTimer);setStatus('mining');return}
        progress.current.set(id,{attempts:data.attempts,elapsedMs:data.elapsedMs});const totals=[...progress.current.values()];const totalAttempts=totals.reduce((sum,item)=>sum+item.attempts,0);const slowest=Math.max(1,...totals.map(item=>item.elapsedMs));setAttempts(totalAttempts);setRate(Math.round(totalAttempts/(slowest/1000)));
        if(data.type==='progress'||data.type==='cancelled')return;
        if(data.type==='exhausted'){fail('Address search reached its limit. Select Try again.');return}
        if(data.type!=='found'||!data.salt||!data.token||won.current)return;
        won.current=true;stop();const candidate={salt:data.salt,token:getAddress(data.token),attempts:totalAttempts,elapsedMs:slowest};setResult(candidate);setStatus('verified');setError('');
      };
      instance.postMessage({type:'start',factory:ADDRESSES.factory,maxAttempts:2_500_000});
    }
  },[setResult,stop]);
  const verify=useCallback(async()=>{
    const candidate=resultRef.current;if(!candidate)throw new Error('The branded 0xb07 address is still being prepared.');if(!client)throw new Error('Base RPC is temporarily unavailable. Your 0xb07 address has been kept; please try again.');
    setStatus('verifying');
    try{
      const onchain=await client.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'predictAddress',args:[candidate.salt]});
      if(getAddress(onchain)!==getAddress(candidate.token)||!hasB07Suffix(onchain)){start();throw new Error('Address prediction changed. A new 0xb07 address is being prepared.')}
      const alreadyLaunched=await client.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'isLiqpadLaunch',args:[onchain]});
      if(alreadyLaunched){start();throw new Error('That address was already used. A new 0xb07 address is being prepared.')}
      const verified={...candidate,token:getAddress(onchain)};setResult(verified);setStatus('verified');return verified;
    }catch(reason){
      if(!resultRef.current)throw reason;
      setStatus('verified');throw new Error(`Base RPC verification failed. Your 0xb07 address has been kept; please try again. ${reason instanceof Error?reason.message:''}`.trim());
    }
  },[client,setResult,start]);
  useEffect(()=>{start();return stop},[start,stop]);
  return {status,result,attempts,rate,error,restart:start,verify};
}
