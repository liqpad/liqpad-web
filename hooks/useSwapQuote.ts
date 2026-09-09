'use client';
import {useQuery} from '@tanstack/react-query';
import {useEffect,useState} from 'react';
import {usePublicClient} from 'wagmi';
import type {Address} from 'viem';
import {ADDRESSES} from '@/lib/constants';
import type {RouteAsset,SwapSide} from '@/lib/swap';
import {aerodromeRouterAbi,v4QuoterAbi} from '@/src/abi/swapSupport';
import {swapRouterAbi} from '@/src/abi/swapRouter';

const route=(from:Address,to:Address)=>({from,to,stable:false,factory:ADDRESSES.aerodromeFactory});
const aeroPath=(asset:RouteAsset,side:SwapSide)=>{
  if(asset==='ETH')return side==='buy'?[route(ADDRESSES.weth,ADDRESSES.vvv)]:[route(ADDRESSES.vvv,ADDRESSES.weth)];
  return side==='buy'?[route(ADDRESSES.usdc,ADDRESSES.weth),route(ADDRESSES.weth,ADDRESSES.vvv)]:[route(ADDRESSES.vvv,ADDRESSES.weth),route(ADDRESSES.weth,ADDRESSES.usdc)];
};
export function useSwapQuote(token:Address,asset:RouteAsset,side:SwapSide,amountIn:bigint){
  const client=usePublicClient();const [debouncedAmount,setDebouncedAmount]=useState(amountIn);
  useEffect(()=>{const timer=setTimeout(()=>setDebouncedAmount(amountIn),350);return()=>clearTimeout(timer)},[amountIn]);
  return useQuery({queryKey:['liqpad-v1-swap-quote',token,asset,side,debouncedAmount.toString()],enabled:!!client&&debouncedAmount>0n,staleTime:10_000,retry:1,queryFn:async()=>{
    if(!client)throw new Error('RPC unavailable');
    const key=await client.readContract({address:ADDRESSES.swapRouter,abi:swapRouterAbi,functionName:'poolKey',args:[token]});
    if(side==='buy'){
      const vvvIn=asset==='VVV'?debouncedAmount:(await client.readContract({address:ADDRESSES.aerodromeRouter,abi:aerodromeRouterAbi,functionName:'getAmountsOut',args:[debouncedAmount,aeroPath(asset,side)]})).at(-1)||0n;
      if(vvvIn<=0n)throw new Error('No route liquidity to VVV.');
      const zeroForOne=key.currency0.toLowerCase()===ADDRESSES.vvv.toLowerCase();
      const quoted=await client.simulateContract({address:ADDRESSES.v4Quoter,abi:v4QuoterAbi,functionName:'quoteExactInputSingle',args:[{poolKey:key,zeroForOne,exactAmount:vvvIn,hookData:'0x'}]});
      return {amountIn:debouncedAmount,vvvAmount:vvvIn,output:quoted.result[0],route:`${asset}${asset==='USDC'?' → WETH':''} → VVV → B20`,quotedAt:Date.now()};
    }
    const zeroForOne=key.currency0.toLowerCase()===token.toLowerCase();
    const v4=await client.simulateContract({address:ADDRESSES.v4Quoter,abi:v4QuoterAbi,functionName:'quoteExactInputSingle',args:[{poolKey:key,zeroForOne,exactAmount:debouncedAmount,hookData:'0x'}]});
    const vvvOut=v4.result[0];const output=asset==='VVV'?vvvOut:(await client.readContract({address:ADDRESSES.aerodromeRouter,abi:aerodromeRouterAbi,functionName:'getAmountsOut',args:[vvvOut,aeroPath(asset,side)]})).at(-1)||0n;
    if(output<=0n)throw new Error('No route liquidity from VVV.');
    return {amountIn:debouncedAmount,vvvAmount:vvvOut,output,route:`B20 → VVV${asset==='USDC'?' → WETH':''} → ${asset}`,quotedAt:Date.now()};
  }});
}
