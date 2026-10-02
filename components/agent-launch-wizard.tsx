"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAddress,
  zeroAddress,
  zeroHash,
  type Address,
  type Hex,
} from "viem";
import {
  useAccount,
  useChainId,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useAutoMineB07 } from "@/hooks/useAutoMineB07";
import { ADDRESSES, CHAIN_ID } from "@/lib/constants";
import type { PublicAgent } from "@/lib/agents";
import type { SignedLaunchQuote } from "@/lib/launch-quote";
import { factoryAbi } from "@/src/abi/factory";
import { agentFeeSplitterFactoryAbi } from "@/src/abi/agentFeeSplitter";
import { AgentProcessOverlay } from "@/components/agent-process-overlay";

export function AgentLaunchWizard({ agent }: { agent: PublicAgent }) {
  const miner = useAutoMineB07();
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  const { authenticated, login, getAccessToken } = usePrivy();
  const [targetFdv, setTargetFdv] = useState("10000");
  const [salt, setSalt] = useState<Hex>();
  const [token, setToken] = useState<Address>();
  const [splitter, setSplitter] = useState<Address>();
  const [contractURI, setContractURI] = useState("");
  const [quote, setQuote] = useState<SignedLaunchQuote>();
  const [busy, setBusy] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");
  const saved = useRef(false);
  const splitWrite = useWriteContract();
  const splitReceipt = useWaitForTransactionReceipt({
    hash: splitWrite.data,
    confirmations: 1,
    query: { enabled: !!splitWrite.data },
  });
  const launchWrite = useWriteContract();
  const launchReceipt = useWaitForTransactionReceipt({
    hash: launchWrite.data,
    confirmations: 1,
    query: { enabled: !!launchWrite.data },
  });
  useEffect(()=>{
    if(launchWrite.data)window.localStorage.setItem(`liqpad:agent-launch:${agent.slug}`,launchWrite.data);
  },[agent.slug,launchWrite.data]);
  const splitArgs = useMemo(
    () =>
      [
        agent.agent_id,
        token!,
        agent.human_creator,
        agent.agent_wallet_address,
      ] as const,
    [agent, token],
  );
  const splitSim = useSimulateContract({
    address: ADDRESSES.agentFeeSplitterFactory,
    abi: agentFeeSplitterFactoryAbi,
    functionName: "createSplitter",
    args: splitArgs,
    account: address,
    query: {
      enabled: !!address && !!token && !!splitter && !splitReceipt.isSuccess,
    },
  });
  const launchParams = useMemo(
    () => ({
      name: agent.name,
      symbol: agent.symbol,
      salt: salt || zeroHash,
      contractURI,
      description: agent.description,
      logoURI: agent.avatar_url || "",
      website: agent.website || "",
      socials: {
        twitter: agent.twitter || "",
        telegram: "",
        farcaster: "",
        discord: "",
      },
      creator: splitter || zeroAddress,
    }),
    [agent, contractURI, salt, splitter],
  );
  const launchQuote = useMemo(
    () =>
      quote
        ? { ...quote.quote, validUntil: BigInt(quote.quote.validUntil) }
        : undefined,
    [quote],
  );
  const launchSim = useSimulateContract({
    address: ADDRESSES.factory,
    abi: factoryAbi,
    functionName: "createLaunch",
    args: launchQuote
      ? [launchParams, launchQuote, quote!.signature]
      : undefined,
    account: address,
    query: {
      enabled: splitReceipt.isSuccess && !!launchQuote && !!contractURI,
    },
  });
  async function prepare() {
    if (!authenticated) {
      login();
      return;
    }
    if (!address || getAddress(address) !== getAddress(agent.human_creator))
      return setError("Connect the registered human creator wallet.");
    if (chainId !== CHAIN_ID) return setError("Switch to Base mainnet first.");
    setBusy(true);
    setError("");
    try {
      const candidate = await miner.verify();
      const prediction = await fetch("/api/agents/prepare-launch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: agent.agent_id,
          token: candidate.token,
          humanCreator: agent.human_creator,
          agentTreasury: agent.agent_wallet_address,
        }),
      });
      const predictionJson = await prediction.json();
      if (!prediction.ok)
        throw new Error(predictionJson.error || "Splitter prediction failed.");
      const metadata = await fetch("/api/upload/metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: agent.name,
          symbol: agent.symbol,
          image: agent.avatar_url,
          description: agent.description,
          website: agent.website,
          twitter: agent.twitter,
        }),
      });
      const metadataJson = await metadata.json();
      if (!metadata.ok)
        throw new Error(metadataJson.error || "Metadata upload failed.");
      const quoteResponse = await fetch("/api/launch/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          creator: predictionJson.splitter,
          launchSalt: candidate.salt,
          targetFdvUsd: Number(targetFdv),
        }),
      });
      const quoteJson = await quoteResponse.json();
      if (!quoteResponse.ok)
        throw new Error(quoteJson.error || "Launch quote failed.");
      if (getAddress(quoteJson.predictedToken) !== getAddress(candidate.token))
        throw new Error("Token prediction changed during preparation.");
      setSalt(candidate.salt);
      setToken(candidate.token);
      setSplitter(predictionJson.splitter);
      setContractURI(metadataJson.uri);
      setQuote(quoteJson);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Preparation failed.");
    } finally {
      setBusy(false);
    }
  }
  const save = useCallback(async () => {
    if (
      saved.current ||
      !launchWrite.data ||
      !token ||
      !splitter ||
      !splitWrite.data
    )
      return;
    saved.current = true;
    setFinalizing(true);
    try {
      const confirm = await fetch("/api/launch/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hash: launchWrite.data, expectedToken: token }),
      });
      const confirmed = await confirm.json();
      if (!confirm.ok)
        throw new Error(confirmed.error || "Launch indexing failed.");
      const auth = await getAccessToken();
      const update = await fetch(`/api/agents/${agent.slug}/launch`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${auth}`,
        },
        body: JSON.stringify({
          token,
          splitter,
          splitterTxHash: splitWrite.data,
          launchTxHash: launchWrite.data,
        }),
      });
      const result = await update.json();
      if (!update.ok)
        throw new Error(result.error || "Agent launch confirmation failed.");
      window.localStorage.removeItem(`liqpad:agent-launch:${agent.slug}`);
      router.push(`/agent/${agent.slug}`);
    } catch (cause) {
      saved.current = false;
      setFinalizing(false);
      setError(cause instanceof Error ? cause.message : "Confirmation failed.");
    }
  }, [
    agent.slug,
    getAccessToken,
    launchWrite.data,
    router,
    splitWrite.data,
    splitter,
    token,
  ]);
  useEffect(() => {
    if (!launchReceipt.isSuccess) return;
    const timer = window.setTimeout(() => void save(), 0);
    return () => window.clearTimeout(timer);
  }, [launchReceipt.isSuccess, save]);
  const stage = !quote
    ? "prepare"
    : !splitReceipt.isSuccess
      ? "splitter"
      : !launchReceipt.isSuccess
        ? "token"
        : "saving";
  const processPhase=busy?'preparing':splitWrite.isPending?'splitter-wallet':splitReceipt.isLoading?'splitter-confirming':launchWrite.isPending?'token-wallet':launchReceipt.isLoading?'token-confirming':finalizing?'saving':undefined;
  useEffect(()=>{
    if(!processPhase)return;
    const guard=(event:BeforeUnloadEvent)=>event.preventDefault();
    window.addEventListener('beforeunload',guard);
    return()=>window.removeEventListener('beforeunload',guard);
  },[processPhase]);
  return (
    <><div className="card p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan">
            Two-transaction launch
          </p>
          <h2 className="mt-2 text-2xl font-black">Launch ${agent.symbol}</h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-muted">
          {miner.status === "verified"
            ? "0xb07 ready ✓"
            : `Mining 0xb07 · ${miner.rate ? `${miner.rate.toLocaleString()}/s` : "starting"}`}
        </span>
      </div>
      <label className="mt-6 block">
        <span className="mb-2 block text-sm text-muted">
          Opening FDV target (USD)
        </span>
        <input
          className="input"
          value={targetFdv}
          type="number"
          min="100"
          max="10000000"
          onChange={(event) => setTargetFdv(event.target.value)}
        />
      </label>
      <div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/[.07] p-4">
        <div className="flex gap-3">
          <span aria-hidden="true" className="text-lg text-amber-200">
            ◈
          </span>
          <div>
            <p className="font-bold text-white">Creator-funded deployment</p>
            <p className="mt-1 text-sm leading-6 text-amber-100/80">
              You will pay Base network gas for two transactions. In return,
              the registered creator receives 30% of this agent token&apos;s
              trading fees.
            </p>
          </div>
        </div>
      </div>
      {splitter && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <p className="text-muted">Predicted fee splitter</p>
          <p className="mt-1 break-all font-bold text-cyan">{splitter}</p>
          <p className="mt-3 text-xs text-muted">
            This address becomes the on-chain token creator. It sends 30% of
            total trading fees to you and 40% to the agent wallet.
          </p>
        </div>
      )}
      {error && (
        <p className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {stage === "prepare" && (
          <button
            onClick={prepare}
            disabled={busy || miner.status !== "verified"}
            className="btn btn-primary sm:col-span-2 disabled:opacity-40"
          >
            {busy ? "Preparing metadata and quote…" : "Prepare agent launch"}
          </button>
        )}
        {stage === "splitter" && (
          <>
            <div className="rounded-xl border border-cyan/20 p-3 text-sm">
              <b>1 · Create fee splitter</b>
              <p className="mt-1 text-xs text-muted">
                One deterministic clone for this agent and token.
              </p>
            </div>
            <button
              disabled={
                !splitSim.data?.request ||
                splitWrite.isPending ||
                splitReceipt.isLoading
              }
              onClick={() =>
                splitSim.data?.request &&
                splitWrite.writeContract(splitSim.data.request)
              }
              className="btn btn-primary disabled:opacity-40"
            >
              {splitWrite.isPending
                ? "Open wallet…"
                : splitReceipt.isLoading
                  ? "Confirming splitter…"
                  : "Create splitter"}
            </button>
          </>
        )}
        {stage === "token" && (
          <>
            <div className="rounded-xl border border-cyan/20 p-3 text-sm">
              <b>2 · Create agent token</b>
              <p className="mt-1 text-xs text-muted">
                Deploy B20 and lock its VVV liquidity.
              </p>
            </div>
            <button
              disabled={
                !launchSim.data?.request ||
                launchWrite.isPending ||
                launchReceipt.isLoading
              }
              onClick={() =>
                launchSim.data?.request &&
                launchWrite.writeContract(launchSim.data.request)
              }
              className="btn btn-primary disabled:opacity-40"
            >
              {launchWrite.isPending
                ? "Open wallet…"
                : launchReceipt.isLoading
                  ? "Confirming token…"
                  : "Create agent token"}
            </button>
          </>
        )}
        {stage === "saving" && (
          error&&!finalizing?<button type="button" onClick={()=>void save()} className="btn btn-primary sm:col-span-2">Retry launch finalization</button>:<p className="sm:col-span-2 text-center text-cyan">Saving the verified launch to Liqpad…</p>
        )}
      </div>
      {(splitSim.error || launchSim.error) && (
        <p className="mt-4 text-xs text-red-200">
          Simulation: {(splitSim.error || launchSim.error)?.message}
        </p>
      )}
    </div>{processPhase&&<AgentProcessOverlay phase={processPhase}/>}</>
  );
}
