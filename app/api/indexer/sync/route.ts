import {NextResponse} from 'next/server';
import {runIndexerCycle} from '@/lib/indexer-runner';

export async function POST(req:Request){
  const secret=process.env.INDEXER_SECRET;
  if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
  try{return NextResponse.json(await runIndexerCycle())}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Indexer sync failed.'},{status:502})}
}
