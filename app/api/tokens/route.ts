import {NextResponse} from 'next/server';
import {getLaunchPage} from '@/lib/data';

export const dynamic='force-dynamic';
export async function GET(request:Request){const params=new URL(request.url).searchParams;const page=Number(params.get('page')||1),pageSize=Number(params.get('pageSize')||24);const result=await getLaunchPage({page,pageSize,q:params.get('q')||'',sort:params.get('sort')||'new',creator:params.get('creator')||undefined});return NextResponse.json({...result,items:result.items.map(item=>({...item,blockNumber:item.blockNumber.toString()}))},{headers:{'Cache-Control':'public, s-maxage=15, stale-while-revalidate=60'}})}
