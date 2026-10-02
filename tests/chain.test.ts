import assert from 'node:assert/strict';
import test from 'node:test';
import {absoluteRpcUrls} from '../lib/chain';

test('server RPC transports reject browser-relative proxy URLs',()=>{
  assert.deepEqual(
    absoluteRpcUrls('https://base-mainnet.g.alchemy.com/v2/key','/api/rpc',' http://127.0.0.1:8545 '),
    ['https://base-mainnet.g.alchemy.com/v2/key','http://127.0.0.1:8545'],
  );
});

test('server RPC transports remove duplicates and unsupported protocols',()=>{
  assert.deepEqual(
    absoluteRpcUrls('https://mainnet.base.org','https://mainnet.base.org','wss://example.test',undefined),
    ['https://mainnet.base.org'],
  );
});
