import {publicClient} from '@/lib/data';
import {syncFactoryLaunches} from '@/lib/factory-indexer';
import {syncProtocolEvents} from '@/lib/protocol-indexer';
import {syncSwapEvents} from '@/lib/swap-indexer';
import {syncMarketMetrics} from '@/lib/market-indexer';
import {syncAgentFeeEvents} from '@/lib/agent-fee-indexer';

type Failure={error:string};
const safe=async<T>(job:Promise<T>):Promise<T|Failure>=>job.catch(error=>({error:error instanceof Error?error.message:'Indexer failed.'}));
const isFailure=(value:unknown):value is Failure=>Boolean(value&&typeof value==='object'&&'error' in value);

export async function runIndexerCycle({includeMarket=true}:{includeMarket?:boolean}={}){
  const latest=await publicClient.getBlockNumber();
  const [factory,protocol,swaps,agents]=await Promise.all([
    safe(syncFactoryLaunches(latest)),safe(syncProtocolEvents(latest)),safe(syncSwapEvents(latest)),safe(syncAgentFeeEvents(latest)),
  ]);
  const market=includeMarket?await safe(syncMarketMetrics()):null;
  const results=[factory,protocol,swaps,agents,...(market?[market]:[])];
  const errors=results.filter(isFailure).map(result=>result.error);
  const caughtUp=results.every(result=>!isFailure(result)&&result.caughtUp===true);
  return {latestBlock:latest.toString(),healthy:errors.length===0,caughtUp,errors,factory,protocol,swaps,agents,market,updatedAt:new Date().toISOString()};
}
