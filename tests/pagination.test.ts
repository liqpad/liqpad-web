import assert from 'node:assert/strict';
import test from 'node:test';
import {clampPage,pageWindow} from '../lib/pagination';

test('pagination clamps invalid pages and keeps a compact window',()=>{
  assert.equal(clampPage(99,4),4);assert.equal(clampPage(-2,4),1);
  assert.deepEqual(pageWindow(6,12),[4,5,6,7,8]);
  assert.deepEqual(pageWindow(1,3),[1,2,3]);
});
