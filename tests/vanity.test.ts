import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {predictB20AssetAddress} from '../lib/b20Predict';
import {B07_MASK,B07_SUFFIX,hasB07Suffix} from '../lib/suffix';
import {ADDRESSES} from '../lib/constants';

describe('automatic 0xb07 branding',()=>{
  it('checks only the final 12 bits',()=>{assert.equal(hasB07Suffix('0x0000000000000000000000000000000000000b07'),true);assert.equal(hasB07Suffix('0x0000000000000000000000000000000000000b06'),false);assert.equal(BigInt('0xfffffffffffffffffffffffffffffffffffffb07')&B07_MASK,B07_SUFFIX)});
  it('matches the production Factory prediction fixture',()=>{const salt='0x0000000000000000000000000000000000000000000000000000000000000001' as const;assert.equal(predictB20AssetAddress(salt,ADDRESSES.factory),'0xb2000000000000000000002F088e0DdA153834DD')});
  it('has a deterministic branded candidate',()=>{const salt='0x0000000000000000000000000000000000000000000000000000000000001b29' as const;const token=predictB20AssetAddress(salt,ADDRESSES.factory);assert.equal(token,'0xb200000000000000000000c0e3221873C7B20b07');assert.equal(hasB07Suffix(token),true)});
});
