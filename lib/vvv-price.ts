import type {Address} from 'viem';

const MAX_PRICE_AGE_SECONDS=10*60;
const REQUEST_TIMEOUT_MS=8_000;

export type VvvUsdPrice={
  price:number;
  timestamp:number;
  source:'coingecko'|'defillama';
};

export function isFreshUsdPrice(price:unknown,timestamp:unknown,nowSeconds=Math.floor(Date.now()/1000)){
  const value=Number(price);
  const updatedAt=Number(timestamp);
  const age=nowSeconds-updatedAt;
  return Number.isFinite(value)&&value>0&&Number.isFinite(updatedAt)&&updatedAt>0&&age>=-60&&age<=MAX_PRICE_AGE_SECONDS;
}

async function fromCoinGecko(vvv:Address):Promise<VvvUsdPrice>{
  const address=vvv.toLowerCase();
  const query=new URLSearchParams({contract_addresses:address,vs_currencies:'usd',include_last_updated_at:'true'});
  const apiKey=process.env.COINGECKO_API_KEY?.trim();
  const response=await fetch(`https://api.coingecko.com/api/v3/simple/token_price/base?${query}`,{
    cache:'no-store',
    headers:{Accept:'application/json',...(apiKey?{'x-cg-demo-api-key':apiKey}:{})},
    signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if(!response.ok)throw new Error(`CoinGecko returned ${response.status}.`);
  const json=await response.json() as Record<string,{usd?:number;last_updated_at?:number}>;
  const result=json[address];
  const price=Number(result?.usd);const timestamp=Number(result?.last_updated_at);
  if(!isFreshUsdPrice(price,timestamp))throw new Error('CoinGecko VVV price is stale.');
  return {price,timestamp,source:'coingecko'};
}

async function fromDefiLlama(vvv:Address):Promise<VvvUsdPrice>{
  const key=`base:${vvv}`;
  const response=await fetch(`https://coins.llama.fi/prices/current/${key}`,{
    cache:'no-store',
    signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if(!response.ok)throw new Error(`DefiLlama returned ${response.status}.`);
  const json=await response.json() as {coins?:Record<string,{price?:number;timestamp?:number}>};
  const result=json.coins?.[key];
  const price=Number(result?.price);const timestamp=Number(result?.timestamp);
  if(!isFreshUsdPrice(price,timestamp))throw new Error('DefiLlama VVV price is stale.');
  return {price,timestamp,source:'defillama'};
}

export async function getVvvUsdPrice(vvv:Address):Promise<VvvUsdPrice>{
  try{return await fromCoinGecko(vvv)}catch(coinGeckoError){
    try{return await fromDefiLlama(vvv)}catch(defiLlamaError){
      const coinGeckoMessage=coinGeckoError instanceof Error?coinGeckoError.message:'CoinGecko failed.';
      const defiLlamaMessage=defiLlamaError instanceof Error?defiLlamaError.message:'DefiLlama failed.';
      throw new Error(`VVV reference price is temporarily unavailable. ${coinGeckoMessage} ${defiLlamaMessage}`);
    }
  }
}
