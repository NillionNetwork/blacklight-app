// Application Configuration
// This file contains all network, platform, and contract configuration

import { defineChain } from 'viem'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { cookieStorage, createStorage } from '@wagmi/core'

// ==============================================
// AUTHENTICATION & NETWORK SETUP
// ==============================================

// Reown/WalletConnect Project ID
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined in environment variables')
}

// Define Base Sepolia (testnet)
export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
  testnet: true,
})

// Define Base (mainnet)
export const base = defineChain({
  id: 8453,
  name: 'Base',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  },
})

// Network array for AppKit
export const networks = [baseSepolia, base]

// Wagmi Adapter configuration
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
})

// Export wagmi config for use in providers
export const wagmiConfig = wagmiAdapter.wagmiConfig

// ==============================================
// LEGACY NETWORK CONFIG (for reference/utilities)
// ==============================================

export const networkInfo = {
  baseTestnet: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  baseMainnet: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
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

// Contract addresses - PLACEHOLDERS - will be updated by smart contract dev
export const contracts = {
  baseTestnet: {
    verifierRegistry: '0x0000000000000000000000000000000000000000', // TODO: Update when contract deployed
  },
  baseMainnet: {
    verifierRegistry: '0x0000000000000000000000000000000000000000', // TODO: Update when contract deployed
  },
} as const;

// Default network - use testnet for development
export const defaultNetwork =
  process.env.NODE_ENV === 'production'
    ? base
    : baseSepolia;

// Get contract address for current network
export const getContractAddress = (networkId: number): string => {
  if (networkId === baseSepolia.id) {
    return contracts.baseTestnet.verifierRegistry;
  }
  if (networkId === base.id) {
    return contracts.baseMainnet.verifierRegistry;
  }
  throw new Error(`Unsupported network: ${networkId}`);
};

// Type exports
export type Platform = keyof typeof platforms;
export type NetworkName = keyof typeof networks;
