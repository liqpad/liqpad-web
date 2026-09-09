import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPublicClient, http, numberToHex } from 'viem';
import { base } from 'viem/chains';
import { predictB20AssetAddress, predictAddressAbi } from '../lib/b20Predict';
import { ADDRESSES } from '../lib/constants';
import { hasB07Suffix } from '../lib/suffix';

describe('B20 ASSET prediction', () => {
  it('matches the deterministic zero-salt fixture', () => {
    assert.equal(predictB20AssetAddress(numberToHex(0n,{size:32})), '0xB20000000000000000000047C5B3FD5F28639F09');
    assert.equal(predictB20AssetAddress(numberToHex(3085n,{size:32})), '0xB20000000000000000000008307BD38E8A5ecB07');
  });

  it('mines 0xb07 locally and equals Factory.predictAddress on Base', { skip: !process.env.BASE_RPC_URL }, async () => {
    const salt = numberToHex(3085n,{size:32}); const local = predictB20AssetAddress(salt);
    assert.equal(hasB07Suffix(local), true);
    const client=createPublicClient({chain:base,transport:http(process.env.BASE_RPC_URL)});
    const onchain=await client.readContract({address:ADDRESSES.factory,abi:predictAddressAbi,functionName:'predictAddress',args:[salt]});
    assert.equal(onchain.toLowerCase(), local.toLowerCase());
  });
});
