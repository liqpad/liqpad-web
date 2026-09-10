import {NextResponse} from 'next/server';
import {getAddress,isAddress} from 'viem';
import {ADDRESSES,SWAP_INDEXER_KEY} from '@/lib/constants';
import {supabaseAdmin,supabaseBrowser} from '@/lib/supabase';

export const dynamic='force-dynamic';
export async function GET(request:Request){
  const params=new URL(request.url).searchParams;const token=params.get('token');if(!token||!isAddress(token))return NextResponse.json({error:'Invalid token address.'},{status:400});
  const db=supabaseAdmin()||supabaseBrowser();if(!db)return NextResponse.json({rows:[],indexedBlock:null,warning:'Swap indexer is not configured.'});
  const cursor=params.get('cursor');let query=db.from('swaps').select('id,token,tx_hash,log_index,block_number,block_timestamp,sender,recipient,token_in,token_out,amount_in_raw,amount_out_raw,input_symbol,output_symbol,input_decimals,output_decimals,side').ilike('token',getAddress(token));
  if(cursor&&/^\d+:\d+$/.test(cursor)){const [block,log]=cursor.split(':');query=query.or(`block_number.lt.${block},and(block_number.eq.${block},log_index.lt.${log})`)}
  const [swaps,state]=await Promise.all([query.order('block_number',{ascending:false}).order('log_index',{ascending:false}).limit(21),db.from('indexer_state').select('last_block,updated_at,error').eq('key',SWAP_INDEXER_KEY).maybeSingle()]);
  if(swaps.error)return NextResponse.json({error:swaps.error.message},{status:500});
  const rows=swaps.data||[],hasMore=rows.length>20,visible=rows.slice(0,20),last=visible.at(-1);const nextCursor=hasMore&&last?`${last.block_number}:${last.log_index}`:null;
  return NextResponse.json({rows:visible,nextCursor,hasMore,indexedBlock:state.data?.last_block?String(state.data.last_block):null,indexedAt:state.data?.updated_at||null,warning:state.error?.message||state.data?.error||null,router:ADDRESSES.swapRouter},{headers:{'Cache-Control':'public, s-maxage=15, stale-while-revalidate=60'}});
}
