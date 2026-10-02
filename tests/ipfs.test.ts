import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toBrowserImageUrl, toGatewayUrl, toIpfsUri } from '../lib/ipfs';

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

  it('routes IPFS browser images through the same-origin proxy',()=>{
    const cid='bafybeigdyrzt5sfp7udm7hu76uh7y26nf3obyw6n5puxz4x4hl4omq';
    assert.equal(toBrowserImageUrl(`https://gateway.pinata.cloud/ipfs/${cid}/logo.png`),`/api/ipfs/${cid}/logo.png`);
    assert.equal(toBrowserImageUrl('https://liqpad.com/icon.png'),'https://liqpad.com/icon.png');
  });

  it('rejects IPFS paths contaminated with profile prose',()=>{
    assert.equal(toBrowserImageUrl('ipfs://bafybeidzok6ga62575epm2omqm36rdry2nwulbe2soqummjnimcskzmvambase is my home'),'');
    assert.equal(toBrowserImageUrl('ipfs://bafy%20broken/logo.png'),'');
  });
});
