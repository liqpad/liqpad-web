import {runIndexerCycle} from '@/lib/indexer-runner';
import {boundedInteger,retryDelayMs,sleep} from '@/lib/indexer-config';
import {supabaseAdmin} from '@/lib/supabase';

const workerId=process.env.INDEXER_WORKER_ID||'liqpad-indexer-primary';
const pollMs=boundedInteger(process.env.INDEXER_POLL_INTERVAL_MS,12_000,1_000,300_000);
const marketMs=boundedInteger(process.env.INDEXER_MARKET_INTERVAL_MS,60_000,10_000,3_600_000);
const retryBaseMs=boundedInteger(process.env.INDEXER_RETRY_BASE_MS,2_000,500,60_000);
const retryMaxMs=boundedInteger(process.env.INDEXER_RETRY_MAX_MS,60_000,retryBaseMs,600_000);
let stopping=false,failures=0,lastMarketAt=0;

async function heartbeat(status:'starting'|'running'|'degraded'|'stopping',result:unknown=null,error:string|null=null){
  const db=supabaseAdmin();if(!db)throw new Error('Supabase service role is not configured.');
  const now=new Date().toISOString();
  const row:Record<string,unknown>={id:workerId,status,last_heartbeat_at:now,last_error:error,result,updated_at:now};
  if(status==='running')row.last_success_at=now;
  const {error:writeError}=await db.from('indexer_workers').upsert(row,{onConflict:'id'});
  if(writeError)throw new Error(writeError.message);
}

async function main(){
  if(!process.env.BASE_RPC_URL&&!process.env.INDEXER_RPC_URL)throw new Error('INDEXER_RPC_URL or BASE_RPC_URL is required.');
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Supabase server credentials are required.');
  await heartbeat('starting');
  while(!stopping){
    try{
      const now=Date.now(),includeMarket=now-lastMarketAt>=marketMs;
      const result=await runIndexerCycle({includeMarket});
      if(includeMarket)lastMarketAt=now;
      console.log(JSON.stringify({workerId,...result}));
      if(!result.healthy){
        failures++;
        const message=result.errors.join(' | '),delay=retryDelayMs(failures,retryBaseMs,retryMaxMs);
        await heartbeat('degraded',result,message);
        await sleep(delay);
        continue;
      }
      failures=0;
      await heartbeat('running',result);
      await sleep(result.caughtUp?pollMs:1_000);
    }catch(error){
      failures++;
      const message=error instanceof Error?error.message:'Indexer worker failed.';
      const delay=retryDelayMs(failures,retryBaseMs,retryMaxMs);
      console.error(JSON.stringify({workerId,error:message,failures,retryInMs:delay}));
      try{await heartbeat('degraded',null,message)}catch(heartbeatError){console.error(heartbeatError)}
      await sleep(delay);
    }
  }
  await heartbeat('stopping');
}

for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{stopping=true;});
main().catch(error=>{console.error(error);process.exitCode=1;});
