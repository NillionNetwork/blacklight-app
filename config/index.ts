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
// CONTRACT ADDRESSES
// ==============================================

// Contract addresses for each network
export const contracts = {
  nilavTestnet: {
    nilToken: '0x69AD6D3E17C99A3f66b5Ae410a5D1D4E14C7da35',
    nilTokenSymbol: 'NIL',
    nilTokenDecimals: 6,
    nilTokenStakeMin: 10,
    stakingOperators: '0x53a0Fc8d1917989E97baB9B3c35d8cD0B84074A6',
    heartbeatManager: '0x4aeF99b18A3B0A69C3CEa75185b4138C4d369050',
    rewardPolicy: '0xdAFAC1e26098DbeA553C23340509AeF1C44B196c',
    blockExplorer: 'https://explorer-nilav-shzvox09l5.t.conduit.xyz',
    // StakingOperators contract deployment block
    // This allows event queries to start from deployment instead of querying all history
    stakingOperatorsDeploymentBlock: 276878,
    heartbeatManagerDeploymentBlock: 2768782,
    rewardPolicyDeploymentBlock: 2768782,
    protocolConfig: '0x38345595fe5149A071C0CBeFbD8eb7e39E3cE428',
    weightedCommitteeSelector: '0xa38695EE8138C215C6D4a7E3998713947257955c',
    jailingPolicy: '0x6Dfe5Fd58842efD2eA11A28f33Df4c033Ee8DD77',
  },
  nilavMainnet: {
    nilToken: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
    nilTokenSymbol: 'NIL',
    nilTokenDecimals: 6,
    nilTokenStakeMin: 10,
    stakingOperators: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
    heartbeatManager: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
    rewardPolicy: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
    blockExplorer: 'https://explorer-nilav-mainnet.example.com', // TODO: Update with actual explorer URL
    stakingOperatorsDeploymentBlock: 0, // TODO: Update with actual deployment block
    rewardPolicyDeploymentBlock: 0, // TODO: Update with actual deployment block
  },
} as const;

// Active contracts based on environment variable
export const activeContracts = contracts[NETWORK_KEY];

// ==============================================
// PLATFORM CONFIGURATION
// ==============================================

// Helper function to generate docker run command with network-specific arguments
const getDockerRunCommand = () => {
  const rpcUrl = activeNetwork.rpcUrls.default.http[0];
  const managerAddress = activeContracts.heartbeatManager;
  const stakingAddress = activeContracts.stakingOperators;
  const tokenAddress = activeContracts.nilToken;

  return [
    'docker run -it --rm',
    '-v ./niluv_node:/app/',
    '-v ./niluv_node:/tmp/niluv-cache',
    'ghcr.io/nillionnetwork/niluv/niluv_node:latest',
    `--rpc-url ${rpcUrl}`,
    `--manager-contract-address ${managerAddress}`,
    `--staking-contract-address ${stakingAddress}`,
    `--token-contract-address ${tokenAddress}`,
  ].join(' ');
};

export const platforms = {
  mac: {
    name: 'Mac',
    displayName: 'macOS',
    dockerInstallCommand: 'brew install --cask docker',
    dockerInstallUrl: 'https://www.docker.com/products/docker-desktop',
    dockerPullCommand:
      'docker pull ghcr.io/nillionnetwork/niluv/niluv_node:latest',
    dockerRunCommand: getDockerRunCommand(),
    nodeStartCommand: './niluv_node',
  },
  linux: {
    name: 'Linux',
    displayName: 'Linux',
    dockerInstallCommand:
      'curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh',
    dockerPullCommand:
      'docker pull ghcr.io/nillionnetwork/niluv/niluv_node:latest',
    dockerRunCommand: getDockerRunCommand(),
    nodeStartCommand: './niluv_node',
  },
  windows: {
    name: 'Windows',
    displayName: 'Windows',
    dockerInstallUrl: 'https://www.docker.com/products/docker-desktop',
    dockerPullCommand:
      'docker pull ghcr.io/nillionnetwork/niluv/niluv_node:latest',
    dockerRunCommand: getDockerRunCommand(),
    nodeStartCommand: './niluv_node',
  },
} as const;

// ==============================================
// HELP & DOCUMENTATION
// ==============================================

export const helpLinks = {
  nilavHelp:
    'https://nillion.notion.site/NilAV-Help-2c41827799b48002b185fbe16ff567d5',
  discord: 'https://discord.com/invite/nillionnetwork',
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
