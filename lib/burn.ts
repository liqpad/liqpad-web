import {formatUnits} from 'viem';
import {INITIAL_SUPPLY_RAW,TOKEN_DECIMALS} from '@/lib/constants';

export function burnedSupplyRaw(totalSupplyRaw:bigint){
  return totalSupplyRaw>=INITIAL_SUPPLY_RAW?0n:INITIAL_SUPPLY_RAW-totalSupplyRaw;
}

export function supplyDisplay(raw:bigint|string|null|undefined){
  if(raw==null)return null;
  const value=Number(formatUnits(BigInt(raw),TOKEN_DECIMALS));
  if(!Number.isFinite(value))return null;
  return new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(value);
}

export function burnedPercent(raw:bigint|string|null|undefined){
  if(raw==null)return null;
  return Number(BigInt(raw)*1_000_000n/INITIAL_SUPPLY_RAW)/10_000;
}
