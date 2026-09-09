import {formatUnits, parseUnits} from 'viem';

export type RouteAsset='ETH'|'USDC'|'VVV';
export type SwapSide='buy'|'sell';
export const assetDecimals=(asset:RouteAsset)=>asset==='USDC'?6:18;
export function parseAmount(value:string,asset:RouteAsset){if(!value||!/^\d*(\.\d*)?$/.test(value))return 0n;try{return parseUnits(value,assetDecimals(asset))}catch{return 0n}}
export function applySlippage(value:bigint,bps:number){return value*BigInt(10_000-bps)/10_000n}
export function compactToken(value:bigint,decimals=18,max=6){const number=Number(formatUnits(value,decimals));if(!Number.isFinite(number))return '—';if(number===0)return '0';if(number>=1_000_000_000)return `${(number/1_000_000_000).toFixed(2)}B`;if(number>=1_000_000)return `${(number/1_000_000).toFixed(2)}M`;if(number>=1_000)return `${(number/1_000).toFixed(2)}K`;return number.toLocaleString('en-US',{maximumSignificantDigits:max});}
export function usd(value:number|null|undefined){if(value==null||!Number.isFinite(value))return 'USD unavailable';if(value===0)return '$0.00';if(value<0.01)return `$${value.toPrecision(3)}`;return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:value>=1000?'compact':'standard',maximumFractionDigits:2}).format(value)}
export function usdPrice(value:number|null|undefined){if(value==null||!Number.isFinite(value)||value<=0)return '$—';if(value>=0.01)return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:6}).format(value);return `$${value.toLocaleString('en-US',{useGrouping:false,maximumSignificantDigits:4,maximumFractionDigits:12})}`}
