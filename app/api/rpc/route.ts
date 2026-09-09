import {NextResponse} from 'next/server';
import {MAX_RPC_BODY_BYTES,validateRpcPayload} from '@/lib/rpc-proxy';

export const dynamic='force-dynamic';
export const runtime='nodejs';

const WINDOW_MS=60_000;
const MAX_REQUESTS_PER_WINDOW=120;
const requests=new Map<string,{startedAt:number;count:number}>();

function isRateLimited(key:string,cost:number){
  const now=Date.now();const current=requests.get(key);
  if(!current||now-current.startedAt>=WINDOW_MS){requests.set(key,{startedAt:now,count:cost});return false}
  current.count+=cost;return current.count>MAX_REQUESTS_PER_WINDOW;
}

function error(message:string,status:number,id:null|string|number=null){
  return NextResponse.json({jsonrpc:'2.0',id,error:{code:-32600,message}},{status,headers:{'Cache-Control':'no-store'}});
}

export async function POST(request:Request){
  const rpcUrl=process.env.BASE_RPC_URL?.trim();
  if(!rpcUrl)return error('RPC service is not configured.',503);
  if(request.headers.get('sec-fetch-site')==='cross-site')return error('Cross-site RPC requests are not allowed.',403);
  const declaredSize=Number(request.headers.get('content-length')||0);
  if(declaredSize>MAX_RPC_BODY_BYTES)return error('RPC request body is too large.',413);

  let body:string;
  try{body=await request.text()}catch{return error('Unable to read RPC request.',400)}
  if(!body||new TextEncoder().encode(body).byteLength>MAX_RPC_BODY_BYTES)return error('RPC request body is invalid or too large.',413);

  let json:unknown;
  try{json=JSON.parse(body)}catch{return error('Invalid JSON-RPC payload.',400)}
  const validated=validateRpcPayload(json);
  if(!validated.ok)return error(validated.error,400);

  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')||'unknown';
  if(isRateLimited(ip,validated.cost))return error('RPC rate limit exceeded. Try again shortly.',429);

  try{
    const upstream=await fetch(rpcUrl,{
      method:'POST',
      headers:{Accept:'application/json','Content-Type':'application/json'},
      body:JSON.stringify(validated.payload),
      cache:'no-store',
      signal:AbortSignal.timeout(12_000),
    });
    const responseBody=await upstream.text();
    return new NextResponse(responseBody||JSON.stringify({jsonrpc:'2.0',id:null,error:{code:-32603,message:'Empty RPC response.'}}),{
      status:upstream.ok?200:upstream.status,
      headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
    });
  }catch{return error('RPC provider is temporarily unavailable.',502)}
}
