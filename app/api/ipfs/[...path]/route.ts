import {NextResponse} from 'next/server';

export const runtime='nodejs';
export const revalidate=3600;
const SAFE_SEGMENT=/^[a-zA-Z0-9._~-]{1,180}$/;

export async function GET(_:Request,{params}:{params:Promise<{path:string[]}>}){
  const path=(await params).path;
  if(!path?.length||path.length>8||path.some(segment=>!SAFE_SEGMENT.test(segment)))return NextResponse.json({error:'Invalid IPFS path.'},{status:400});
  const relative=path.map(encodeURIComponent).join('/');
  const configured=(process.env.NEXT_PUBLIC_PINATA_GATEWAY||'https://gateway.pinata.cloud/ipfs').replace(/\/$/,'');
  const gateways=[configured,'https://ipfs.io/ipfs'];
  for(const gateway of [...new Set(gateways)]){
    try{
      const response=await fetch(`${gateway}/${relative}`,{headers:{Accept:'image/avif,image/webp,image/png,image/jpeg,image/gif'},next:{revalidate:3600}});
      const type=response.headers.get('content-type')?.split(';')[0]||'';
      if(!response.ok||!type.startsWith('image/'))continue;
      const bytes=await response.arrayBuffer();
      if(bytes.byteLength>10*1024*1024)return NextResponse.json({error:'Image is too large.'},{status:413});
      return new NextResponse(bytes,{headers:{'Content-Type':type,'Cache-Control':'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800','X-Content-Type-Options':'nosniff'}});
    }catch{/* try the next fixed gateway */}
  }
  return NextResponse.json({error:'IPFS image unavailable.'},{status:404,headers:{'Cache-Control':'public, max-age=60'}});
}
