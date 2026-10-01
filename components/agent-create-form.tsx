"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { ImageUpload } from "@/components/image-upload";
import { normalizeAgentSlug } from "@/lib/agents";

type Form = {
  name: string;
  slug: string;
  symbol: string;
  avatarUrl: string;
  description: string;
  mission: string;
  personality: string;
  communicationStyle: string;
  website: string;
  twitter: string;
};
const blank: Form = {
  name: "",
  slug: "",
  symbol: "",
  avatarUrl: "",
  description: "",
  mission: "",
  personality: "",
  communicationStyle: "",
  website: "",
  twitter: "",
};

export function AgentCreateForm() {
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const update = (key: keyof Form, value: string) =>
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" && !current.slug
        ? { slug: normalizeAgentSlug(value) }
        : {}),
    }));
  const field = (
    key: keyof Form,
    label: string,
    placeholder: string,
    area = false,
  ) => {
    const Input = area ? "textarea" : "input";
    return (
      <label className="block">
        <span className="mb-2 block text-sm text-muted">{label}</span>
        <Input
          className="input"
          value={form[key]}
          placeholder={placeholder}
          onChange={(event) => update(key, event.target.value)}
        />
      </label>
    );
  };
  async function create() {
    if (!authenticated) {
      login();
      return;
    }
    if (!address)
      return setError(
        "Connect the wallet that will receive the human creator share.",
      );
    setBusy(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Your Privy session expired. Sign in again.");
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, humanCreator: address }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Agent creation failed.");
      router.push(`/agents/${result.agent.slug}/launch`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Agent creation failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  const complete =
    form.name.trim().length >= 2 &&
    form.symbol.trim().length >= 2 &&
    form.avatarUrl &&
    form.description.trim().length >= 10 &&
    form.mission.trim().length >= 10 &&
    form.personality.trim().length >= 10;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <fieldset
        disabled={busy}
        className="card space-y-6 p-5 disabled:opacity-60 md:p-8"
      >
        <div>
          <h2 className="font-display text-2xl font-black">Agent identity</h2>
          <p className="mt-2 text-sm text-muted">
            The public profile and token metadata share one canonical identity.
          </p>
        </div>
        {field("name", "Agent name", "Neon Oracle")}
        {field("slug", "Profile slug", "neon-oracle")}
        {field("symbol", "Token symbol", "ORACLE")}
        <ImageUpload
          value={form.avatarUrl}
          symbol={form.symbol}
          onChange={(value) => update("avatarUrl", value)}
        />
        {field(
          "description",
          "Public description",
          "What does this agent do?",
          true,
        )}
        {field(
          "mission",
          "Mission",
          "What outcome is the agent working toward?",
          true,
        )}
        {field(
          "personality",
          "Personality",
          "How should the agent think and behave?",
          true,
        )}
        {field(
          "communicationStyle",
          "Communication style",
          "Concise, technical, direct…",
          true,
        )}
        <details className="rounded-2xl border border-white/10 p-4">
          <summary className="cursor-pointer font-bold">
            Links <span className="font-normal text-muted">(optional)</span>
          </summary>
          <div className="mt-5 space-y-5">
            {field("website", "Website", "https://liqpad.com")}
            {field("twitter", "X handle or URL", "@agent")}
          </div>
        </details>
        <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[.07] p-4 text-sm leading-6 text-amber-100/80">
          <strong className="block text-white">Gas is paid by the creator.</strong>
          You will pay Base network gas for two transactions. In return, the
          registered creator receives 30% of this agent token&apos;s trading
          fees. Liqpad does not sponsor agent deployment gas.
        </div>
        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={create}
          disabled={!ready || busy || !complete || (!authenticated && !ready)}
          className="btn btn-primary w-full disabled:opacity-40"
        >
          {busy
            ? "Creating secure agent wallet…"
            : !authenticated
              ? "Sign in with Privy"
              : !isConnected
                ? "Connect creator wallet first"
                : "Create agent wallet"}
        </button>
      </fieldset>
      <aside className="card sticky top-24 overflow-hidden p-5">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan">
          Fee ownership
        </p>
        <h2 className="mt-3 text-2xl font-black">
          Every trade funds two creators.
        </h2>
        <div className="mt-6 space-y-3">
          {[
            ["Human creator", "30%", "Claimed by your connected wallet"],
            ["Agent treasury", "40%", "Sent to the embedded agent wallet"],
            [
              "Liqpad protocol",
              "30%",
              "Flows through the existing protocol engine",
            ],
          ].map(([name, value, note]) => (
            <div
              key={name}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex justify-between gap-3">
                <b>{name}</b>
                <strong className="text-cyan">{value}</strong>
              </div>
              <p className="mt-1 text-xs text-muted">{note}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs leading-5 text-muted">
          Registration creates the agent identity and Privy wallet. Token launch
          will use the deterministic on-chain splitter as its creator address.
        </p>
      </aside>
    </div>
  );
}
