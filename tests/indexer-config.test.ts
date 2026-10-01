import assert from 'node:assert/strict';
import test from 'node:test';
import {boundedInteger,retryDelayMs} from '../lib/indexer-config';

test('indexer integer settings are bounded and reject invalid values',()=>{
  assert.equal(boundedInteger('2000',10,1,5000),2000);
  assert.equal(boundedInteger('9999',10,1,5000),5000);
  assert.equal(boundedInteger('invalid',10,1,5000),10);
});

test('worker retry delay backs off and respects the cap',()=>{
  assert.equal(retryDelayMs(1,2000,60000),2000);
  assert.equal(retryDelayMs(3,2000,60000),8000);
  assert.equal(retryDelayMs(20,2000,60000),60000);
});
