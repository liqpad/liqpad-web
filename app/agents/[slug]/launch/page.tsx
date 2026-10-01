import type {Metadata} from 'next';
import {notFound,redirect} from 'next/navigation';
import {AgentLaunchWizard} from '@/components/agent-launch-wizard';
import {supabaseAdmin} from '@/lib/supabase';
import type {PublicAgent} from '@/lib/agents';
import {normalizeAgentSlug} from '@/lib/agents';

export const metadata:Metadata={title:'Launch Agent Token',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{slug:string}>}){const slug=normalizeAgentSlug((await params).slug);const db=supabaseAdmin();if(!db)notFound();const {data}=await db.from('agents').select('id,agent_id,slug,name,symbol,avatar_url,description,mission,personality,communication_style,website,twitter,human_creator,agent_wallet_address,fee_splitter_address,token_address,status,vitality,created_at,updated_at').eq('slug',slug).maybeSingle();if(!data)notFound();if(data.token_address)redirect(`/token/${data.token_address}`);const privyReady=Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID&&process.env.PRIVY_APP_SECRET);return <div className="mx-auto max-w-3xl px-4 py-12"><p className="text-sm font-bold uppercase tracking-[.2em] text-cyan">Agent economy</p><h1 className="mt-3 text-4xl font-black">Bring {data.name} on-chain.</h1><p className="mt-3 text-muted">The splitter is created first, then the B20 token launches with that splitter as its immutable creator.</p><div className="mt-8">{privyReady?<AgentLaunchWizard agent={data as PublicAgent}/>:<div className="card p-6 text-muted">Privy is not configured for agent launches.</div>}</div></div>}
