import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {isFreshUsdPrice} from '../lib/vvv-price';

describe('VVV reference price freshness',()=>{
  const now=2_000_000_000;

  it('accepts a valid price updated within ten minutes',()=>{
    assert.equal(isFreshUsdPrice(12.34,now-599,now),true);
  });

  it('rejects stale, missing, future, and non-positive values',()=>{
    assert.equal(isFreshUsdPrice(12.34,now-601,now),false);
    assert.equal(isFreshUsdPrice(12.34,0,now),false);
    assert.equal(isFreshUsdPrice(12.34,now+61,now),false);
    assert.equal(isFreshUsdPrice(0,now,now),false);
    assert.equal(isFreshUsdPrice(undefined,now,now),false);
  });
});
