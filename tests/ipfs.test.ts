import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toGatewayUrl, toIpfsUri } from '../lib/ipfs';

describe('IPFS URI normalization', () => {
  it('preserves native IPFS URIs', () => {
    assert.equal(toIpfsUri('ipfs://bafy-test/logo.png'), 'ipfs://bafy-test/logo.png');
  });

  it('converts gateway URLs and preserves paths', () => {
    assert.equal(toIpfsUri('https://gateway.pinata.cloud/ipfs/bafy-test/logo.png'), 'ipfs://bafy-test/logo.png');
  });

  it('preserves non-IPFS public URLs', () => {
    assert.equal(toIpfsUri('https://liqpad.com/icon.png'), 'https://liqpad.com/icon.png');
  });

  it('renders native IPFS URIs through the configured gateway', () => {
    assert.equal(toGatewayUrl('ipfs://bafy-test/logo.png','https://example.mypinata.cloud/ipfs/'),'https://example.mypinata.cloud/ipfs/bafy-test/logo.png');
  });
});
