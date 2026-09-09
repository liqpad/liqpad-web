import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {encodeFunctionData,isAddress,zeroAddress,zeroHash} from 'viem';
import {ADDRESSES,CHAIN_ID,FACTORY_START_BLOCK,POTPAL} from '../lib/constants';
import {createLaunchSalt,estimatedFdvUsd,frameForFdv,isQuoteExpired} from '../lib/launch-quote';
import {factoryAbi} from '../src/abi/factory';

describe('Liqpad Launcher v1 production configuration',()=>{
  it('uses Base and canonical production contracts',()=>{assert.equal(CHAIN_ID,8453);assert.equal(FACTORY_START_BLOCK,51050149n);assert.equal(ADDRESSES.factory.toLowerCase(),'0x7e22764f1a1cbb8b60a5ca1d3baed720a48aa3d2');assert.equal(ADDRESSES.swapRouter.toLowerCase(),'0xf5ea55a69307cf2cf598ccb0ea947ffdc52f985e');assert.ok(isAddress(POTPAL))});
  it('generates unique bytes32 salts',()=>{const a=createLaunchSalt(),b=createLaunchSalt();assert.match(a,/^0x[0-9a-f]{64}$/);assert.notEqual(a,b)});
  it('rounds signed frames and expires quotes',()=>{const frame=frameForFdv(10_000,0.1);assert.equal(frame%200,0);assert.ok(frame>=80_000&&frame<=200_000);assert.ok(estimatedFdvUsd(frame,0.1)>0);assert.equal(isQuoteExpired('1',2),true)});
  it('encodes signed createLaunch(params, quote, signature)',()=>{const salt=`0x${'11'.repeat(32)}` as const;const data=encodeFunctionData({abi:factoryAbi,functionName:'createLaunch',args:[{name:'Test',symbol:'TST',salt,contractURI:'ipfs://metadata',description:'test',logoURI:'ipfs://logo',website:'',socials:{twitter:'',telegram:'',farcaster:'',discord:''},creator:zeroAddress},{quotedFrame:115200,validUntil:9999999999n,creator:zeroAddress,launchSalt:salt},`0x${'22'.repeat(65)}`]});assert.match(data,/^0x[0-9a-f]+$/);assert.notEqual(data,zeroHash)});
});
