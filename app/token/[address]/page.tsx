import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {isAddress} from 'viem';
import {getLaunchByAddress} from '@/lib/data';
import {TokenView} from '@/components/token-view';
import {SITE_URL} from '@/lib/constants';
import {cleanDescription,pageMetadata} from '@/lib/seo';
import {JsonLd} from '@/components/json-ld';

type Props={params:Promise<{address:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {address}=await params;
  if(!isAddress(address))return pageMetadata({title:'Token not found',description:'This address is not a valid Liqpad token address.',path:`/token/${address}`,index:false});
  const launch=await getLaunchByAddress(address);
  if(!launch)return pageMetadata({title:'Token not found',description:'This token is not present in the active Liqpad Factory index.',path:`/token/${address}`,index:false});
  const title=`${launch.name} ($${launch.symbol}) — B20 Token`;
  const description=cleanDescription(launch.description,`Trade $${launch.symbol} on Liqpad. View its live price, market cap, volume, burned supply, and B20/VVV market with locked liquidity on Base.`);
  return pageMetadata({title,description,path:`/token/${launch.token}`,image:`/api/og/token/${launch.token}`});
}

export default async function Page({params}:Props){
  const {address}=await params;if(!isAddress(address))notFound();const launch=await getLaunchByAddress(address);if(!launch)notFound();
  const url=`${SITE_URL}/token/${launch.token}`;
  const structuredData={'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':`${url}#webpage`,url,name:`${launch.name} ($${launch.symbol})`,description:cleanDescription(launch.description),isPartOf:{'@id':`${SITE_URL}/#website`},about:{'@type':'Thing',name:launch.name,identifier:launch.token,description:cleanDescription(launch.description)}},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Discover',item:SITE_URL},{'@type':'ListItem',position:2,name:`${launch.name} ($${launch.symbol})`,item:url}]}]};
  return <><JsonLd data={structuredData}/><TokenView launch={launch}/></>;
}
