/// <reference lib="webworker" />
import type {Address,Hex} from 'viem';
import {predictB20AssetAddressUnchecked} from '../lib/b20Predict';
import {hasB07Suffix} from '../lib/suffix';

type Command={type:'start';factory:Address;maxAttempts?:number}|{type:'cancel'};
let cancelled=false;
self.onmessage=(event:MessageEvent<Command>)=>{
  if(event.data.type==='cancel'){cancelled=true;return}
  cancelled=false;const {factory}=event.data;const maximum=event.data.maxAttempts??5_000_000;self.postMessage({type:'started',attempts:0,elapsedMs:0});
  const seed=new Uint8Array(32);crypto.getRandomValues(seed);const start=BigInt(`0x${Array.from(seed,b=>b.toString(16).padStart(2,'0')).join('')}`);let counter=start;let attempts=0;const began=performance.now();
  const batch=256;const run=()=>{for(let index=0;index<batch;index++){if(cancelled){self.postMessage({type:'cancelled',attempts,elapsedMs:performance.now()-began});return}if(attempts>=maximum){self.postMessage({type:'exhausted',attempts,elapsedMs:performance.now()-began});return}const salt=`0x${counter.toString(16).padStart(64,'0')}` as Hex;const token=predictB20AssetAddressUnchecked(salt,factory);attempts++;counter=(counter+1n)&((1n<<256n)-1n);if(hasB07Suffix(token)){self.postMessage({type:'found',salt,token,attempts,elapsedMs:performance.now()-began});return}}self.postMessage({type:'progress',attempts,elapsedMs:performance.now()-began});setTimeout(run,0)};run();
};
export {};
