'use client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { chain, rpcUrl } from '@/lib/chain';
import { base } from 'wagmi/chains';
import {PrivyAgentProvider} from '@/components/privy-agent-provider';

const wcId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const connectors = [injected({ shimDisconnect: true }), ...(typeof window !== 'undefined' && wcId ? [walletConnect({ projectId: wcId, metadata: { name: 'Liqpad', description: 'B20 launches on Base', url: 'https://liqpad.com', icons: ['https://liqpad.com/icon.png'] } })] : [])];
const config = createConfig({ chains: [chain], connectors, transports: { [base.id]: http(rpcUrl) }, ssr: true });

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <PrivyAgentProvider><WagmiProvider config={config}><QueryClientProvider client={client}><RainbowKitProvider>{children}</RainbowKitProvider></QueryClientProvider></WagmiProvider></PrivyAgentProvider>;
}
