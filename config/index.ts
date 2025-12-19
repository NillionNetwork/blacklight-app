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

// Active network selection from environment
// Defaults to nilavTestnet if not specified
const NETWORK_KEY = (process.env.NEXT_PUBLIC_NETWORK || 'nilavTestnet') as
  | 'nilavTestnet'
  | 'nilavMainnet';

if (!['nilavTestnet', 'nilavMainnet'].includes(NETWORK_KEY)) {
  throw new Error(
    `Invalid NEXT_PUBLIC_NETWORK: ${NETWORK_KEY}. Must be 'nilavTestnet' or 'nilavMainnet'`
  );
}

// ==============================================
// NETWORK DEFINITIONS
// ==============================================

// Define Blacklight Testnet
export const nilavTestnet = defineChain({
  id: 78651,
  name: 'Blacklight Testnet',
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
      name: 'Blacklight Explorer',
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

// Define Blacklight Mainnet
export const nilavMainnet = defineChain({
  id: 0, // TODO: Update when mainnet chain ID is known
  name: 'Blacklight Mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-nilav-mainnet.example.com'], // TODO: Update with actual RPC URL
      webSocket: ['wss://rpc-nilav-mainnet.example.com'], // TODO: Update with actual WebSocket URL
    },
    public: {
      http: ['https://rpc-nilav-mainnet.example.com'],
      webSocket: ['wss://rpc-nilav-mainnet.example.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blacklight Explorer',
      url: 'https://explorer-nilav-mainnet.example.com', // TODO: Update with actual explorer URL
      apiUrl: 'https://explorer-nilav-mainnet.example.com/api',
    },
  },
  contracts: {},
  testnet: false,
});

// Map of all available networks
export const networkMap = {
  nilavTestnet,
  nilavMainnet,
} as const;

// Active network based on environment variable
export const activeNetwork = networkMap[NETWORK_KEY];

// Network array for AppKit (only includes active network)
export const networks = [activeNetwork];

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
// PLATFORM CONFIGURATION
// ==============================================

export const platforms = {
  mac: {
    name: 'Mac',
    displayName: 'macOS',
    dockerInstallCommand: 'brew install --cask docker',
    dockerInstallUrl: 'https://www.docker.com/products/docker-desktop',
    dockerPullCommand:
      'docker pull ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    dockerRunCommand:
      'docker run -it --rm -v ./nilav_node:/app/ ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    nodeStartCommand: './nilav_node',
  },
  linux: {
    name: 'Linux',
    displayName: 'Linux',
    dockerInstallCommand:
      'curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh',
    dockerPullCommand:
      'docker pull ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    dockerRunCommand:
      'docker run -it --rm -v ./nilav_node:/app/ ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    nodeStartCommand: './nilav_node',
  },
  windows: {
    name: 'Windows',
    displayName: 'Windows',
    dockerInstallUrl: 'https://www.docker.com/products/docker-desktop',
    dockerPullCommand:
      'docker pull ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    dockerRunCommand:
      'docker run -it --rm -v ./nilav_node:/app/ ghcr.io/nillionnetwork/nilav/nilav_node:latest',
    nodeStartCommand: './nilav_node',
  },
} as const;

// ==============================================
// CONTRACT ADDRESSES
// ==============================================

// Contract addresses for each network
export const contracts = {
  nilavTestnet: {
    nilToken: '0xf65b7cCF9f13ef932093bac19Eb5ea77ee70F4A4',
    nilTokenSymbol: 'NIL',
    nilTokenDecimals: 6,
    stakingOperators: '0x2913f0A4C1BE4e991CCf76F04C795E5646e02049',
    nilavRouter: '0x34ED5BCD598619f7Aad6e3d9264C38CEb4Cd1edF',
    blockExplorer: 'https://explorer-nilav-shzvox09l5.t.conduit.xyz',
    // StakingOperators contract deployment block
    // This allows event queries to start from deployment instead of querying all history
    stakingOperatorsDeploymentBlock: 700000,
  },
  nilavMainnet: {
    nilToken: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
    nilTokenSymbol: 'NIL',
    nilTokenDecimals: 6,
    stakingOperators: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
    nilavRouter: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
    blockExplorer: 'https://explorer-nilav-mainnet.example.com', // TODO: Update with actual explorer URL
    stakingOperatorsDeploymentBlock: 0, // TODO: Update with actual deployment block
  },
} as const;

// Active contracts based on environment variable
export const activeContracts = contracts[NETWORK_KEY];

// ==============================================
// HELP & DOCUMENTATION
// ==============================================

export const helpLinks = {
  nilavHelp:
    'https://nillion.notion.site/NilAV-Help-2c41827799b48002b185fbe16ff567d5',
  discord: 'https://discord.gg/nillion',
} as const;

// ==============================================
// UTILITIES
// ==============================================

// Default network (for backwards compatibility)
export const defaultNetwork = activeNetwork;

// Get contract addresses for a specific network ID
// Useful for components that receive chainId from wagmi hooks
export const getContractAddresses = (networkId: number) => {
  if (networkId === nilavTestnet.id) {
    return contracts.nilavTestnet;
  }
  if (networkId === nilavMainnet.id) {
    return contracts.nilavMainnet;
  }
  throw new Error(
    `Unsupported network ID: ${networkId}. Supported: ${nilavTestnet.id}, ${nilavMainnet.id}`
  );
};

// ==============================================
// INDEXER CONFIGURATION
// ==============================================

// Indexer configuration for active network
// Note: API key is stored server-side only (not exposed to clients)
// Client components use Server Actions from lib/indexer/actions.ts
export const indexer = {
  chainId: activeNetwork.id,
} as const;

// ==============================================
// TYPE EXPORTS
// ==============================================

export type Platform = keyof typeof platforms;
export type NetworkKey = keyof typeof networkMap;
export type ContractConfig = typeof activeContracts;
