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

Call protected `POST /api/indexer/sync` with `Authorization: Bearer $INDEXER_SECRET`. Small resumable ranges decode `Launch`, `LaunchQuoteUsed`, protocol events, and the production SwapRouter's `SwapExecuted` logs. Writes are idempotent, and each stream keeps its own checkpoint. Continue until the top-level `caughtUp`, `protocol.caughtUp`, and `swaps.caughtUp` values are all `true`. Only the production Factory and SwapRouter are indexed.

The token detail page reads the latest 20 confirmed swaps from `GET /api/swaps?token=0x…`, shows exact paid/received amounts, and estimates USD from the routed ETH, USDC, or VVV leg. Set `SWAP_INDEXER_START_BLOCK` to the SwapRouter deployment block when known; otherwise it safely starts at the Factory checkpoint. Schedule the protected sync endpoint regularly in production so new swaps appear without relying on a visitor's RPC connection.

After log sync, the same endpoint runs the market stage. It snapshots an index-time USD estimate for unpriced swaps, quotes every initialized B20/VVV pool, stores current price/market cap and periodic price snapshots, calculates 24-hour token activity, then refreshes the `liqpad-v1` aggregate row. The Discover strip reports production Factory launches, all-time indexed USD volume, unique payer wallets, and the current highest market cap. Missing FX remains null and is displayed as unavailable rather than zero. Apply the latest `supabase/schema.sql` before enabling this stage, and continue sync until `market.caughtUp` is also `true` without an `error` field.

## Production indexer worker

Production indexing is designed to run continuously on an Ubuntu 24.04 VPS. The worker reuses the same idempotent factory, protocol, swap, burn, and market stages as the authenticated Route Handler, but it does not depend on Vercel requests or cron execution.

Apply `supabase/migrations/0001_indexer_worker_status.sql`, then copy `deploy/indexer.env.example` to `/etc/liqpad/indexer.env` and replace every placeholder. `INDEXER_RPC_URL` must be the server-only Alchemy Base Mainnet endpoint assigned to the indexer application. Never expose it with a `NEXT_PUBLIC_` prefix.

On the VPS, place the repository at `/srv/liqpad-web`, install locked dependencies, and install the service:

```bash
cd /srv/liqpad-web
corepack enable
pnpm install --frozen-lockfile
sudo install -d -m 700 /etc/liqpad
sudo install -m 600 deploy/indexer.env.example /etc/liqpad/indexer.env
# Edit /etc/liqpad/indexer.env before continuing.
sudo install -m 644 deploy/liqpad-indexer.service /etc/systemd/system/liqpad-indexer.service
sudo systemctl daemon-reload
sudo systemctl enable --now liqpad-indexer
sudo systemctl status liqpad-indexer
sudo journalctl -u liqpad-indexer -f
```

The worker waits 12 confirmations by default, catches up in bounded block ranges, persists checkpoints only after successful writes, updates `indexer_workers` on every cycle, backs off after failures, and shuts down cleanly on `SIGTERM`. Market work runs on a separate cadence so price APIs and pool quotes are not called on every block poll. The existing `POST /api/indexer/sync` remains available as a protected diagnostic/manual fallback and now calls the same shared runner.

After changing the service or environment file:

```bash
sudo systemctl daemon-reload
sudo systemctl restart liqpad-indexer
sudo journalctl -u liqpad-indexer -n 100 --no-pager
```

Discover queries `GET /api/tokens` in 24-item server-side pages, including database-backed search and sorting. Desktop uses numbered navigation and mobile uses compact previous/next controls. Latest swaps use a stable block/log cursor with “Load older swaps”; transparency tables render 20–25 rows per page, creator launches use 12-item URL pages, and `/me` reveals created tokens in batches of 12.

## Trading

The token page validates `factory.isLiqpadLaunch(token)` before enabling the production SwapRouter. It supports ETH, USDC, and VVV buys plus B20 sells back to ETH, USDC, or VVV. The underlying pool is always B20/VVV; ETH and USDC are routing assets. Quotes use Aerodrome for routed VVV legs and the Base Uniswap v4 Quoter for the hooked pool. Minimums use bigint math, approvals are exact and target only the production router, and every swap is simulated before submission.

## Production contracts

- Factory: `0x7e22764f1A1CBB8B60A5Ca1D3bAed720A48AA3D2`
- Hook: `0x10F775c7F82e57577b47E6401DE31DFC9BADe0cC`
- FeeRouter: `0x1A1D815DbEADCc8cE783eD001f9733280F3E2e5e`
- LockedPositionVault: `0xAF8082B81Df88977B254342996cfe518F16477D6`
- SwapRouter: `0xf5ea55a69307cf2cf598ccb0ea947ffdc52f985e`
- VVV: `0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf`
- AgentFeeSplitterFactory: `0x632eEd8756899Fe56De4bAC48A74847b029826BA`
- AgentFeeSplitter implementation: `0x2954F34dA1E0D9d861dd2E265b364FDD1DC00eED`

POTPAL (`0xB20000000000000000000010238055932234F173`) is the first live production fixture.

## Agent launcher (beta)

Apply `supabase/migrations/0002_agent_registry.sql`, then configure `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_PRIVY_CLIENT_ID`, `PRIVY_APP_SECRET`, and `PRIVY_VERIFICATION_KEY`. The public registration route creates a server-controlled Privy Ethereum wallet and stores its wallet ID only in the private `agent_wallet_bindings` table. Never expose `PRIVY_APP_SECRET` or the wallet binding table to the browser.

`/agents/create` registers the identity and treasury. `/agents/[slug]/launch` then prepares one branded `0xb07` B20 and performs two explicit Base transactions: create the deterministic splitter, then launch the B20 with that splitter as `creator`. Final database activation occurs only after the server verifies both receipts, the Factory profile, token address, human recipient, and agent treasury on-chain.

Agent deployment is creator-funded. Liqpad does not sponsor gas: the registered creator confirms and pays Base network gas for both the splitter creation and B20 launch transactions. The interface discloses this before registration and again before either transaction is submitted.

Agent creator fees preserve the protocol's 30% allocation. The remaining 70% creator allocation is distributed as 30% of total fees to the human creator and 40% to the agent treasury. The VPS worker indexes splitter creation and distributions; set `AGENT_FEE_SPLITTER_START_BLOCK` to the verified factory deployment block before restarting it.

## Gate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Liqpad · liqpad.com

## SEO and social previews

Every public page has a canonical `liqpad.com` URL, descriptive Open Graph and X metadata, and crawler directives. Token and creator routes are added to the dynamic sitemap from the active Factory index; wallet-specific `/me` and all `/api` routes are excluded from indexing. Organization, website, application, launch-list, token-page, breadcrumb, and creator-profile structured data is emitted as JSON-LD.

The homepage social card is generated at `GET /api/og/site`. Each indexed token has a resilient `1200×630` card at `GET /api/og/token/[address]` with its logo, identity, price, market cap, volume, 24-hour change, burned supply, and locked-liquidity status. Missing market or image data produces a branded fallback rather than failing the image response. Social networks cache preview images independently, so live market figures are snapshots from the crawler request time.

Real interface captures belong in `screenshots/`; follow `screenshots/README.md`. Do not commit mock screenshots or wallet-identifying overlays.
# Protocol transparency

`/transparency` is a read-only Base dashboard for Liqpad's 30% protocol-owned Venice capital allocation. Current balances and DiemEngine counters are read through the existing RPC architecture; confirmed `FeeAccrued`, `PlatformSwept`, `Harvest`, and unwind/status events are stored idempotently in Supabase.

VVV/USD uses CoinGecko with DefiLlama fallback. DIEM/USD uses GeckoTerminal's public Base token-price endpoint with a 30-second server cache. The sVVV balance is read from its ERC-1967 proxy; the verified implementation is linked separately for transparency.

Apply the additive statements in `supabase/schema.sql`, then run the existing authenticated indexer endpoint until the factory, `protocol`, and `swaps` results report `caughtUp: true`. The protocol and swap indexers wait 12 confirmations. Protocol history can be overridden with server-only `DIEM_ENGINE_START_BLOCK`; swap history can be narrowed to the router deployment block with `SWAP_INDEXER_START_BLOCK`.
