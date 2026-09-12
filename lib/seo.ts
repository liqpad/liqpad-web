import type {Metadata} from 'next';
import {SITE_URL} from '@/lib/constants';

export const SITE_NAME='Liqpad';
export const DEFAULT_DESCRIPTION='Launch and trade B20 tokens against VVV on Base with locked Uniswap v4 liquidity, creator fee sharing, and transparent on-chain protocol accounting.';

export function absoluteUrl(path='/'){
  return new URL(path,SITE_URL).toString();
}

export function pageMetadata({title,description,path,image='/api/og/site',index=true}:{title:string;description:string;path:string;image?:string;index?:boolean}):Metadata{
  const canonical=absoluteUrl(path),ogImage=absoluteUrl(image);
  return {
    title,
    description,
    alternates:{canonical},
    robots:index?{index:true,follow:true}:{index:false,follow:false,noarchive:true},
    openGraph:{title,description,url:canonical,siteName:SITE_NAME,type:'website',locale:'en_US',images:[{url:ogImage,width:1200,height:630,alt:`${title} · ${SITE_NAME}`}]},
    twitter:{card:'summary_large_image',title,description,images:[ogImage]},
  };
}

export function cleanDescription(value:string,fallback=DEFAULT_DESCRIPTION,maxLength=158){
  const clean=value.replace(/\s+/g,' ').trim()||fallback;
  return clean.length<=maxLength?clean:`${clean.slice(0,maxLength-1).trimEnd()}…`;
}

export function safeJsonLd(value:unknown){
  return JSON.stringify(value).replace(/</g,'\\u003c');
}
