import {formatEther,formatUnits,parseEther,parseUnits,type Address} from 'viem';
import {serverPublicClient} from '@/lib/server-public-client';
import {ADDRESSES} from '@/lib/constants';
import {agentFeeSplitterAbi} from '@/src/abi/agentFeeSplitter';

const erc20ReadAbi=[
  {type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'account',type:'address'}],outputs:[{type:'uint256'}]},
  {type:'function',name:'totalSupply',stateMutability:'view',inputs:[],outputs:[{type:'uint256'}]},
] as const;
export const AGENT_GAS_LOW_RAW=parseEther(process.env.AGENT_MIN_GAS_ETH||'0.0002');
export const AGENT_INFERENCE_LOW_RAW=parseUnits(process.env.AGENT_MIN_INFERENCE_USDC||'1',6);
export const AGENT_CLAIM_THRESHOLD_RAW=parseUnits(process.env.AGENT_CLAIM_THRESHOLD_VVV||'1',18);

export async function agentEconomy(wallet:Address,splitter:Address|null,token:Address|null){
  const results=await Promise.allSettled([
    serverPublicClient.getBalance({address:wallet}),
    serverPublicClient.readContract({address:ADDRESSES.vvv,abi:erc20ReadAbi,functionName:'balanceOf',args:[wallet]}),
    serverPublicClient.readContract({address:ADDRESSES.usdc,abi:erc20ReadAbi,functionName:'balanceOf',args:[wallet]}),
    splitter?serverPublicClient.readContract({address:splitter,abi:agentFeeSplitterAbi,functionName:'claimable'}):Promise.resolve(0n),
    token?serverPublicClient.readContract({address:token,abi:erc20ReadAbi,functionName:'totalSupply'}):Promise.resolve(0n),
  ]);
  const values=results.map(result=>result.status==='fulfilled'?result.value:null);
  const [eth,vvv,usdc,claimable,totalSupply]=values;
  const unavailable=results.map((result,index)=>result.status==='rejected'?['eth','vvv','usdc','claimable','totalSupply'][index]:null).filter(Boolean);
  return {
    raw:{eth:eth?.toString()??null,vvv:vvv?.toString()??null,usdc:usdc?.toString()??null,claimable:claimable?.toString()??null,totalSupply:totalSupply?.toString()??null},
    formatted:{eth:eth===null?null:formatEther(eth),vvv:vvv===null?null:formatUnits(vvv,18),usdc:usdc===null?null:formatUnits(usdc,6),claimable:claimable===null?null:formatUnits(claimable,18)},
    gasLow:eth===null?null:eth<AGENT_GAS_LOW_RAW,
    inferenceLow:usdc===null?null:usdc<AGENT_INFERENCE_LOW_RAW,
    claimReady:claimable===null?null:claimable>=AGENT_CLAIM_THRESHOLD_RAW,
    unavailable,
  };
}
