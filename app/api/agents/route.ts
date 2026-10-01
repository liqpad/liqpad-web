import {NextResponse} from 'next/server';
import {getAddress} from 'viem';
import {agentIdFor,normalizeAgentSlug,validAgentAddress} from '@/lib/agents';
import {requirePrivyUser,privyServer} from '@/lib/privy-server';
import {supabaseAdmin} from '@/lib/supabase';

const text=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
const publicFields='id,agent_id,slug,name,symbol,avatar_url,description,mission,personality,communication_style,website,twitter,human_creator,agent_wallet_address,fee_splitter_address,token_address,status,vitality,created_at,updated_at';

export async function GET(){
  const db=supabaseAdmin();
  if(!db)return NextResponse.json({error:'Agent database is not configured.'},{status:503});
  const {data,error}=await db.from('agents').select(publicFields).neq('status','draft').order('created_at',{ascending:false}).limit(24);
  if(error)return NextResponse.json({error:'Agent registry is temporarily unavailable.'},{status:500});
  return NextResponse.json({agents:data},{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=120'}});
}

export async function POST(req:Request){
  let auth:{user_id:string};
  try{auth=await requirePrivyUser(req)}catch{return NextResponse.json({error:'Sign in with Privy to create an agent.'},{status:401})}
  const db=supabaseAdmin();
  if(!db)return NextResponse.json({error:'Agent database is not configured.'},{status:503});
  try{
    const body=await req.json();
    const name=text(body.name,64),slug=normalizeAgentSlug(text(body.slug||body.name,64));
    const symbol=text(body.symbol,12).toUpperCase().replace(/[^A-Z0-9]/g,'');
    const description=text(body.description,1_000),mission=text(body.mission,1_000),personality=text(body.personality,1_000);
    if(name.length<2||slug.length<2||!/^\w/.test(slug)||symbol.length<2||description.length<10||mission.length<10||personality.length<10)return NextResponse.json({error:'Complete all required agent identity fields.'},{status:400});
    if(!validAgentAddress(body.humanCreator))return NextResponse.json({error:'Connect a valid creator wallet.'},{status:400});
    const existing=await db.from('agents').select(publicFields).eq('slug',slug).maybeSingle();
    if(existing.data)return NextResponse.json({error:'This agent slug is already registered.'},{status:409});
    const id=crypto.randomUUID();const agentId=agentIdFor(id);const externalId=`liqpad_${id.replaceAll('-','')}`;
    const wallet=await privyServer().wallets().create({chain_type:'ethereum',external_id:externalId,display_name:`Liqpad agent: ${name}`,idempotency_key:`agent-${id}`});
    const row={id,agent_id:agentId,slug,name,symbol,avatar_url:text(body.avatarUrl,500)||null,description,mission,personality,communication_style:text(body.communicationStyle,500)||null,website:text(body.website,300)||null,twitter:text(body.twitter,100)||null,human_creator:getAddress(body.humanCreator),agent_wallet_address:getAddress(wallet.address),status:'wallet_ready',vitality:'unlaunched'};
    const {data,error}=await db.from('agents').insert(row).select(publicFields).single();
    if(error)throw error;
    const binding=await db.from('agent_wallet_bindings').insert({agent_id:id,owner_privy_user_id:auth.user_id,privy_wallet_id:wallet.id,external_id:externalId});
    if(binding.error){await db.from('agents').delete().eq('id',id);throw binding.error}
    return NextResponse.json({agent:data},{status:201});
  }catch(error){
    console.error('Agent creation failed',error);
    return NextResponse.json({error:'Agent creation failed. No launch transaction was submitted.'},{status:500});
  }
}
