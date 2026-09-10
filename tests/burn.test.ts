import test from 'node:test';
import assert from 'node:assert/strict';
import {burnedPercent,burnedSupplyRaw,supplyDisplay} from '../lib/burn';
import {INITIAL_SUPPLY_RAW} from '../lib/constants';

test('calculates burned B20 from the fixed initial supply',()=>{
  const burned=1_250_000n*10n**18n;
  assert.equal(burnedSupplyRaw(INITIAL_SUPPLY_RAW-burned),burned);
  assert.equal(burnedPercent(burned),0.125);
  assert.equal(supplyDisplay(burned),'1.25M');
});

test('never reports a negative burn',()=>{
  assert.equal(burnedSupplyRaw(INITIAL_SUPPLY_RAW+1n),0n);
});
