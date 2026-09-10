import type {Address} from 'viem';

const TIMEOUT_MS=8_000;
export type DiemUsdPrice={price:number;source:'geckoterminal';timestamp:number};

export function parseGeckoTerminalPrice(json:{data?:{attributes?:{token_prices?:Record<string,string|null>}}},token:Address){const address=token.toLowerCase();const prices=json.data?.attributes?.token_prices||{};const raw=prices[address]??Object.entries(prices).find(([key])=>key.toLowerCase()===address)?.[1];const price=Number(raw);return Number.isFinite(price)&&price>0?price:null}

/** GeckoTerminal's public simple-token-price endpoint. No API key is exposed. */
export async function getDiemUsdPrice(token:Address):Promise<DiemUsdPrice>{
  const address=token.toLowerCase();
  const response=await fetch(`https://api.geckoterminal.com/api/v2/simple/networks/base/token_price/${address}`,{next:{revalidate:30,tags:['diem-usd-price']},headers:{Accept:'application/json;version=20230302'},signal:AbortSignal.timeout(TIMEOUT_MS)});
  if(!response.ok)throw new Error(`GeckoTerminal returned ${response.status}.`);
  const json=await response.json() as {data?:{attributes?:{token_prices?:Record<string,string|null>}}};
  const price=parseGeckoTerminalPrice(json,token);
  if(price==null)throw new Error('GeckoTerminal did not return a valid DIEM/USD price.');
  return {price,source:'geckoterminal',timestamp:Math.floor(Date.now()/1000)};
}
