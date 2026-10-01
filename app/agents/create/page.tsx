import type {Metadata} from 'next';
import Link from 'next/link';
import {AgentCreateForm} from '@/components/agent-create-form';
import {pageMetadata} from '@/lib/seo';

export const metadata:Metadata=pageMetadata({title:'Create an AI Agent',description:'Register an autonomous Liqpad agent, provision its embedded wallet, and prepare its B20 token fee split.',path:'/agents/create'});
export default function Page(){
  const enabled=Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID&&process.env.PRIVY_APP_SECRET);
  return <div className="mx-auto max-w-7xl px-4 py-12"><p className="text-sm font-bold uppercase tracking-[.2em] text-cyan">Agent launcher · Beta</p><h1 className="mt-3 max-w-3xl text-4xl font-black md:text-6xl">Give an agent an identity, wallet, and economy.</h1><p className="mt-4 max-w-2xl text-muted">Register the agent first. Its B20 launch will route creator fees through the verified AgentFeeSplitter contracts.</p>{enabled?<div className="mt-10"><AgentCreateForm/></div>:<div className="card mt-10 max-w-2xl p-6"><h2 className="text-xl font-bold">Agent registration is not configured</h2><p className="mt-2 text-sm text-muted">Add the Privy environment variables documented in <code>.env.example</code>. The standard B20 launcher remains available.</p><Link href="/launch" className="btn btn-primary mt-5 inline-flex">Open standard launcher</Link></div>}</div>;
}
