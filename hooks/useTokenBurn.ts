'use client';
import {useQuery} from '@tanstack/react-query';
import type {Address} from 'viem';
import {usePublicClient} from 'wagmi';
import {burnedSupplyRaw} from '@/lib/burn';
import {erc20Abi} from '@/src/abi/common';

export function useTokenBurn(token:Address,cachedBurnedRaw?:string|null){
  const client=usePublicClient();
  return useQuery({
    queryKey:['token-burn',token.toLowerCase()],
    enabled:!!client,
    initialData:cachedBurnedRaw??undefined,
    staleTime:30_000,
    retry:1,
    queryFn:async()=>{
      if(!client)throw new Error('RPC unavailable');
      const totalSupply=await client.readContract({address:token,abi:erc20Abi,functionName:'totalSupply'});
      return burnedSupplyRaw(totalSupply).toString();
    },
  });
}
