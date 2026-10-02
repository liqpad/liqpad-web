export function toIpfsUri(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('ipfs://')) return trimmed;

  try {
    const url = new URL(trimmed);
    const marker = '/ipfs/';
    const index = url.pathname.indexOf(marker);
    if (index >= 0) {
      const path = url.pathname.slice(index + marker.length).replace(/^\/+/, '');
      if (path) return `ipfs://${path}`;
    }
  } catch {
    // Preserve non-URL values so the caller can report its own validation error.
  }

  return trimmed;
}

export function toGatewayUrl(value: string, gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs'): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('ipfs://')) return trimmed;
  return `${gateway.replace(/\/$/, '')}/${trimmed.slice('ipfs://'.length).replace(/^\/+/, '')}`;
}

export function toBrowserImageUrl(value:string):string{
  const uri=toIpfsUri(value);
  if(!uri.startsWith('ipfs://'))return value.trim();
  const path=uri.slice('ipfs://'.length).replace(/^\/+/, '');
  const parts=path.split('/');
  // CIDv0/CIDv1 strings never contain whitespace, percent escapes, query data,
  // or prose. Reject corrupted legacy metadata before the browser requests it.
  if(!/^(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,120})$/.test(parts[0]||'')||parts.some(part=>!/^[a-zA-Z0-9._~-]{1,180}$/.test(part)))return'';
  return `/api/ipfs/${path.split('/').map(encodeURIComponent).join('/')}`;
}
