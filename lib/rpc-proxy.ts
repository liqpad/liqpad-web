const READ_ONLY_RPC_METHODS=new Set([
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getCode',
  'eth_getLogs',
  'eth_getStorageAt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_maxPriorityFeePerGas',
  'net_version',
]);

export const MAX_RPC_BATCH_SIZE=10;
export const MAX_RPC_BODY_BYTES=128*1024;

type JsonRpcRequest={jsonrpc:'2.0';id?:string|number|null;method:string;params?:unknown};

function isRequest(value:unknown):value is JsonRpcRequest{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const item=value as Record<string,unknown>;
  return item.jsonrpc==='2.0'&&typeof item.method==='string'&&READ_ONLY_RPC_METHODS.has(item.method)&&
    (item.params===undefined||Array.isArray(item.params)||(typeof item.params==='object'&&item.params!==null));
}

export function validateRpcPayload(payload:unknown){
  const requests=Array.isArray(payload)?payload:[payload];
  if(requests.length===0||requests.length>MAX_RPC_BATCH_SIZE)return {ok:false as const,error:'RPC batch size is not allowed.',cost:0};
  if(!requests.every(isRequest))return {ok:false as const,error:'Only approved read-only RPC methods are allowed.',cost:requests.length};
  return {ok:true as const,payload:payload as JsonRpcRequest|JsonRpcRequest[],cost:requests.length};
}
