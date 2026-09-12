import type {Metadata} from 'next';
import {Discover} from '@/components/discover';
import {getLaunchPage} from '@/lib/data';
import {getProtocolMetrics} from '@/lib/market-indexer';
import {pageMetadata} from '@/lib/seo';
import {JsonLd} from '@/components/json-ld';

export const revalidate=30;
export const dynamic='force-dynamic';
export const metadata:Metadata=pageMetadata({title:'B20 Launchpad on Base',description:'Discover, launch, and trade B20 tokens against VVV on Base with locked Uniswap v4 liquidity and transparent fee accounting.',path:'/'});

export default async function Home(){
  const [launchPage,metrics]=await Promise.all([getLaunchPage(),getProtocolMetrics()]);
  const list={'@context':'https://schema.org','@type':'ItemList',name:'Latest Liqpad B20 launches',numberOfItems:launchPage.total,itemListElement:launchPage.items.slice(0,24).map((item,index)=>({'@type':'ListItem',position:index+1,url:`https://liqpad.com/token/${item.token}`,name:`${item.name} (${item.symbol})`}))};
  return <><JsonLd data={list}/><Discover initialPage={launchPage} metrics={metrics.updatedAt?metrics:{...metrics,totalLaunches:launchPage.total}}/></>;
}
