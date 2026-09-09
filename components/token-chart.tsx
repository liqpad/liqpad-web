'use client';
import {useQuery} from '@tanstack/react-query';
import type {Address} from 'viem';

type ChartResult={provider:'geckoterminal'|'dexscreener'|null;pool:string|null;embedUrl:string|null;indexing?:boolean};
export function TokenChart({token,symbol}:{token:Address;symbol:string}){
  const chart=useQuery({queryKey:['token-chart',token],queryFn:async()=>{const response=await fetch(`/api/chart/${token}`);if(!response.ok)throw new Error('Chart resolver unavailable.');return response.json() as Promise<ChartResult>},staleTime:60_000,refetchInterval:query=>query.state.data?.embedUrl?false:30_000,retry:2});
  if(chart.data?.embedUrl)return <div className="card h-[360px] min-w-0 max-w-full overflow-hidden p-0 sm:h-[460px] lg:h-[540px]"><iframe src={chart.data.embedUrl} title={`${symbol} price chart`} className="block h-full min-w-0 max-w-full border-0" style={{width:'100%'}} loading="lazy" allow="clipboard-write"/></div>;
  return <div className="card grid min-h-[320px] min-w-0 max-w-full place-items-center overflow-hidden p-5 text-center sm:min-h-[420px] sm:p-8"><div><div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-cyan/20"/><h2 className="mt-5 font-display text-xl font-bold">{chart.isError?'Chart temporarily unavailable':'Pool chart indexing…'}</h2><p className="mt-2 max-w-md text-muted">{chart.isError?'The chart provider could not be reached. Liqpad will retry automatically.':'Waiting for the B20/VVV pool on GeckoTerminal or Dexscreener.'}</p></div></div>;
}
