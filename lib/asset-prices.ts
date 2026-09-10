import 'server-only';
import {ADDRESSES} from '@/lib/constants';
import {getVvvUsdPrice} from '@/lib/vvv-price';
import type {AssetUsdPrices} from '@/lib/market';

export async function getAssetUsdPrices():Promise<{prices:AssetUsdPrices;source:string;timestamp:string}> {
  const ethKey='coingecko:ethereum';
  const [vvv,external]=await Promise.all([
    getVvvUsdPrice(ADDRESSES.vvv).catch(()=>null),
    fetch(`https://coins.llama.fi/prices/current/${ethKey}`,{next:{revalidate:30,tags:['asset-fx']}})
      .then(async response=>response.ok?response.json():null).catch(()=>null),
  ]);
  const eth=external?.coins?.[ethKey]?.price;
  return {prices:{VVV:vvv?.price??null,ETH:Number.isFinite(eth)?Number(eth):null,USDC:1},source:vvv?.source?'CoinGecko/DefiLlama':'DefiLlama',timestamp:new Date().toISOString()};
}
