import type {Metadata} from 'next';
import Link from 'next/link';
import {ADDRESSES,CHAIN_ID,LIQPAD_TOKEN,SUPPLY,TICK_SPACING} from '@/lib/constants';
import {short} from '@/lib/utils';
import {pageMetadata} from '@/lib/seo';

export const metadata:Metadata=pageMetadata({title:'Documentation',description:'Understand how Liqpad launches B20 tokens, routes trades, burns fees, rewards creators, indexes data, and manages protocol capital on Base.',path:'/docs'});

const sections=[
  ['overview','Overview'],['audiences','Who it is for'],['launch','Launching'],['tokens','Token model'],['trading','Trading'],['fees','Fees & burn'],['capital','Protocol capital'],['funds','Fund separation'],['data','Data & indexing'],['developers','Developer reference'],['risks','Risks'],['faq','FAQ'],
] as const;

const contracts=[
  ['Factory',ADDRESSES.factory,'Creates launches and stores canonical profiles.'],
  ['Launch Hook',ADDRESSES.hook,'Enforces the Liqpad pool fee and burn behavior.'],
  ['Hook Deployer',ADDRESSES.hookDeployer,'Deploys the configured Uniswap v4 hook.'],
  ['FeeRouter',ADDRESSES.feeRouter,'Accounts for creator and protocol VVV independently.'],
  ['Locked Position Vault',ADDRESSES.vault,'Holds the launch liquidity position.'],
  ['Swap Router',ADDRESSES.swapRouter,'Routes exact-input B20, VVV, ETH, and USDC trades.'],
  ['DiemEngine',ADDRESSES.diemEngine,'Processes the protocol share into Venice capital.'],
  ['VeniceAdapter',ADDRESSES.adapter,'Connects VVV staking, sVVV, and DIEM operations.'],
  ['VVV',ADDRESSES.vvv,'The only quote token for every Liqpad launch pool.'],
  ['sVVV proxy',ADDRESSES.svvv,'Canonical sVVV balance and interaction address.'],
  ['DIEM',ADDRESSES.diem,'DIEM token used by the protocol capital path.'],
] as const;

export default function DocsPage(){return <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
  <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(64,232,255,.12),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,58,167,.12),transparent_42%),rgba(255,255,255,.025)] p-6 sm:p-10">
    <p className="text-sm font-bold uppercase tracking-[.22em] text-cyan">Liqpad documentation · Beta</p>
    <h1 className="mt-4 max-w-4xl font-display text-4xl font-black leading-tight sm:text-6xl">Understand the launch. Verify the flow.</h1>
    <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">A practical reference for creators, traders, developers, researchers, and anyone evaluating Liqpad. Contracts remain the source of truth; this guide explains how the pieces fit together.</p>
    <div className="mt-7 flex flex-wrap gap-3"><Link href="/launch" className="btn btn-primary">Create a B20 →</Link><Link href="/transparency" className="btn btn-ghost">Protocol transparency</Link><a href={`https://basescan.org/address/${ADDRESSES.factory}`} target="_blank" rel="noreferrer" className="btn btn-ghost">Factory on BaseScan ↗</a></div>
  </header>

  <details className="card mt-5 p-4 lg:hidden"><summary className="cursor-pointer font-bold text-cyan">On this page</summary><nav aria-label="Documentation sections" className="mt-4 grid gap-1">{sections.map(([id,label])=><a key={id} href={`#${id}`} className="min-h-11 rounded-lg px-3 py-3 text-sm text-muted hover:bg-white/5 hover:text-white">{label}</a>)}</nav></details>

  <div className="mt-10 grid items-start gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
    <aside className="sticky top-24 hidden lg:block"><p className="px-3 text-xs font-bold uppercase tracking-[.18em] text-muted">On this page</p><nav aria-label="Documentation sections" className="mt-3 grid gap-1">{sections.map(([id,label])=><a key={id} href={`#${id}`} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-cyan">{label}</a>)}</nav><div className="mt-6 border-t border-white/10 px-3 pt-5 text-xs leading-5 text-muted">Base Mainnet<br/><span className="text-white">Chain ID {CHAIN_ID}</span><br/>Documentation reflects the contracts configured by liqpad.com.</div></aside>

    <article className="min-w-0 max-w-4xl space-y-16">
      <Section id="overview" eyebrow="Start here" title="What is Liqpad?">
        <p>Liqpad is a permissionless B20 launchpad on Base. A creator can publish token metadata, create a fixed-supply B20, initialize its VVV market, and lock the launch liquidity position through one guided transaction.</p>
        <Callout title="The invariant">Every Liqpad launch uses a B20/VVV Uniswap v4 pool, fixed initial supply, single-sided launch liquidity, and a locked position. The web never asks creators to choose a tick or supply ETH/USDC as the pool quote asset.</Callout>
        <Flow items={['Create B20','Open B20/VVV pool','Lock position','Trade','Burn + distribute fees']}/>
        <p>Liqpad is in Beta. Beta describes the product and its supporting infrastructure; it does not change what verified contract transactions do on Base.</p>
      </Section>

      <Section id="audiences" eyebrow="Use cases" title="Who is Liqpad for?">
        <div className="grid gap-4 sm:grid-cols-2"><Audience title="Creators" text="Launch a B20 and its market, publish an IPFS profile, monitor activity, and claim earned VVV."/><Audience title="Traders" text="Discover Factory-created markets and trade through the Liqpad router with transparent estimates and slippage protection."/><Audience title="Developers" text="Read canonical profiles, events, pool configuration, fee accruals, and public indexed data."/><Audience title="Researchers & community" text="Verify burns, fee allocation, locked liquidity, creator reserves, protocol capital, and transaction history."/></div>
      </Section>

      <Section id="launch" eyebrow="For creators" title="How a launch works">
        <Steps items={[
          ['Complete the profile','Enter a name, symbol, logo, description, and any optional public links. Logo and description are required by the Liqpad web interface.'],
          ['Publish metadata','Liqpad creates the contract metadata JSON and uploads it to IPFS. The creator does not type a contractURI manually.'],
          ['Prepare 0xb07 branding','An off-main-thread miner finds a salt whose Factory-predicted B20 address ends in 0xb07. This is a Liqpad identity marker, not a security rating.'],
          ['Calculate the opening','The opening frame is calculated from the selected target FDV and the current VVV/USD reference price, rounded to tick spacing, then authorized by a time-limited signed launch quote.'],
          ['Simulate and confirm','The exact createLaunch call is simulated before the wallet request. The creator then confirms the Base transaction.'],
          ['Confirm and index','After the receipt confirms, Liqpad verifies the Launch event and stores an indexed copy for fast discovery. The blockchain remains authoritative.'],
        ]}/>
        <InfoGrid entries={[["Initial supply",`${SUPPLY.toLocaleString('en-US')} B20`],["Quote token","VVV only"],["Tick spacing",String(TICK_SPACING)],["Liquidity","Single-sided and locked"],["Address identity","Last 12 bits: 0xb07"],["Metadata","JSON on IPFS"]]}/>
      </Section>

      <Section id="tokens" eyebrow="Token model" title="What is created?">
        <ul className="list-disc space-y-3 pl-5"><li>A B20 ASSET token with 18 decimals and an initial supply of one billion.</li><li>A B20/VVV Uniswap v4 pool configured with the Liqpad launch hook.</li><li>A locked launch liquidity position; creators do not receive an unlockable LP position.</li><li>An on-chain Factory profile containing creator, identity, metadata, pool ID, and launch time.</li><li>A token whose circulating supply can decline as assessed B20 fees are permanently burned.</li></ul>
        <Callout title="Market cap versus initial supply">Liqpad displays market cap using the current token supply when available. Burned B20 is removed from supply, so market cap should not always be calculated against the original one billion.</Callout>
      </Section>

      <Section id="trading" eyebrow="For traders" title="How trading works">
        <p>The core market is always B20/VVV. ETH and USDC are convenient routing assets provided by LiqpadSwapRouter; they do not replace VVV as the launch pool quote token.</p>
        <div className="grid gap-3 sm:grid-cols-2"><Route text="VVV → B20"/><Route text="ETH → VVV → B20"/><Route text="USDC → VVV → B20"/><Route text="B20 → VVV"/><Route text="B20 → VVV → ETH"/><Route text="B20 → VVV → USDC"/></div>
        <h3>What the swap widget protects</h3><ul className="list-disc space-y-3 pl-5"><li>Exact-input only: you choose what you spend; exact-output is not offered.</li><li>Output is quoted from the configured route and refreshed before submission.</li><li>Slippage creates a minimum acceptable output; a deadline prevents stale execution.</li><li>An ERC-20 input may require an approval transaction followed by a separate swap transaction.</li><li>The router validates Liqpad launches and does not intentionally aggregate across unrelated pools.</li></ul>
        <Warning title="Trading risk">Locked liquidity and a verified contract do not guarantee price stability. New markets can be volatile, thinly traded, and exposed to slippage.</Warning>
      </Section>

      <Section id="fees" eyebrow="Fee mechanics" title="One percent, with two different outcomes">
        <div className="grid gap-4 sm:grid-cols-3"><Stat value="1%" label="Hook-assessed trading fee"/><Stat value="70%" label="Creator share of assessed VVV"/><Stat value="30%" label="Protocol share of assessed VVV"/></div>
        <p>On the B20 side, the assessed fee is burned. On the VVV side, FeeRouter accounts for the creator and protocol portions separately.</p>
        <div className="overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-white/[.04] text-muted"><tr><th className="p-4">Flow</th><th className="p-4">B20 outcome</th><th className="p-4">VVV outcome</th></tr></thead><tbody><tr className="border-t border-white/10"><td className="p-4 font-bold">VVV → B20</td><td className="p-4">B20 output reaches the trader</td><td className="p-4">Assessed from exact VVV input</td></tr><tr className="border-t border-white/10"><td className="p-4 font-bold">B20 → VVV</td><td className="p-4">Assessed B20 input is burned</td><td className="p-4">Assessed from gross VVV output</td></tr></tbody></table></div>
        <p>Creators claim with <Code>claim(token)</Code> or <Code>claimAll()</Code>. A claim changes custody, not the historical amount earned.</p>
      </Section>

      <Section id="capital" eyebrow="Protocol transparency" title="What happens to the protocol share?">
        <Flow items={['FeeRouter','sweepPlatform()','DiemEngine','harvest()','VVV reserve + staking','sVVV locked','DIEM minted / staked']}/>
        <ul className="list-disc space-y-3 pl-5"><li><Code>sweepPlatform()</Code> moves only the protocol amount recorded by <Code>platformAccrued()</Code>.</li><li><Code>harvest()</Code> maintains the configured liquid VVV reserve and sends eligible capital through VeniceAdapter.</li><li>Staking produces sVVV, which is locked as part of the protocol capital path.</li><li>DIEM minting occurs only when the configured minimum is met. Automatic DIEM staking depends on live DiemEngine configuration.</li><li>The contract operations are permissionless. Liqpad may limit operational buttons in its interface to reduce accidental or confusing submissions.</li></ul>
        <Link href="/transparency" className="card mt-6 flex min-h-16 items-center justify-between gap-4 p-4 transition hover:border-cyan/40"><span><b>Inspect live protocol accounting</b><span className="mt-1 block text-sm text-muted">Balances, lifetime counters, events, contributions, and capital-flow charts.</span></span><span className="text-cyan">→</span></Link>
      </Section>

      <Section id="funds" eyebrow="Accounting" title="Creator funds are not protocol funds">
        <div className="grid gap-4 md:grid-cols-2"><Compare title="Creator claim reserve" tone="cyan" items={['70% of assessed VVV fees','Held by FeeRouter until claimed','Withdrawn with claim() or claimAll()','Not eligible for sweepPlatform()']}/><Compare title="Protocol accrual" tone="magenta" items={['30% of assessed VVV fees','Recorded by platformAccrued()','Eligible for sweepPlatform()','Processed by DiemEngine']}/></div>
        <Callout title="How the dashboard labels FeeRouter">Creator VVV awaiting claims is derived from the FeeRouter VVV balance minus protocol VVV pending sweep. The two values are displayed independently so creator liabilities are not presented as treasury capital.</Callout>
      </Section>

      <Section id="data" eyebrow="Data model" title="Blockchain first, indexed for speed">
        <div className="grid gap-4 sm:grid-cols-2"><Audience title="Source of truth" text="Factory profiles, token supply, balances, pool state, receipts, and emitted Base events determine what happened."/><Audience title="Liqpad indexer" text="Supabase stores confirmed, query-friendly copies for discovery, feeds, charts, market summaries, and creator pages."/><Audience title="Market providers" text="GeckoTerminal and Dexscreener can supply pool discovery and charts. CoinGecko or DefiLlama can supply external USD references."/><Audience title="Graceful fallback" text="If an external FX or chart provider is unavailable, Liqpad should retain token-denominated data and label USD as unavailable."/></div>
        <Warning title="Indexing delay">A successful Base transaction may appear before the website indexer or a third-party chart provider catches up. Verify the transaction receipt and token address before submitting it again.</Warning>
      </Section>

      <Section id="developers" eyebrow="For developers" title="Developer reference">
        <InfoGrid entries={[["Network","Base Mainnet"],["Chain ID",String(CHAIN_ID)],["Token standard","B20 ASSET"],["Decimals","18"],["Quote token","VVV"],["Canonical UI","https://liqpad.com"]]}/>
        <h3>Important reads and writes</h3><div className="flex flex-wrap gap-2">{['createLaunch(params, quote, signature)','getProfile(token)','creatorTokens(creator)','creatorAccrued(creator, token)','platformAccrued()','claim(token)','claimAll()','sweepPlatform()','harvest()','poolKey(b20)'].map(item=><Code key={item}>{item}</Code>)}</div>
        <h3>Important events</h3><div className="flex flex-wrap gap-2">{['Launch','SwapExecuted','FeeAccrued','PlatformSwept','Harvest','UnwindBegun','UnwindProgressed'].map(item=><Code key={item}>{item}</Code>)}</div>
        <h3>Canonical contracts</h3><p>These addresses come from the same runtime configuration used by the Liqpad web application.</p><div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">{contracts.map(([name,address,description])=><a key={name} href={`https://basescan.org/address/${address}`} target="_blank" rel="noreferrer" className="grid gap-2 p-4 transition hover:bg-white/[.035] sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center"><b>{name}</b><span className="text-sm text-muted">{description}</span><span className="font-mono text-xs text-cyan" title={address}>{short(address)} ↗</span></a>)}</div>
        <Callout title="Contract precedence">If documentation, cached data, or third-party interfaces disagree with a confirmed contract read or receipt, use the Base contract state and transaction logs as the source of truth.</Callout>
      </Section>

      <Section id="risks" eyebrow="Read before using" title="Risks and trust assumptions">
        <ul className="list-disc space-y-3 pl-5"><li><b className="text-white">Beta software:</b> interfaces, indexers, pricing sources, and operational tooling may change or fail.</li><li><b className="text-white">Smart-contract risk:</b> verification makes source review possible; it does not by itself prove correctness or constitute an audit.</li><li><b className="text-white">Market risk:</b> tokens can lose value, liquidity can be thin, and slippage can be significant.</li><li><b className="text-white">External dependencies:</b> Base, Uniswap v4, B20, Venice, RPC providers, IPFS gateways, and price/chart APIs can be delayed or unavailable.</li><li><b className="text-white">Metadata:</b> IPFS content availability still depends on durable pinning and accessible gateways.</li><li><b className="text-white">Vanity identity:</b> the 0xb07 suffix is branding and does not prove authenticity on its own. Verify the Factory.</li><li><b className="text-white">Governance:</b> the Safe owner may manage or unwind protocol DIEM according to the contract design. This does not make creator claim reserves protocol funds.</li></ul>
      </Section>

      <Section id="faq" eyebrow="Common questions" title="Frequently asked questions">
        <div className="space-y-3"><Faq q="Why does every token end in 0xb07?">Liqpad mines a CREATE2 salt off-chain before launch so the predicted B20 address has the branded suffix. Always verify that the token was emitted by the canonical Factory.</Faq><Faq q="Why does Liqpad use VVV?">VVV is the common quote asset for every launch. A shared quote model makes launch configuration, pool routing, fees, and protocol accounting consistent.</Faq><Faq q="Can I create an ETH or USDC pool?">Not through the Liqpad launch flow. The canonical pool is B20/VVV. ETH and USDC are routing conveniences in LiqpadSwapRouter.</Faq><Faq q="Why does my wallet open twice?">ERC-20 trading can require approval first and the swap second. The second wallet request opens after approval confirms and the quote is refreshed.</Faq><Faq q="Why is the chart still indexing?">The Base launch can be complete before GeckoTerminal, Dexscreener, or the Liqpad indexer has processed the pool. Check the receipt and try again later instead of redeploying.</Faq><Faq q="Why is USD unavailable?">USD values depend on external reference-price APIs. On-chain token amounts remain valid even when an FX provider is unavailable.</Faq><Faq q="How do creators receive fees?">Creator VVV accrues per token in FeeRouter and remains there until the creator calls claim or claimAll from the creator wallet.</Faq><Faq q="Can sweepPlatform move creator funds?">No. It processes the separately accounted platformAccrued amount. Creator claim reserves remain liabilities of FeeRouter.</Faq><Faq q="Why does DiemEngine retain liquid VVV?">DiemEngine maintains a configured reserve. Only eligible VVV above the reserve is staked during Harvest.</Faq><Faq q="Does locked liquidity guarantee token value?">No. It prevents the launch position from being withdrawn through the normal LP path, but price still responds to trading and market conditions.</Faq><Faq q="Is 0xb07 an audit or safety guarantee?">No. It is a deterministic Liqpad branding suffix. Factory origin, source code, permissions, and transaction history must still be verified.</Faq><Faq q="What should I include in a bug report?">Include the Base transaction hash, token address, connected wallet, page URL, exact error, approximate time, browser, network, and a screenshot. Never share a seed phrase or private key.</Faq></div>
      </Section>

      <footer className="rounded-3xl border border-cyan/20 bg-cyan/[.05] p-6 sm:p-8"><h2 className="font-display text-2xl font-black">Still need an answer?</h2><p className="mt-3 text-muted">Start with the transaction on BaseScan, confirm the canonical contract, then check live protocol data. Those three checks resolve most launch, trade, fee, and indexing questions.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/" className="btn btn-ghost">Discover</Link><Link href="/launch" className="btn btn-primary">Launch</Link><Link href="/transparency" className="btn btn-ghost">Transparency</Link></div><p className="mt-6 break-all font-mono text-xs text-muted">Official $LIQPAD · {LIQPAD_TOKEN}</p></footer>
    </article>
  </div>
</div>}

function Section({id,eyebrow,title,children}:{id:string;eyebrow:string;title:string;children:React.ReactNode}){return <section id={id} className="scroll-mt-24 space-y-5 text-base leading-7 text-muted"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan">{eyebrow}</p><h2 className="mt-2 font-display text-3xl font-black text-white sm:text-4xl">{title}</h2></div>{children}</section>}
function Callout({title,children}:{title:string;children:React.ReactNode}){return <div className="rounded-2xl border border-cyan/20 bg-cyan/[.055] p-5"><p className="font-bold text-white">{title}</p><p className="mt-2 text-sm leading-6 text-muted">{children}</p></div>}
function Warning({title,children}:{title:string;children:React.ReactNode}){return <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[.055] p-5"><p className="font-bold text-amber-100">{title}</p><p className="mt-2 text-sm leading-6 text-muted">{children}</p></div>}
function Audience({title,text}:{title:string;text:string}){return <div className="card p-5"><h3 className="!mt-0 text-lg font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div>}
function Steps({items}:{items:readonly (readonly [string,string])[]}){return <ol className="space-y-4">{items.map(([title,text],index)=><li key={title} className="card flex gap-4 p-5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-magenta/15 text-sm font-black text-magenta">{index+1}</span><span><b className="text-white">{title}</b><span className="mt-1 block text-sm leading-6 text-muted">{text}</span></span></li>)}</ol>}
function Flow({items}:{items:readonly string[]}){return <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/15 p-4 sm:flex-row sm:flex-wrap sm:items-center">{items.map((item,index)=><span key={`${item}-${index}`} className="contents"><span className="rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-center text-sm font-bold text-white">{item}</span>{index<items.length-1&&<span aria-hidden className="text-center text-magenta sm:rotate-0">→</span>}</span>)}</div>}
function InfoGrid({entries}:{entries:readonly (readonly [string,string])[]}){return <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{entries.map(([label,value])=><div key={label} className="card p-4"><dt className="text-xs uppercase tracking-wider text-muted">{label}</dt><dd className="mt-2 break-words font-bold text-white">{value}</dd></div>)}</dl>}
function Route({text}:{text:string}){return <div className="rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-center font-mono text-sm font-bold text-cyan">{text}</div>}
function Stat({value,label}:{value:string;label:string}){return <div className="card p-5"><p className="font-display text-3xl font-black text-white">{value}</p><p className="mt-2 text-sm text-muted">{label}</p></div>}
function Code({children}:{children:React.ReactNode}){return <code className="inline-flex rounded-lg border border-white/10 bg-black/25 px-2.5 py-1 font-mono text-xs text-cyan">{children}</code>}
function Compare({title,tone,items}:{title:string;tone:'cyan'|'magenta';items:string[]}){return <div className={`rounded-2xl border p-5 ${tone==='cyan'?'border-cyan/25 bg-cyan/[.045]':'border-magenta/25 bg-magenta/[.045]'}`}><h3 className="!mt-0 text-xl font-bold text-white">{title}</h3><ul className="mt-4 space-y-3 text-sm">{items.map(item=><li key={item} className="flex gap-2"><span className={tone==='cyan'?'text-cyan':'text-magenta'}>◆</span><span>{item}</span></li>)}</ul></div>}
function Faq({q,children}:{q:string;children:React.ReactNode}){return <details className="group rounded-2xl border border-white/10 bg-white/[.025] p-5"><summary className="flex min-h-7 cursor-pointer list-none items-center justify-between gap-4 font-bold text-white"><span>{q}</span><span aria-hidden className="text-cyan transition group-open:rotate-45">＋</span></summary><p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-muted">{children}</p></details>}
