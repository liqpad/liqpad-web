import {getAddress,keccak256,stringToHex,type Address} from 'viem';

export const AGENT_CHAT_DAILY_LIMIT=10;
export const AGENT_HOLDER_BPS=10; // 0.10%
export const BPS=10_000n;

export function requiredHolding(totalSupply:bigint){return(totalSupply*BigInt(AGENT_HOLDER_BPS)+BPS-1n)/BPS}
export function chatPromptHash(message:string){return keccak256(stringToHex(message.trim()))}
export function chatSignMessage(input:{slug:string;address:Address;messageHash:`0x${string}`;requestId:string;issuedAt:string}){
  return ['Liqpad holder chat',`Agent: ${input.slug}`,`Wallet: ${getAddress(input.address)}`,'Chain ID: 8453',`Message hash: ${input.messageHash}`,`Request ID: ${input.requestId}`,`Issued at: ${input.issuedAt}`].join('\n');
}
export function freshIssuedAt(value:string,now=Date.now()){const time=Date.parse(value);return Number.isFinite(time)&&Math.abs(now-time)<=5*60_000}
