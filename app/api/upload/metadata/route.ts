import { NextResponse } from 'next/server';
import { toIpfsUri } from '@/lib/ipfs';

type MetadataRequest = {
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  farcaster?: string;
  discord?: string;
};

export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) return NextResponse.json({ error:'Pinata is not configured.' }, { status:503 });

  let input: MetadataRequest;
  try {
    input = await request.json() as MetadataRequest;
  } catch {
    return NextResponse.json({ error:'Invalid metadata request.' }, { status:400 });
  }

  const name = input.name?.trim();
  const symbol = input.symbol?.trim();
  const description = input.description?.trim();
  const image = toIpfsUri(input.image || '');
  if (!name || !symbol || !description || !image) {
    return NextResponse.json({ error:'Name, symbol, description, and image are required.' }, { status:400 });
  }

  const metadata = {
    name,
    symbol,
    description,
    image,
    external_url:input.website?.trim() || 'https://liqpad.com',
    attributes:[
      { trait_type:'Standard', value:'B20' },
      { trait_type:'Chain', value:'Base' },
      { trait_type:'Supply', value:'1000000000' },
    ],
    properties:{
      website:input.website?.trim() || '',
      twitter:input.twitter?.trim() || '',
      telegram:input.telegram?.trim() || '',
      farcaster:input.farcaster?.trim() || '',
      discord:input.discord?.trim() || '',
    },
  };

  const file = new File([JSON.stringify(metadata, null, 2)], `${symbol.toLowerCase()}-metadata.json`, { type:'application/json' });
  const body = new FormData();
  body.append('file', file);
  body.append('network', 'public');
  body.append('name', `${name} metadata`);

  const response = await fetch('https://uploads.pinata.cloud/v3/files', {
    method:'POST', headers:{ Authorization:`Bearer ${jwt}` }, body,
  });
  if (!response.ok) return NextResponse.json({ error:'Metadata upload to Pinata failed.' }, { status:502 });

  const result = await response.json();
  const cid = result.data?.cid || result.IpfsHash;
  if (!cid) return NextResponse.json({ error:'Pinata did not return a metadata CID.' }, { status:502 });

  const gateway = (process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs').replace(/\/$/, '');
  return NextResponse.json({ cid, uri:`ipfs://${cid}`, url:`${gateway}/${cid}` });
}
