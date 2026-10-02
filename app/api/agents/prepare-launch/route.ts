import {NextResponse} from 'next/server';
import {isAddress,isHash} from 'viem';
import {ADDRESSES} from '@/lib/constants';
import {serverPublicClient} from '@/lib/server-public-client';
import {agentFeeSplitterFactoryAbi} from '@/src/abi/agentFeeSplitter';
import {logSafeError} from '@/lib/safe-error';

export async function POST(req:Request){try{const {agentId,token,humanCreator,agentTreasury}=await req.json();if(typeof agentId!=='string'||!isHash(agentId)||![token,humanCreator,agentTreasury].every(value=>typeof value==='string'&&isAddress(value)))return NextResponse.json({error:'Invalid splitter configuration.'},{status:400});const splitter=await serverPublicClient.readContract({address:ADDRESSES.agentFeeSplitterFactory,abi:agentFeeSplitterFactoryAbi,functionName:'predictSplitter',args:[agentId,token,humanCreator,agentTreasury]});return NextResponse.json({splitter})}catch(cause){logSafeError('Splitter prediction failed',cause);return NextResponse.json({error:'Splitter prediction is temporarily unavailable. Please try again.'},{status:422})}}
