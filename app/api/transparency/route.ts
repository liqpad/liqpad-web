import {NextResponse} from 'next/server';
import type {Abi,Address} from 'viem';
import {ADDRESSES,PROTOCOL_INDEXER_KEY} from '@/lib/constants';
import {publicClient} from '@/lib/data';
import {supabaseAdmin,supabaseBrowser} from '@/lib/supabase';
import {getVvvUsdPrice} from '@/lib/vvv-price';
import {erc20Abi} from '@/src/abi/common';
import {feeRouterAbi} from '@/src/abi/feeRouter';
import {diemEngineAbi} from '@/src/abi/diemEngine';
import {sumField,tokenContributions,type ProtocolEventRow} from '@/lib/transparency';
import {getDiemUsdPrice} from '@/lib/diem-price';

export const dynamic='force-dynamic';
const read=(result:{status:'success';result:unknown}|{status:'failure'})=>result.status==='success'?(typeof result.result==='bigint'?result.result.toString():result.result):null;
const jsonSafe=<T,>(value:T):T=>JSON.parse(JSON.stringify(value,(_key,item)=>typeof item==='bigint'?item.toString():item)) as T;

export async function GET(){
  const contracts=[
    {address:ADDRESSES.feeRouter,abi:feeRouterAbi,functionName:'platformAccrued'},
    ...['owner','reserveBps','minOutBps','minMintSVVV','unwindDelay','autoStakeDiem','harvestPaused','vvvReceived','vvvStaked','sVVVLocked','diemMinted','diemStaked','diemLiquid','accountedLiquidVVV','pendingUnwindDiem','unwindReadyAt','unwindStarted'].map(functionName=>({address:ADDRESSES.diemEngine,abi:diemEngineAbi,functionName})),
    {address:ADDRESSES.vvv,abi:erc20Abi,functionName:'balanceOf',args:[ADDRESSES.feeRouter]},
    {address:ADDRESSES.vvv,abi:erc20Abi,functionName:'balanceOf',args:[ADDRESSES.diemEngine]},
    {address:ADDRESSES.vvv,abi:erc20Abi,functionName:'balanceOf',args:[ADDRESSES.adapter]},
    {address:ADDRESSES.svvv,abi:erc20Abi,functionName:'balanceOf',args:[ADDRESSES.adapter]},
    {address:ADDRESSES.diem,abi:erc20Abi,functionName:'balanceOf',args:[ADDRESSES.adapter]},
  ] as const;
  const [reads,priceResult,diemPriceResult,latestResult]=await Promise.all([
    publicClient.multicall({contracts:contracts as readonly {address:Address;abi:Abi;functionName:string;args?:readonly unknown[]}[],allowFailure:true}),
    getVvvUsdPrice(ADDRESSES.vvv).catch(()=>null),
    getDiemUsdPrice(ADDRESSES.diem).catch(()=>null),
    publicClient.getBlockNumber().catch(()=>null),
  ]);
  const names=['platformAccrued','owner','reserveBps','minOutBps','minMintSVVV','unwindDelay','autoStakeDiem','harvestPaused','vvvReceived','vvvStaked','sVVVLocked','diemMinted','diemStaked','diemLiquid','accountedLiquidVVV','pendingUnwindDiem','unwindReadyAt','unwindStarted','feeRouterVvv','engineVvv','adapterVvv','adapterSvvv','adapterDiem'];
  const current=Object.fromEntries(names.map((name,index)=>[name,read(reads[index] as never)]));
  const db=supabaseAdmin()||supabaseBrowser();let events:ProtocolEventRow[]=[];let indexedBlock:string|null=null;let dbError:string|null=null;let historyComplete=true;
  let tokenMeta:Record<string,{name:string;symbol:string}>={};
  if(db){
    const [eventQuery,stateQuery,tokenQuery]=await Promise.all([db.from('protocol_events').select('*',{count:'exact'}).order('block_number',{ascending:false}).order('log_index',{ascending:false}).limit(5000),db.from('indexer_state').select('last_block,updated_at,error').eq('key',PROTOCOL_INDEXER_KEY).maybeSingle(),db.from('tokens').select('address,name,symbol').eq('factory_address',ADDRESSES.factory.toLowerCase())]);
    if(eventQuery.error)dbError=eventQuery.error.message;else{events=(eventQuery.data||[]) as ProtocolEventRow[];historyComplete=(eventQuery.count||0)<=events.length}
    if(!stateQuery.error&&stateQuery.data)indexedBlock=String(stateQuery.data.last_block);
    if(!tokenQuery.error)tokenMeta=Object.fromEntries((tokenQuery.data||[]).map(row=>[String(row.address).toLowerCase(),{name:String(row.name||''),symbol:String(row.symbol||'')}]))
  }else dbError='Supabase is not configured; event history is unavailable.';
  const feeEvents=events.filter(event=>event.event_name==='FeeAccrued');
  const sweepEvents=events.filter(event=>event.event_name==='PlatformSwept');
  const lifetimeProtocolFees=historyComplete?sumField(feeEvents,'amount_vvv').toString():null;
  const totalSwept=historyComplete?sumField(sweepEvents,'amount_vvv').toString():null;
  const tokenRows=tokenContributions(feeEvents).map(row=>({...row,creatorAmount:row.creatorAmount.toString(),platformAmount:row.platformAmount.toString(),...tokenMeta[row.token.toLowerCase()]}));
  const addresses={factory:ADDRESSES.factory,hook:ADDRESSES.hook,feeRouter:ADDRESSES.feeRouter,diemEngine:ADDRESSES.diemEngine,adapter:ADDRESSES.adapter,vvv:ADDRESSES.vvv,svvvProxy:ADDRESSES.svvv,svvvImplementation:ADDRESSES.svvvImplementation,diem:ADDRESSES.diem};
  return NextResponse.json(jsonSafe({chainId:8453,updatedAt:new Date().toISOString(),latestBlock:latestResult?.toString()||null,indexedBlock,price:priceResult?{usd:priceResult.price,source:priceResult.source,timestamp:priceResult.timestamp}:null,diemPrice:diemPriceResult?{usd:diemPriceResult.price,source:diemPriceResult.source,timestamp:diemPriceResult.timestamp}:null,current,lifetime:{protocolFees:lifetimeProtocolFees,totalSwept},events,contributions:tokenRows,addresses,warnings:{rpc:reads.some(item=>item.status==='failure')?'Some contract reads failed. Unavailable values were not replaced with zero.':null,database:dbError,history:!historyComplete?'The event result limit was reached; lifetime totals are withheld.':null,stale:indexedBlock&&latestResult&&BigInt(indexedBlock)+50n<latestResult?'Protocol event indexer is behind the Base chain tip.':null,diemPrice:diemPriceResult?null:'DIEM/USD price is temporarily unavailable from GeckoTerminal.'}}),{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=120'}});
}
