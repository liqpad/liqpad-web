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
