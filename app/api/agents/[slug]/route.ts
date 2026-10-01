import {NextResponse} from 'next/server';
import {normalizeAgentSlug} from '@/lib/agents';
import {supabaseAdmin} from '@/lib/supabase';

const fields='id,agent_id,slug,name,symbol,avatar_url,description,mission,personality,communication_style,website,twitter,human_creator,agent_wallet_address,fee_splitter_address,token_address,status,vitality,created_at,updated_at';
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  const db=supabaseAdmin();if(!db)return NextResponse.json({error:'Agent database is not configured.'},{status:503});
  const slug=normalizeAgentSlug((await params).slug);const {data,error}=await db.from('agents').select(fields).eq('slug',slug).neq('status','draft').maybeSingle();
  if(error)return NextResponse.json({error:'Agent registry is temporarily unavailable.'},{status:500});
  if(!data)return NextResponse.json({error:'Agent not found.'},{status:404});
  return NextResponse.json({agent:data},{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=120'}});
}
