export type GeckoPool={id?:string;attributes?:{address?:string;base_token_price_usd?:string|null;quote_token_price_usd?:string|null;volume_usd?:{h24?:string|null};price_change_percentage?:{h24?:string|null};reserve_in_usd?:string|null};relationships?:{base_token?:{data?:{id?:string}};quote_token?:{data?:{id?:string}}}};

const finite=(value:string|null|undefined)=>{const number=Number(value);return Number.isFinite(number)?number:null};

export function geckoPoolMarket(pool:GeckoPool,token:string){
  const target=token.toLowerCase();const base=pool.relationships?.base_token?.data?.id?.toLowerCase()||'';const quote=pool.relationships?.quote_token?.data?.id?.toLowerCase()||'';const isBase=base.endsWith(target);const isQuote=quote.endsWith(target);
  if(!isBase&&!isQuote)return null;
  const priceUsd=finite(isBase?pool.attributes?.base_token_price_usd:pool.attributes?.quote_token_price_usd);if(priceUsd==null||priceUsd<=0)return null;
  return {priceUsd,marketCapUsd:priceUsd*1_000_000_000,volume24hUsd:finite(pool.attributes?.volume_usd?.h24),change24h:finite(pool.attributes?.price_change_percentage?.h24),liquidityUsd:finite(pool.attributes?.reserve_in_usd),poolAddress:pool.attributes?.address||null};
}
