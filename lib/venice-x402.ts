import 'server-only';
import {createX402Client} from '@privy-io/node/x402';
import {wrapFetchWithPayment} from '@x402/fetch';
import {getAddress,type Address} from 'viem';
import {privyServer} from '@/lib/privy-server';
import {safeErrorMessage} from '@/lib/safe-error';
import {buildVeniceSiweMessage} from '@/lib/venice-auth';

const VENICE_ORIGIN='https://api.venice.ai';
const VENICE_BASE=`${VENICE_ORIGIN}/api/v1`;
const TOP_UP_URL=`${VENICE_BASE}/x402/top-up`;

export type VeniceBalance={walletAddress:string;balanceUsd:number;canConsume:boolean;minimumTopUpUsd:number;suggestedTopUpUsd:number;diemBalanceUsd?:number};

function nonce(){const bytes=new Uint8Array(12);crypto.getRandomValues(bytes);return Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('')}

async function authHeader(walletId:string,address:Address,resourceUrl:string){
  const now=new Date(),expiration=new Date(now.getTime()+4*60_000);
  const message=buildVeniceSiweMessage({address,resourceUrl,nonce:nonce(),issuedAt:now.toISOString(),expirationTime:expiration.toISOString()});
  const signed=await privyServer().wallets().ethereum().signMessage(walletId,{message});
  return Buffer.from(JSON.stringify({address:getAddress(address),message,signature:signed.signature,timestamp:now.getTime(),chainId:8453}),'utf8').toString('base64');
}

async function errorDetail(response:Response){
  const text=await response.text().catch(()=>'');
  return safeErrorMessage(text.replace(/\s+/g,' ').slice(0,600)||response.statusText||'Unknown provider error');
}

export async function getVeniceBalance(walletId:string,address:Address):Promise<VeniceBalance>{
  const url=`${VENICE_BASE}/x402/balance/${getAddress(address)}`;
  const response=await fetch(url,{headers:{'X-Sign-In-With-X':await authHeader(walletId,address,url)},cache:'no-store'});
  if(!response.ok)throw new Error(`Venice balance ${response.status}: ${await errorDetail(response)}`);
  const json=await response.json() as {data?:VeniceBalance}&Partial<VeniceBalance>;
  const data=json.data??json;
  return{walletAddress:String(data.walletAddress||address),balanceUsd:Number(data.balanceUsd||0),canConsume:data.canConsume===true,minimumTopUpUsd:Number(data.minimumTopUpUsd||5),suggestedTopUpUsd:Number(data.suggestedTopUpUsd||5),...(data.diemBalanceUsd==null?{}:{diemBalanceUsd:Number(data.diemBalanceUsd)})};
}

export async function ensureVeniceBalance(walletId:string,address:Address){
  const existing=await getVeniceBalance(walletId,address);
  if(existing.canConsume)return existing;
  const client=createX402Client(privyServer(),{walletId,address:getAddress(address)});
  const response=await wrapFetchWithPayment(fetch,client)(TOP_UP_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  if(!response.ok)throw new Error(`Venice top-up ${response.status}: ${await errorDetail(response)}`);
  const funded=await getVeniceBalance(walletId,address);
  if(!funded.canConsume)throw new Error('Venice top-up completed without activating inference credit.');
  return funded;
}

export async function veniceChat(input:{walletId:string;address:Address;endpoint:string;model:string;system:string;message:string}){
  const url=new URL(input.endpoint);
  if(url.origin!==VENICE_ORIGIN||url.pathname!='/api/v1/chat/completions')throw new Error('VENICE_CHAT_URL must use the official Venice chat endpoint.');
  await ensureVeniceBalance(input.walletId,input.address);
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Sign-In-With-X':await authHeader(input.walletId,input.address,url.toString())},body:JSON.stringify({model:input.model,messages:[{role:'system',content:input.system},{role:'user',content:input.message}],max_completion_tokens:350,temperature:.75,venice_parameters:{include_venice_system_prompt:false,disable_thinking:true}}),cache:'no-store'});
  if(!response.ok)throw new Error(`Venice chat ${response.status}: ${await errorDetail(response)}`);
  const json=await response.json() as {choices?:Array<{message?:{content?:string}}>};
  const reply=json.choices?.[0]?.message?.content?.trim();
  if(!reply)throw new Error('Venice returned no reply.');
  return reply;
}
