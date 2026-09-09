import {isAddress,type Address} from 'viem';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {getLaunches,short} from '@/lib/data';
import {ClaimAll} from '@/components/claim-all';

export default async function Page({params}:{params:Promise<{address:string}>}){
  const {address}=await params;if(!isAddress(address))notFound();const all=await getLaunches();const items=all.filter(item=>item.creator.toLowerCase()===address.toLowerCase());
  return <div className="mx-auto max-w-5xl px-4 py-12"><div className="flex items-center gap-4"><div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-magenta to-cyan text-2xl font-black">{address.slice(2,4).toUpperCase()}</div><div><p className="text-sm text-cyan">Creator</p><h1 className="font-mono text-xl md:text-3xl">{short(address)}</h1></div></div><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="card p-5"><p className="text-sm text-muted">Tokens launched</p><p className="mt-2 text-3xl font-bold">{items.length}</p></div><div className="card p-5"><p className="text-sm text-muted">Combined market cap</p><p className="mt-2 text-2xl font-bold">Indexing…</p></div><ClaimAll creator={address as Address} tokens={items.map(item=>item.token as Address)}/></div><h2 className="mt-12 font-display text-2xl font-bold">Launches</h2><div className="mt-4 space-y-3">{items.length?items.map(item=><Link className="card flex items-center p-4" href={`/token/${item.token}`} key={item.token}><b>{item.name}</b><span className="ml-2 text-muted">{item.symbol}</span><span className="ml-auto text-cyan">LP locked →</span></Link>):<div className="card p-10 text-center text-muted">This address has not launched a token in the indexed window.</div>}</div></div>;
}
