import assert from 'node:assert/strict';
import test from 'node:test';
import {swapUsdSnapshot,type PendingSwap} from '../lib/market';

const base:PendingSwap={id:'swap',side:'buy',amount_in_raw:'1500000',amount_out_raw:'1000000000000000000',input_symbol:'USDC',output_symbol:'B20',input_decimals:6,output_decimals:18};

test('buy volume uses the external asset paid by the trader',()=>{
  assert.deepEqual(swapUsdSnapshot(base,{USDC:1,ETH:3000,VVV:0.2}),{volumeUsd:1.5,usdPrice:1});
});

test('sell volume uses the external asset received by the trader',()=>{
  const sell={...base,side:'sell' as const,input_symbol:'B20',output_symbol:'VVV',amount_out_raw:'2000000000000000000',output_decimals:18};
  assert.deepEqual(swapUsdSnapshot(sell,{USDC:1,ETH:3000,VVV:0.2}),{volumeUsd:0.4,usdPrice:0.2});
});

test('missing FX remains unavailable instead of becoming zero',()=>{
  assert.equal(swapUsdSnapshot({...base,input_symbol:'VVV'},{USDC:1,ETH:3000,VVV:null}),null);
});
