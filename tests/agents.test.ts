import test from 'node:test';
import assert from 'node:assert/strict';
import {agentIdFor,hasLaunchedAgentEconomy,normalizeAgentSlug,vitalityForVolume} from '../lib/agents';
import {ADDRESSES} from '../lib/constants';
import {buildVeniceSiweMessage} from '../lib/venice-auth';

test('agent deployment configuration uses the verified Base contracts',()=>{
  assert.equal(ADDRESSES.agentFeeSplitterFactory.toLowerCase(),'0x632eed8756899fe56de4bac48a74847b029826ba');
  assert.equal(ADDRESSES.agentFeeSplitterImplementation.toLowerCase(),'0x2954f34da1e0d9d861dd2e265b364fdd1dc00eed');
});
test('agent identifiers and public slugs are deterministic',()=>{
  assert.equal(normalizeAgentSlug('  Neon Oracle!!  '),'neon-oracle');
  assert.equal(agentIdFor('018f-test'),agentIdFor('018f-test'));
  assert.match(agentIdFor('018f-test'),/^0x[0-9a-f]{64}$/);
});
test('volume maps to explicit agent vitality bands',()=>{
  assert.equal(vitalityForVolume(0),'dormant');assert.equal(vitalityForVolume(1),'low_compute');assert.equal(vitalityForVolume(1_000),'conserving');assert.equal(vitalityForVolume(10_000),'active');
});
test('launched agent economy survives a delayed lifecycle status',()=>{
  const token='0xB200000000000000000000000000000000000b07';
  assert.equal(hasLaunchedAgentEconomy('active',token),true);
  assert.equal(hasLaunchedAgentEconomy('splitter_ready',token),true);
  assert.equal(hasLaunchedAgentEconomy('launch_pending',token),true);
  assert.equal(hasLaunchedAgentEconomy('active',null),false);
  assert.equal(hasLaunchedAgentEconomy('draft',token),false);
});
test('Venice SIWE authentication is bound to Base and the official endpoint',()=>{
  const input={address:'0x0000000000000000000000000000000000000001' as const,resourceUrl:'https://api.venice.ai/api/v1/chat/completions',nonce:'abcdef1234567890',issuedAt:'2026-10-02T00:00:00.000Z',expirationTime:'2026-10-02T00:04:00.000Z'};
  const message=buildVeniceSiweMessage(input);
  assert.match(message,/Chain ID: 8453/);
  assert.match(message,/Nonce: abcdef1234567890/);
  assert.throws(()=>buildVeniceSiweMessage({...input,resourceUrl:'https://example.com/chat'}));
});
