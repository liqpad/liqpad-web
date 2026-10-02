import {NextResponse} from 'next/server';
import {runIndexerCycle} from '@/lib/indexer-runner';
import {logSafeError} from '@/lib/safe-error';

export async function POST(req:Request){
  const secret=process.env.INDEXER_SECRET;
  if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
  try{return NextResponse.json(await runIndexerCycle())}
  catch(error){logSafeError('Indexer sync failed',error);return NextResponse.json({error:'Indexer sync failed. Check the protected server logs.'},{status:502})}
}
