import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasB07Suffix, B07_MASK, B07_SUFFIX } from '../lib/suffix';

describe('0xb07 suffix mask', () => {
  it('accepts exactly the last 12 bits 0xb07', () => {
    assert.equal(hasB07Suffix('0x0000000000000000000000000000000000000b07'), true);
    assert.equal(hasB07Suffix('0xB20000000000000000000000000000000000b07'), true);
    assert.equal((BigInt('0xfffffffffffffffffffffffffffffffffffffb07') & B07_MASK), B07_SUFFIX);
  });
  it('rejects adjacent and malformed suffixes', () => {
    assert.equal(hasB07Suffix('0x0000000000000000000000000000000000000b06'), false);
    assert.equal(hasB07Suffix('not-an-address'), false);
  });
});
