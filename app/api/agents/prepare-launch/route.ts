import {NextResponse} from 'next/server';
import {isAddress,isHash} from 'viem';
import {ADDRESSES} from '@/lib/constants';
import {publicClient} from '@/lib/data';
import {agentFeeSplitterFactoryAbi} from '@/src/abi/agentFeeSplitter';

export async function POST(req:Request){try{const {agentId,token,humanCreator,agentTreasury}=await req.json();if(typeof agentId!=='string'||!isHash(agentId)||![token,humanCreator,agentTreasury].every(value=>typeof value==='string'&&isAddress(value)))return NextResponse.json({error:'Invalid splitter configuration.'},{status:400});const splitter=await publicClient.readContract({address:ADDRESSES.agentFeeSplitterFactory,abi:agentFeeSplitterFactoryAbi,functionName:'predictSplitter',args:[agentId,token,humanCreator,agentTreasury]});return NextResponse.json({splitter})}catch(cause){return NextResponse.json({error:cause instanceof Error?cause.message:'Splitter prediction failed.'},{status:422})}}
