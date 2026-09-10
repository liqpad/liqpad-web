import assert from 'node:assert/strict';
import test from 'node:test';
import {shortB20} from '../lib/utils';

test('B20 card addresses keep the branded prefix and suffix',()=>{
  assert.equal(shortB20('0xB2000000000000000000007C1d07BAD68CD78b07'),'0xb20...b07');
});
