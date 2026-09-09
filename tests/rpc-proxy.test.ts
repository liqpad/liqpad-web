import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {MAX_RPC_BATCH_SIZE,validateRpcPayload} from '../lib/rpc-proxy';

describe('read-only RPC proxy validation',()=>{
  it('accepts standard read calls and bounded batches',()=>{
    assert.equal(validateRpcPayload({jsonrpc:'2.0',id:1,method:'eth_call',params:[{},'latest']}).ok,true);
    assert.equal(validateRpcPayload(Array.from({length:MAX_RPC_BATCH_SIZE},(_,id)=>({jsonrpc:'2.0',id,method:'eth_blockNumber',params:[]}))).ok,true);
  });

  it('rejects transaction submission, unknown methods, and oversized batches',()=>{
    assert.equal(validateRpcPayload({jsonrpc:'2.0',id:1,method:'eth_sendRawTransaction',params:['0x']}).ok,false);
    assert.equal(validateRpcPayload({jsonrpc:'2.0',id:1,method:'debug_traceCall',params:[]}).ok,false);
    assert.equal(validateRpcPayload(Array.from({length:MAX_RPC_BATCH_SIZE+1},(_,id)=>({jsonrpc:'2.0',id,method:'eth_call',params:[]}))).ok,false);
  });
});
