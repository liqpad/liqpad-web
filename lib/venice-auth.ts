import {getAddress,type Address} from 'viem';

const VENICE_ORIGIN='https://api.venice.ai';

export function buildVeniceSiweMessage(input:{address:Address;resourceUrl:string;nonce:string;issuedAt:string;expirationTime:string}){
  const url=new URL(input.resourceUrl);
  if(url.origin!==VENICE_ORIGIN)throw new Error('Venice authentication is restricted to api.venice.ai.');
  return `api.venice.ai wants you to sign in with your Ethereum account:\n${getAddress(input.address)}\n\nSign in to Venice AI\n\nURI: ${url.toString()}\nVersion: 1\nChain ID: 8453\nNonce: ${input.nonce}\nIssued At: ${input.issuedAt}\nExpiration Time: ${input.expirationTime}`;
}
