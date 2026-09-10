import {NextResponse} from 'next/server';
import {getProtocolMetrics} from '@/lib/market-indexer';

export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json(await getProtocolMetrics(),{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=120'}})}
