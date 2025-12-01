'use client';

import { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReownAuthentication } from '@reown/appkit-siwx';
import { wagmiAdapter, projectId, networks } from '@/config';

// Create React Query client
const queryClient = new QueryClient();

// Create AppKit with SIWX (ReownAuthentication)
createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId as string,
  networks: networks as [(typeof networks)[0], ...typeof networks],
  siwx: new ReownAuthentication({
    required: true, // Force signature on wallet connect
  }),
  defaultNetwork: networks[0], // Base Sepolia as default
  metadata: {
    name: 'NILAV',
    description: 'Nillion Verifier Node Manager',
    url:
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://nilav.nillion.com',
    icons: ['https://nillion.com/favicon.ico'],
  },
  features: {
    analytics: false, // Disable analytics for privacy
    allWallets: true, // Show all wallet options
    swaps: false, // Disable swaps feature
    onramp: false, // Disable onramp feature
  },
  allowUnsupportedChain: false, // Force users to be on supported chains
  themeMode: 'dark',
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
