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
    binaryName: 'nil-av-node-mac',
    downloadUrl: 'https://releases.nillion.com/nil-av-node-mac', // TODO: Update with actual URL
    command: './nil-av-node-mac generate-keys',
  },
  linux: {
    name: 'Linux',
    displayName: 'Linux',
    binaryName: 'nil-av-node-linux',
    downloadUrl: 'https://releases.nillion.com/nil-av-node-linux', // TODO: Update with actual URL
    command: './nil-av-node-linux generate-keys',
  },
  windows: {
    name: 'Windows',
    displayName: 'Windows',
    binaryName: 'nil-av-node-windows.exe',
    downloadUrl: 'https://releases.nillion.com/nil-av-node-windows.exe', // TODO: Update with actual URL
    command: '.\\nil-av-node-windows.exe generate-keys',
  },
} as const;

// Contract addresses
export const contracts = {
  nilavTestnet: {
    testToken: '0x89c1312Cedb0B0F67e4913D2076bd4a860652B69',
    stakingOperators: '0x63167beD28912cDe2C7b8bC5B6BB1F8B41B22f46',
  },
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

// Type exports
export type Platform = keyof typeof platforms;
export type NetworkName = keyof typeof networks;
