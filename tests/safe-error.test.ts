import assert from 'node:assert/strict';
import test from 'node:test';
import {safeErrorMessage} from '../lib/safe-error';

test('redacts provider credentials embedded in RPC errors',()=>{
  const secret='alch_exampleSecret123';
  const result=safeErrorMessage(new Error(`URL: https://base-mainnet.g.alchemy.com/v2/${secret} Details: denied`));
  assert.equal(result.includes(secret),false);
  assert.match(result,/\[REDACTED_RPC_URL\]/);
});

test('redacts bearer and labelled secrets',()=>{
  const result=safeErrorMessage('Authorization: Bearer very.secret-token API_KEY=another-secret');
  assert.equal(result.includes('very.secret-token'),false);
  assert.equal(result.includes('another-secret'),false);
});
