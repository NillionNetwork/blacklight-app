'use client';

import { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter, projectId, networks } from '@/config';

// Create React Query client
const queryClient = new QueryClient();

// Suppress UniversalProvider errors for custom networks (cosmetic only)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const errorString = args.join(' ');
  if (
    errorString.includes('getUniversalProvider') ||
    errorString.includes('Cannot create provider')
  ) {
    return; // Suppress known AppKit custom network errors
  }
  originalConsoleError.apply(console, args);
};

// Simple AppKit setup for custom network with injected wallets only
createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId as string,
  networks: networks as any, // Type assertion needed for custom networks
  defaultNetwork: networks[0],
  metadata: {
    name: 'NILAV',
    description: 'Nillion Verifier Node Manager',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://nilav.nillion.com',
    icons: ['https://nillion.com/favicon.ico'],
  },
  features: {
    analytics: false,
    swaps: false,
    onramp: false,
    email: false,
    socials: [],
  },
  allowUnsupportedChain: true,
  themeMode: 'dark',
  enableWalletConnect: false, // Disabled for custom network
  enableInjected: true, // MetaMask, Brave, etc.
  enableCoinbase: false,
});

// Restore console.error after init
setTimeout(() => {
  console.error = originalConsoleError;
}, 3000);

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
