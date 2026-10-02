import assert from 'node:assert/strict';
import test from 'node:test';
import {chatSignMessage,freshIssuedAt,requiredHolding} from '../lib/agent-chat-auth';

test('holder threshold is exactly 0.1% rounded up',()=>{assert.equal(requiredHolding(1_000_000_000n*10n**18n),1_000_000n*10n**18n);assert.equal(requiredHolding(1n),1n)});
test('chat timestamps expire after five minutes',()=>{const now=Date.now();assert.equal(freshIssuedAt(new Date(now-299_000).toISOString(),now),true);assert.equal(freshIssuedAt(new Date(now-301_000).toISOString(),now),false)});
test('signed message binds agent, wallet, request and chain',()=>{const value=chatSignMessage({slug:'romi',address:'0x3B8FeC7280CdA88B2495114A139a0CfAF0f8367F',messageHash:`0x${'11'.repeat(32)}`,requestId:'request_123456789',issuedAt:'2026-10-02T00:00:00.000Z'});assert.match(value,/Agent: romi/);assert.match(value,/Chain ID: 8453/);assert.match(value,/Request ID: request_123456789/) });
