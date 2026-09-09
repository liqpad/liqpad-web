import 'server-only';
import {NextResponse} from 'next/server';
import {getAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {ADDRESSES,CHAIN_ID} from '@/lib/constants';
import {publicClient} from '@/lib/data';
import {estimatedFdvUsd,frameForFdv,LAUNCH_QUOTE_TTL_SECONDS,validateQuoteInput} from '@/lib/launch-quote';
import {factoryAbi} from '@/src/abi/factory';
import {hasB07Suffix} from '@/lib/suffix';

const requests=new Map<string,{at:number;count:number}>();
function rateLimited(key:string){const now=Date.now();const entry=requests.get(key);if(!entry||now-entry.at>60_000){requests.set(key,{at:now,count:1});return false}entry.count++;return entry.count>10}

export async function POST(request:Request){
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
  if(rateLimited(ip))return NextResponse.json({error:'Too many quote requests. Try again shortly.'},{status:429});
  try{
    const privateKey=process.env.QUOTE_SIGNER_PRIVATE_KEY;
    if(!privateKey||!/^0x[0-9a-fA-F]{64}$/.test(privateKey))return NextResponse.json({error:'Launch quote signer is not configured.'},{status:503});
    const input=validateQuoteInput(await request.json());
    const priceKey=`base:${ADDRESSES.vvv}`;
    const priceResponse=await fetch(`https://coins.llama.fi/prices/current/${priceKey}`,{cache:'no-store',signal:AbortSignal.timeout(8_000)});
    if(!priceResponse.ok)throw new Error('VVV price source is unavailable.');
    const priceJson=await priceResponse.json();const price=priceJson.coins?.[priceKey];
    const vvvUsd=Number(price?.price);const priceTimestamp=Number(price?.timestamp||0);
    if(!Number.isFinite(vvvUsd)||vvvUsd<=0||Math.floor(Date.now()/1000)-priceTimestamp>120)throw new Error('VVV reference price is unavailable or stale.');
    const account=privateKeyToAccount(privateKey as `0x${string}`);
    const onchainSigner=await publicClient.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'quoteSigner'});
    if(getAddress(onchainSigner)!==getAddress(account.address))throw new Error('Configured signer does not match Factory quoteSigner.');
    const predictedToken=await publicClient.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'predictAddress',args:[input.launchSalt]});
    if(!hasB07Suffix(predictedToken))throw new Error('Launch salt must predict a branded 0xb07 token address.');
    const alreadyLaunched=await publicClient.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'isLiqpadLaunch',args:[predictedToken]});
    if(alreadyLaunched)throw new Error('Predicted token address is already in use. Generate a new salt.');
    const quotedFrame=frameForFdv(input.targetFdvUsd,vvvUsd);const validUntil=BigInt(Math.floor(Date.now()/1000)+LAUNCH_QUOTE_TTL_SECONDS);
    const [poolTick,tickLower,tickUpper]=await publicClient.readContract({address:ADDRESSES.factory,abi:factoryAbi,functionName:'ticksFor',args:[predictedToken,quotedFrame]});
    const quote={quotedFrame,validUntil,creator:input.creator,launchSalt:input.launchSalt} as const;
    const signature=await account.signTypedData({domain:{name:'LiqpadFactory',version:'1',chainId:CHAIN_ID,verifyingContract:ADDRESSES.factory},types:{LaunchQuote:[{name:'quotedFrame',type:'int24'},{name:'validUntil',type:'uint64'},{name:'creator',type:'address'},{name:'launchSalt',type:'bytes32'}]},primaryType:'LaunchQuote',message:quote});
    return NextResponse.json({quote:{...quote,validUntil:validUntil.toString()},signature,predictedToken,poolTick,tickLower,tickUpper,estimatedOpeningFDV:estimatedFdvUsd(quotedFrame,vvvUsd),vvvUsd,priceTimestamp});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to create launch quote.'},{status:422})}
}
