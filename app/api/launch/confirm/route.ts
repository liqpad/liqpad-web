import { NextResponse } from 'next/server';
import { isAddress, isHash, type Address, type Hex } from 'viem';
import { confirmLaunchTransaction } from '@/lib/launch-indexer';

export async function POST(request: Request) {
  let hash: unknown; let expectedToken:unknown;
  try {
    ({ hash,expectedToken } = await request.json() as { hash?: unknown;expectedToken?:unknown });
  } catch {
    return NextResponse.json({ error:'Invalid JSON request.' }, { status:400 });
  }
  if (typeof hash !== 'string' || !isHash(hash) || hash.length !== 66) {
    return NextResponse.json({ error:'A valid transaction hash is required.' }, { status:400 });
  }

  try {
    if(expectedToken!==undefined&&(typeof expectedToken!=='string'||!isAddress(expectedToken)))return NextResponse.json({error:'Invalid predicted token.'},{status:400});
    const token = await confirmLaunchTransaction(hash as Hex,expectedToken as Address|undefined);
    return NextResponse.json({ indexed:true, token:token.address });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Launch confirmation failed.';
    const pending = /not found|could not be found/i.test(message);
    return NextResponse.json({ error:pending ? 'Transaction receipt is not available yet.' : message }, { status:pending ? 409 : 422 });
  }
}
