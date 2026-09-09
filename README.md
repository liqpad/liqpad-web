# Liqpad Web

Next.js 15 App Router interface for **Liqpad Launcher v1** on Base mainnet. Canonical site: **https://liqpad.com**.

## Local setup

```bash
pnpm i
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000. Configure WalletConnect, Pinata, and Supabase in `.env.local`. Set `BASE_RPC_URL` to an authenticated Base RPC; it stays server-only and powers launch quotes, indexing, and the allowlisted read-only `/api/rpc` browser proxy. Keep `NEXT_PUBLIC_BASE_RPC_URL=/api/rpc` so the provider URL and credentials are never shipped to the browser. Launcher v1 is Base mainnet (`8453`) only.

## Secure launch quotes

As soon as the launch page opens, a Web Worker mines a random `bytes32` counter in the background until the predicted B20 address ends in `0xb07`. React rendering remains unblocked and no RPC request is made per attempt. The winning candidate is verified once with production `Factory.predictAddress(salt)` and `getCode`; only then does the form upload metadata and send target FDV, creator, and the locked salt to `POST /api/launch/quote`. The server obtains a fresh VVV/USD reference, derives a tick-spacing-aligned frame, confirms its signer matches the Factory `quoteSigner`, and signs a five-minute EIP-712 `LaunchQuote`. Set the server-only `QUOTE_SIGNER_PRIVATE_KEY`; the route fails closed when it is absent or mismatched. Never use a `NEXT_PUBLIC_*` signer key.

The browser shows the signed frame, ticks, estimated FDV, expiry countdown, and branded predicted B20 address. The salt is not regenerated after signing. It simulates the complete `createLaunch(params, quote, signature)` call before opening the wallet. The receipt `Launch` event must match the prediction before the token is saved and opened.

## Supabase/indexer migration

Run `supabase/schema.sql` in the Supabase SQL editor, then configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The migration preserves old rows as `legacy`, adds quote fields, and creates the Launcher v1 checkpoint at block `51050148` so the first scanned block is `51050149`.

Call protected `POST /api/indexer/sync` with `Authorization: Bearer $INDEXER_SECRET`. Small resumable ranges decode both `Launch` and `LaunchQuoteUsed`, fetch `getProfile`, and idempotently upsert by case-insensitive token identity. Only the production Factory is queried for active v1 launches.

## Trading

The token page validates `factory.isLiqpadLaunch(token)` before enabling the production SwapRouter. It supports ETH, USDC, and VVV buys plus B20 sells back to ETH, USDC, or VVV. The underlying pool is always B20/VVV; ETH and USDC are routing assets. Quotes use Aerodrome for routed VVV legs and the Base Uniswap v4 Quoter for the hooked pool. Minimums use bigint math, approvals are exact and target only the production router, and every swap is simulated before submission.

## Production contracts

- Factory: `0x7e22764f1A1CBB8B60A5Ca1D3bAed720A48AA3D2`
- Hook: `0x10F775c7F82e57577b47E6401DE31DFC9BADe0cC`
- FeeRouter: `0x1A1D815DbEADCc8cE783eD001f9733280F3E2e5e`
- LockedPositionVault: `0xAF8082B81Df88977B254342996cfe518F16477D6`
- SwapRouter: `0xf5ea55a69307cf2cf598ccb0ea947ffdc52f985e`
- VVV: `0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf`

POTPAL (`0xB20000000000000000000010238055932234F173`) is the first live production fixture.

## Gate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Liqpad · liqpad.com
