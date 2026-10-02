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
  const [eth,vvv,usdc,claimable,totalSupply]=await Promise.all([
    serverPublicClient.getBalance({address:wallet}),
    serverPublicClient.readContract({address:ADDRESSES.vvv,abi:erc20ReadAbi,functionName:'balanceOf',args:[wallet]}),
    serverPublicClient.readContract({address:ADDRESSES.usdc,abi:erc20ReadAbi,functionName:'balanceOf',args:[wallet]}),
    splitter?serverPublicClient.readContract({address:splitter,abi:agentFeeSplitterAbi,functionName:'claimable'}):Promise.resolve(0n),
    token?serverPublicClient.readContract({address:token,abi:erc20ReadAbi,functionName:'totalSupply'}):Promise.resolve(0n),
  ]);
  return {raw:{eth,vvv,usdc,claimable,totalSupply},formatted:{eth:formatEther(eth),vvv:formatUnits(vvv,18),usdc:formatUnits(usdc,6),claimable:formatUnits(claimable,18)},gasLow:eth<AGENT_GAS_LOW_RAW,inferenceLow:usdc<AGENT_INFERENCE_LOW_RAW,claimReady:claimable>=AGENT_CLAIM_THRESHOLD_RAW};
}
