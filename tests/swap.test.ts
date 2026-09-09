import assert from 'node:assert/strict';
import test from 'node:test';
import {applySlippage,compactToken,parseAmount,usdPrice} from '../lib/swap';

test('swap amount parsing respects asset decimals',()=>{assert.equal(parseAmount('1.25','ETH'),1_250_000_000_000_000_000n);assert.equal(parseAmount('1.25','USDC'),1_250_000n);assert.equal(parseAmount('bad','ETH'),0n)});
test('slippage floors output using basis points',()=>{assert.equal(applySlippage(10_000n,50),9_950n)});
test('market formatting keeps small USD prices visible',()=>{assert.notEqual(usdPrice(0.000001234),'$0.00');assert.equal(compactToken(1_500_000_000_000_000_000_000n),'1.50K')});
