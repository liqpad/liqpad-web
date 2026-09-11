import {NextResponse} from 'next/server';
import {supabaseAdmin,supabaseBrowser} from '@/lib/supabase';
import {protocolChartSeries,serializeChartPoint} from '@/lib/protocol-chart';
import {getVvvUsdPrice} from '@/lib/vvv-price';
import {ADDRESSES} from '@/lib/constants';
import type {ProtocolEventRow} from '@/lib/transparency';

export const dynamic='force-dynamic';

export async function GET(){
  const db=supabaseAdmin()||supabaseBrowser();
  if(!db)return NextResponse.json({series:[],price:null,error:'Supabase is not configured.'},{status:503});
  const [{data,error},price]=await Promise.all([
    db.from('protocol_events').select('*').in('event_name',['FeeAccrued','PlatformSwept','Harvest']).not('block_timestamp','is',null).order('block_number',{ascending:true}).order('log_index',{ascending:true}).limit(5000),
    getVvvUsdPrice(ADDRESSES.vvv).catch(()=>null),
  ]);
  if(error)return NextResponse.json({series:[],price:null,error:error.message},{status:500});
  const series=protocolChartSeries((data||[]) as ProtocolEventRow[]).map(serializeChartPoint);
  return NextResponse.json({series,price:price?{usd:price.price,source:price.source,timestamp:price.timestamp}:null,truncated:(data?.length||0)>=5000},{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=120'}});
}
