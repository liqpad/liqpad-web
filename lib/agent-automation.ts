import 'server-only';
import {encodeFunctionData,getAddress,parseEther,type Address,type Hex} from 'viem';
import {ADDRESSES} from '@/lib/constants';
import {AGENT_CLAIM_THRESHOLD_RAW} from '@/lib/agent-economy';
import {privyServer} from '@/lib/privy-server';
import {serverPublicClient} from '@/lib/server-public-client';
import {supabaseAdmin} from '@/lib/supabase';
import {agentFeeSplitterAbi} from '@/src/abi/agentFeeSplitter';
import {aerodromeRouterAbi} from '@/src/abi/swapSupport';

const erc20Abi=[
  {type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'account',type:'address'}],outputs:[{type:'uint256'}]},
  {type:'function',name:'approve',stateMutability:'nonpayable',inputs:[{name:'spender',type:'address'},{name:'amount',type:'uint256'}],outputs:[{type:'bool'}]},
] as const;
const route=(from:Address,to:Address)=>({from,to,stable:false,factory:ADDRESSES.aerodromeFactory});
const minGas=parseEther(process.env.AGENT_MIN_GAS_ETH||'0.0002');
const slippageBps=BigInt(process.env.AGENT_AUTOMATION_SLIPPAGE_BPS||'300');

async function send(walletId:string,to:Address,data:Hex,referenceId:string){
  const result=await privyServer().wallets().ethereum().sendTransaction(walletId,{caip2:'eip155:8453',params:{transaction:{to,data}},reference_id:referenceId});
  const hash=result.hash as Hex;await serverPublicClient.waitForTransactionReceipt({hash,confirmations:1,timeout:90_000});return hash;
}
async function quote(amount:bigint,routes:ReturnType<typeof route>[]){const amounts=await serverPublicClient.readContract({address:ADDRESSES.aerodromeRouter,abi:aerodromeRouterAbi,functionName:'getAmountsOut',args:[amount,routes]});return amounts.at(-1)||0n}
function minOut(value:bigint){return value*(10_000n-slippageBps)/10_000n}

export async function runAgentAutomationCycle(){
  if(process.env.AGENT_AUTOMATION_ENABLED!=='true')return{enabled:false,processed:0};
  const db=supabaseAdmin();if(!db)throw new Error('Supabase unavailable.');
  const {data:rows,error}=await db.from('agents').select('id,agent_wallet_address,fee_splitter_address,agent_wallet_bindings(privy_wallet_id)').eq('status','active').not('fee_splitter_address','is',null).limit(50);
  if(error)throw error;let processed=0;
  for(const row of rows||[]){
    let activeKey:string|undefined;
    try{
      const wallet=getAddress(row.agent_wallet_address),splitter=getAddress(row.fee_splitter_address);const binding=Array.isArray(row.agent_wallet_bindings)?row.agent_wallet_bindings[0]:row.agent_wallet_bindings;if(!binding?.privy_wallet_id)continue;
      const [gas,claimable,before]=await Promise.all([serverPublicClient.getBalance({address:wallet}),serverPublicClient.readContract({address:splitter,abi:agentFeeSplitterAbi,functionName:'claimable'}),serverPublicClient.readContract({address:ADDRESSES.vvv,abi:erc20Abi,functionName:'balanceOf',args:[wallet]})]);
      if(gas<minGas||claimable<AGENT_CLAIM_THRESHOLD_RAW)continue;
      const key=`claim:${row.id}:${claimable}:${Math.floor(Date.now()/300_000)}`;activeKey=key;const {error:lockError}=await db.from('agent_automation_events').insert({agent_id:row.id,action:'claim',idempotency_key:key,status:'pending',amount_in:claimable.toString()});if(lockError)continue;
      const claimHash=await send(binding.privy_wallet_id,splitter,encodeFunctionData({abi:agentFeeSplitterAbi,functionName:'claimAndDistribute'}),`${key}:tx`);
      await db.from('agent_automation_events').update({status:'confirmed',tx_hash:claimHash,updated_at:new Date().toISOString()}).eq('idempotency_key',key);
      const after=await serverPublicClient.readContract({address:ADDRESSES.vvv,abi:erc20Abi,functionName:'balanceOf',args:[wallet]});const received=after>before?after-before:0n;if(!received)continue;
      const ethPart=received*30n/100n,usdcPart=received-ethPart;
      await send(binding.privy_wallet_id,ADDRESSES.vvv,encodeFunctionData({abi:erc20Abi,functionName:'approve',args:[ADDRESSES.aerodromeRouter,received]}),`approve:${key}`);
      const deadline=BigInt(Math.floor(Date.now()/1000)+600),ethRoutes=[route(ADDRESSES.vvv,ADDRESSES.weth)],usdcRoutes=[route(ADDRESSES.vvv,ADDRESSES.weth),route(ADDRESSES.weth,ADDRESSES.usdc)];
      const [ethQuote,usdcQuote]=await Promise.all([quote(ethPart,ethRoutes),quote(usdcPart,usdcRoutes)]);if(!ethQuote||!usdcQuote)throw new Error('Aerodrome quote unavailable.');
      const ethHash=await send(binding.privy_wallet_id,ADDRESSES.aerodromeRouter,encodeFunctionData({abi:aerodromeRouterAbi,functionName:'swapExactTokensForETH',args:[ethPart,minOut(ethQuote),ethRoutes,wallet,deadline]}),`swap-eth:${key}`);
      const usdcHash=await send(binding.privy_wallet_id,ADDRESSES.aerodromeRouter,encodeFunctionData({abi:aerodromeRouterAbi,functionName:'swapExactTokensForTokens',args:[usdcPart,minOut(usdcQuote),usdcRoutes,wallet,deadline]}),`swap-usdc:${key}`);
      await db.from('agent_automation_events').insert([{agent_id:row.id,action:'swap_eth',idempotency_key:`swap-eth:${key}`,status:'confirmed',tx_hash:ethHash,amount_in:ethPart.toString(),amount_out:ethQuote.toString()},{agent_id:row.id,action:'swap_usdc',idempotency_key:`swap-usdc:${key}`,status:'confirmed',tx_hash:usdcHash,amount_in:usdcPart.toString(),amount_out:usdcQuote.toString()}]);processed++;
    }catch(error){const message=error instanceof Error?error.message:'Unknown error';if(activeKey)await db.from('agent_automation_events').update({status:'failed',error:message.slice(0,500),updated_at:new Date().toISOString()}).eq('idempotency_key',activeKey);console.error('Agent automation skipped',row.id,message)}
  }
  return{enabled:true,processed};
}
