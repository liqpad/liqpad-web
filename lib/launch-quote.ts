import { isAddress, isHash, type Address, type Hex } from 'viem';

export const MIN_QUOTED_FRAME=80_000;
export const MAX_QUOTED_FRAME=200_000;
export const LAUNCH_QUOTE_TTL_SECONDS=300;

export type LaunchQuotePayload={quotedFrame:number;validUntil:bigint;creator:Address;launchSalt:Hex};
export type SignedLaunchQuote={quote:{quotedFrame:number;validUntil:string;creator:Address;launchSalt:Hex};signature:Hex;predictedToken:Address;poolTick:number;tickLower:number;tickUpper:number;estimatedOpeningFDV:number;vvvUsd:number;priceTimestamp:number};

export function createLaunchSalt():Hex {
  const bytes=new Uint8Array(32); crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}`;
}
export function isQuoteExpired(validUntil:string|bigint,now=Math.floor(Date.now()/1000)){return BigInt(validUntil)<=BigInt(now)}
export function validateQuoteInput(input:unknown):{creator:Address;launchSalt:Hex;targetFdvUsd:number}{
  if(!input||typeof input!=='object')throw new Error('Invalid quote request.');
  const {creator,launchSalt,targetFdvUsd}=input as Record<string,unknown>;
  const fdv=Number(targetFdvUsd);
  if(typeof creator!=='string'||!isAddress(creator))throw new Error('Invalid creator address.');
  if(typeof launchSalt!=='string'||!isHash(launchSalt)||launchSalt.length!==66)throw new Error('Invalid launch salt.');
  if(!Number.isFinite(fdv)||fdv<100||fdv>10_000_000)throw new Error('Target FDV must be between $100 and $10M.');
  return {creator,launchSalt:launchSalt as Hex,targetFdvUsd:fdv};
}
export function frameForFdv(targetFdvUsd:number,vvvUsd:number){
  if(!Number.isFinite(vvvUsd)||vvvUsd<=0)throw new Error('VVV/USD price is unavailable.');
  const fdvVvv=targetFdvUsd/vvvUsd;
  const raw=Math.log(1_000_000_000/fdvVvv)/Math.log(1.0001);
  return Math.max(MIN_QUOTED_FRAME,Math.min(MAX_QUOTED_FRAME,Math.round(raw/200)*200));
}
export function estimatedFdvUsd(frame:number,vvvUsd:number){return 1_000_000_000/Math.pow(1.0001,frame)*vvvUsd}
