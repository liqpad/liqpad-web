import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {encodeFunctionData,isAddress,zeroAddress,zeroHash} from 'viem';
import {ADDRESSES,CHAIN_ID,FACTORY_START_BLOCK,LIQPAD_POOL_ID,LIQPAD_TOKEN,POTPAL,PROTOCOL_OPERATOR} from '../lib/constants';
import {createLaunchSalt,estimatedFdvUsd,frameForFdv,isQuoteExpired} from '../lib/launch-quote';
import {factoryAbi} from '../src/abi/factory';

describe('Liqpad Launcher v1 production configuration',()=>{
  it('uses Base and canonical production contracts',()=>{assert.equal(CHAIN_ID,8453);assert.equal(FACTORY_START_BLOCK,51050149n);assert.equal(ADDRESSES.factory.toLowerCase(),'0x7e22764f1a1cbb8b60a5ca1d3baed720a48aa3d2');assert.equal(ADDRESSES.swapRouter.toLowerCase(),'0xf5ea55a69307cf2cf598ccb0ea947ffdc52f985e');assert.ok(isAddress(POTPAL))});
  it('pins the Factory-created official LIQPAD market',()=>{assert.equal(LIQPAD_TOKEN.toLowerCase(),'0xb200000000000000000000fa2f036b02356e2b07');assert.equal(LIQPAD_POOL_ID,'0x39d8ccf1f545412e9dcf759cd6e0aae0c46a96fb189d3d368b25f1bd4e3039c6')});
  it('pins the protocol operations wallet',()=>{assert.equal(PROTOCOL_OPERATOR.toLowerCase(),'0xca53938b27c29e50527dec1f2d6e488889435d8c')});
  it('generates unique bytes32 salts',()=>{const a=createLaunchSalt(),b=createLaunchSalt();assert.match(a,/^0x[0-9a-f]{64}$/);assert.notEqual(a,b)});
  it('rounds signed frames and expires quotes',()=>{const frame=frameForFdv(10_000,0.1);assert.equal(frame%200,0);assert.ok(frame>=80_000&&frame<=200_000);assert.ok(estimatedFdvUsd(frame,0.1)>0);assert.equal(isQuoteExpired('1',2),true)});
  it('encodes signed createLaunch(params, quote, signature)',()=>{const salt=`0x${'11'.repeat(32)}` as const;const data=encodeFunctionData({abi:factoryAbi,functionName:'createLaunch',args:[{name:'Test',symbol:'TST',salt,contractURI:'ipfs://metadata',description:'test',logoURI:'ipfs://logo',website:'',socials:{twitter:'',telegram:'',farcaster:'',discord:''},creator:zeroAddress},{quotedFrame:115200,validUntil:9999999999n,creator:zeroAddress,launchSalt:salt},`0x${'22'.repeat(65)}`]});assert.match(data,/^0x[0-9a-f]+$/);assert.notEqual(data,zeroHash)});
});
