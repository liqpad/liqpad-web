import test from 'node:test';
import assert from 'node:assert/strict';
import {agentIdFor,normalizeAgentSlug,vitalityForVolume} from '../lib/agents';
import {ADDRESSES} from '../lib/constants';

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
