import type { NextConfig } from 'next';

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js currently emits inline bootstrap scripts. External scripts remain restricted.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  // Token profiles can contain creator-hosted HTTPS images in addition to IPFS gateways.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  [
    'child-src',
    'https://auth.privy.io',
    'https://privy.liqpad.com',
    'https://verify.walletconnect.com',
    'https://verify.walletconnect.org',
  ].join(' '),
  [
    'frame-src',
    'https://auth.privy.io',
    'https://privy.liqpad.com',
    'https://verify.walletconnect.com',
    'https://verify.walletconnect.org',
    'https://challenges.cloudflare.com',
    'https://www.geckoterminal.com',
    'https://dexscreener.com',
  ].join(' '),
  [
    'connect-src',
    "'self'",
    'https://auth.privy.io',
    'https://privy.liqpad.com',
    'wss://relay.walletconnect.com',
    'wss://relay.walletconnect.org',
    'wss://www.walletlink.org',
    'https://*.rpc.privy.systems',
    'https://explorer-api.walletconnect.com',
    'https://pulse.walletconnect.com',
    'https://pulse.walletconnect.org',
    'https://api.web3modal.com',
    'https://api.web3modal.org',
    'https://rpc.walletconnect.com',
    'https://rpc.walletconnect.org',
    'https://relay.walletconnect.com',
    'https://relay.walletconnect.org',
    'https://keys.walletconnect.com',
    'https://keys.walletconnect.org',
    'https://*.supabase.co',
    'wss://*.supabase.co',
  ].join(' '),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob: https:",
  'upgrade-insecure-requests',
  'report-uri /api/security/csp-report',
].join('; ');

const securityHeaders = [
  {
    key:
      process.env.CSP_ENFORCE === 'true'
        ? 'Content-Security-Policy'
        : 'Content-Security-Policy-Report-Only',
    value: contentSecurityPolicy,
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
];

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
