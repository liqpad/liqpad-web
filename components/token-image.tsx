'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toGatewayUrl } from '@/lib/ipfs';

type Props = { src?:string; alt:string; className?:string; width?:number; height?:number; fallback?:string };

export function TokenImage({src='',alt,className='h-full w-full object-cover',width=96,height=96,fallback='?'}:Props) {
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[src]);
  if(!src||failed)return <span role="img" aria-label={`${alt} placeholder`} className="grid h-full w-full place-items-center font-display font-black">{fallback.slice(0,1).toUpperCase()}</span>;
  return <Image src={toGatewayUrl(src)} alt={alt} width={width} height={height} unoptimized onError={()=>setFailed(true)} className={className}/>;
}
