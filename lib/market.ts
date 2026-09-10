import {formatUnits} from 'viem';

export type AssetUsdPrices={VVV:number|null;ETH:number|null;USDC:number|null};
export type PendingSwap={id:string;side:'buy'|'sell';amount_in_raw:string|null;amount_out_raw:string|null;input_symbol:string|null;output_symbol:string|null;input_decimals:number|null;output_decimals:number|null};

export function swapUsdSnapshot(row:PendingSwap,prices:AssetUsdPrices){
  const symbol=row.side==='buy'?row.input_symbol:row.output_symbol;
  const raw=row.side==='buy'?row.amount_in_raw:row.amount_out_raw;
  const decimals=row.side==='buy'?row.input_decimals:row.output_decimals;
  const price=symbol&&symbol in prices?prices[symbol as keyof AssetUsdPrices]:null;
  if(!raw||decimals==null||price==null||!Number.isFinite(price))return null;
  const value=Number(formatUnits(BigInt(raw),decimals))*price;
  return Number.isFinite(value)?{volumeUsd:value,usdPrice:price}:null;
}
