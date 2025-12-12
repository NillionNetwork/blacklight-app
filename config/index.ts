// Application Configuration
// This file contains all network, platform, and contract configuration

import { defineChain } from 'viem';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { cookieStorage, createStorage } from '@wagmi/core';

// ==============================================
// AUTHENTICATION & NETWORK SETUP
// ==============================================

// Reown/WalletConnect Project ID
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error(
    'NEXT_PUBLIC_PROJECT_ID is not defined in environment variables'
  );
}

// Define Nilav (testnet)
export const nilavTestnet = defineChain({
  id: 78651,
  name: 'Nilav Testnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-nilav-shzvox09l5.t.conduit.xyz'],
      webSocket: ['wss://rpc-nilav-shzvox09l5.t.conduit.xyz'],
    },
    public: {
      http: ['https://rpc-nilav-shzvox09l5.t.conduit.xyz'],
      webSocket: ['wss://rpc-nilav-shzvox09l5.t.conduit.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Nilav Explorer',
      url: 'https://explorer-nilav-shzvox09l5.t.conduit.xyz',
      apiUrl: 'https://explorer-nilav-shzvox09l5.t.conduit.xyz/api',
    },
  },
  contracts: {
    // Add multicall3 if available on the network
    // multicall3: {
    //   address: '0x...',
    //   blockCreated: 0,
    // },
  },
  testnet: true,
});

// Network array for AppKit
export const networks = [nilavTestnet];

// Wagmi Adapter configuration
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

// Export wagmi config for use in providers
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// ==============================================
// LEGACY NETWORK CONFIG (for reference/utilities)
// ==============================================

export const networkInfo = {
  nilavTestnet: {
    id: 78651,
    name: 'Nilav Testnet',
    rpcUrl: 'https://rpc-nilav-shzvox09l5.t.conduit.xyz',
    blockExplorer: 'https://explorer-nilav-shzvox09l5.t.conduit.xyz',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;

export const platforms = {
  mac: {
    name: 'Mac',
    displayName: 'macOS',
    dockerInstallCommand: 'brew install --cask docker',
    dockerInstallUrl: 'https://www.docker.com/products/docker-desktop',
    dockerPullCommand: 'docker pull ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    dockerRunCommand: 'docker run -it --rm -v ./nilav_node:/app/ ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    nodeStartCommand: './nilav_node',
  },
  linux: {
    name: 'Linux',
    displayName: 'Linux',
    dockerInstallCommand: 'curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh',
    dockerPullCommand: 'docker pull ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    dockerRunCommand: 'docker run -it --rm -v ./nilav_node:/app/ ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    nodeStartCommand: './nilav_node',
  },
  windows: {
    name: 'Windows',
    displayName: 'Windows',
    dockerInstallUrl: 'https://www.docker.com/products/docker-desktop',
    dockerPullCommand: 'docker pull ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    dockerRunCommand: 'docker run -it --rm -v ./nilav_node:/app/ ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    nodeStartCommand: './nilav_node',
  },
} as const;

// Contract addresses
export const contracts = {
  nilavTestnet: {
    nilToken: '0x89c1312Cedb0B0F67e4913D2076bd4a860652B69',
    nilTokenSymbol: 'NIL',
    stakingOperators: '0x63167beD28912cDe2C7b8bC5B6BB1F8B41B22f46',
    nilavRouter: '0x34ED5BCD598619f7Aad6e3d9264C38CEb4Cd1edF',
    blockExplorer: 'https://explorer-nilav-shzvox09l5.t.conduit.xyz',
    // StakingOperators contract deployment block
    // This allows event queries to start from deployment instead of querying all history
    stakingOperatorsDeploymentBlock: 700000,
  },
} as const;

// Help and documentation links
export const helpLinks = {
  nilavHelp: 'https://nillion.notion.site/NilAV-Help-2c41827799b48002b185fbe16ff567d5',
  discord: 'https://discord.gg/nillion',
} as const;

// Default network - use testnet for development
export const defaultNetwork = nilavTestnet;

// Get contract addresses for current network
export const getContractAddresses = (networkId: number) => {
  if (networkId === nilavTestnet.id) {
    return contracts.nilavTestnet;
  }
  throw new Error(`Unsupported network: ${networkId}`);
};

// Indexer configuration
export const indexer = {
  apiUrl: 'https://indexing.conduit.xyz/v2/query',
  apiKey: process.env.NEXT_PUBLIC_INDEXER_API_KEY || '',
  chainId: nilavTestnet.id,
} as const;

if (!indexer.apiKey) {
  console.warn(
    'NEXT_PUBLIC_INDEXER_API_KEY is not defined - indexer queries will fail'
  );
}

// Type exports
export type Platform = keyof typeof platforms;
export type NetworkName = keyof typeof networks;
