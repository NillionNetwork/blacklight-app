// Application Configuration
// This file contains all network, platform, and contract configuration

import { defineChain, type Chain } from 'viem';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { cookieStorage, createStorage } from '@wagmi/core';

// ==============================================
// AUTHENTICATION & NETWORK SETUP
// ==============================================

// Reown/WalletConnect Project ID
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error(
    'NEXT_PUBLIC_PROJECT_ID is not defined in environment variables',
  );
}

// Active network selection from environment
// Defaults to nilavTestnet if not specified
const NETWORK_KEYS = ['nilavTestnet', 'nilavMainnet'] as const;
export type NetworkKey = (typeof NETWORK_KEYS)[number];

const NETWORK_KEY = (process.env.NEXT_PUBLIC_NETWORK ||
  'nilavTestnet') as NetworkKey;

if (!NETWORK_KEYS.includes(NETWORK_KEY)) {
  throw new Error(
    `Invalid NEXT_PUBLIC_NETWORK: ${NETWORK_KEY}. Must be 'nilavTestnet' or 'nilavMainnet'`,
  );
}

// Shared token constants
const nilTokenDecimals = 6;
const dockerImageBase =
  'ghcr.io/nillionnetwork/blacklight-node/blacklight_node';
const dockerImageVersions = {
  nilavTestnet: '0.9.0',
  nilavMainnet: '0.9.0',
} as const satisfies Record<NetworkKey, string>;
const dockerDataDir = './blacklight_node';
const dockerCacheDir = './blacklight_node';
const dockerCacheMountPath = '/tmp/blacklight-cache';
const fundMinEth = {
  nilavTestnet: 0.0001,
  nilavMainnet: 0.0001,
} as const satisfies Record<NetworkKey, number>;
const gasReserveEth = {
  nilavTestnet: 0.0001,
  nilavMainnet: 0.0001,
} as const satisfies Record<NetworkKey, number>;
const nilTokenStakeMin = {
  nilavTestnet: 70,
  nilavMainnet: 70000,
} as const satisfies Record<NetworkKey, number>;
const nilTokenStakePresets = {
  nilavTestnet: [nilTokenStakeMin.nilavTestnet, 1000, 5000],
  nilavMainnet: [nilTokenStakeMin.nilavMainnet, 100000, 200000],
} as const satisfies Record<NetworkKey, readonly number[]>;

const assertMinInPresets = (
  network: NetworkKey,
  min: number,
  presets: readonly number[],
) => {
  if (!presets.includes(min)) {
    throw new Error(
      `nilTokenStakePresets for ${network} must include nilTokenStakeMin (${min})`,
    );
  }
};

// ==============================================
// NETWORK DEFINITIONS
// ==============================================

export const nilavTestnet = defineChain({
  id: 78651,
  name: 'Nillion Network Sepolia Testnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.nillion.network'],
      webSocket: ['wss://rpc.testnet.nillion.network'],
    },
    public: {
      http: ['https://rpc.testnet.nillion.network'],
      webSocket: ['wss://rpc.testnet.nillion.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Nillion Explorer',
      url: 'https://explorer.testnet.nillion.network',
      apiUrl: 'https://explorer.testnet.nillion.network/api',
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

export const nilavMainnet = defineChain({
  id: 98875,
  name: 'Nillion Network',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.nillion.network'],
      webSocket: ['wss://rpc.nillion.network'],
    },
    public: {
      http: ['https://rpc.nillion.network'],
      webSocket: ['wss://rpc.nillion.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Nillion Explorer',
      url: 'https://explorer.nillion.network',
      apiUrl: 'https://explorer.nillion.network/api',
    },
  },
  contracts: {},
  testnet: false,
});

// Map of all available networks
export const networkMap = {
  nilavTestnet,
  nilavMainnet,
} as const satisfies Record<NetworkKey, Chain>;

const chainIdToNetworkKey: Record<number, NetworkKey> = {
  [nilavTestnet.id]: 'nilavTestnet',
  [nilavMainnet.id]: 'nilavMainnet',
};

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

type ContractEntry = {
  nilToken: string;
  nilTokenSymbol: string;
  nilTokenDecimals: number;
  nilTokenStakeMin: number;
  nilTokenStakePresets: readonly number[];
  stakingOperators: string;
  heartbeatManager: string;
  rewardPolicy: string;
  blockExplorer: string;
  stakingOperatorsDeploymentBlock: number;
  rewardPolicyDeploymentBlock: number;
  protocolConfig: string;
  weightedCommitteeSelector: string;
  jailingPolicy: string;
};

// Contract addresses for each network
export const contracts = {
  nilavTestnet: {
    nilToken: '0x69AD6D3E17C99A3f66b5Ae410a5D1D4E14C7da35',
    nilTokenSymbol: 'NIL',
    nilTokenDecimals,
    nilTokenStakePresets: nilTokenStakePresets.nilavTestnet,
    nilTokenStakeMin: nilTokenStakeMin.nilavTestnet,
    stakingOperators: '0x595A112FA10ED66Bc518b28781035BA50C9f2216',
    heartbeatManager: '0x8d683fb2CC794E085E8366c4f28f8CC991107576',
    rewardPolicy: '0xfD935474DCc8428eda1867E906E1005C5e717108',
    blockExplorer: nilavTestnet.blockExplorers.default.url,
    // StakingOperators contract deployment block
    // This allows event queries to start from deployment instead of querying all history
    stakingOperatorsDeploymentBlock: 2768782,
    rewardPolicyDeploymentBlock: 2768782,
    protocolConfig: '0xdd514DCF59767b4AaEf24CB5cbED81aD133660f0',
    weightedCommitteeSelector: '0x8aeC716fC0B8F998c0c897834409Be16d4302e34',
    jailingPolicy: '0x4a76Cb88D6FFb85cBe0ad28e7FFB3D51678e440d',
  },
  nilavMainnet: {
    nilToken: '0x32DEAe728473cb948B4D8661ac0f2755133D4173',
    nilTokenSymbol: 'NIL',
    nilTokenDecimals,
    nilTokenStakePresets: nilTokenStakePresets.nilavMainnet,
    nilTokenStakeMin: nilTokenStakeMin.nilavMainnet,
    stakingOperators: '0x89c1312Cedb0B0F67e4913D2076bd4a860652B69',
    heartbeatManager: '0x0Ee49a8f50293Fa5d05Ba6d1FC136e7F79b2eA4f',
    rewardPolicy: '0x78E0FEBF3B8936f961729328a25dBA88d4Fea86B',
    blockExplorer: nilavMainnet.blockExplorers.default.url,
    stakingOperatorsDeploymentBlock: 1767042,
    rewardPolicyDeploymentBlock: 1767044,
    protocolConfig: '0x9204d2F933FC7A84b20952F72CA6Cfa5D4ce6520',
    weightedCommitteeSelector: '0x63167beD28912cDe2C7b8bC5B6BB1F8B41B22f46',
    jailingPolicy: '0x9a75E816941F692C23166eE9d61328544fb99490',
  },
} as const satisfies Record<NetworkKey, ContractEntry>;

// Active contracts based on environment variable
export const activeContracts = contracts[NETWORK_KEY];

// Validate stake config consistency at startup
assertMinInPresets(
  NETWORK_KEY,
  activeContracts.nilTokenStakeMin,
  activeContracts.nilTokenStakePresets,
);

// ==============================================
// PLATFORM CONFIGURATION
// ==============================================

// Helper function to generate docker run command with network-specific arguments
const getDockerRunCommand = () => {
  const rpcUrl = activeNetwork.rpcUrls.default.http[0];
  const managerAddress = activeContracts.heartbeatManager;
  const stakingAddress = activeContracts.stakingOperators;
  const tokenAddress = activeContracts.nilToken;
  const imageVersion = dockerImageVersions[NETWORK_KEY];

  return [
    'docker run -it --rm',
    '--name blacklight-node',
    `-v ${dockerDataDir}:/app/`,
    `-v ${dockerCacheDir}:${dockerCacheMountPath}`,
    `${dockerImageBase}:${imageVersion}`,
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
    dockerPullCommand: `docker pull ${dockerImageBase}:${dockerImageVersions[NETWORK_KEY]}`,
    dockerRunCommand: getDockerRunCommand(),
    nodeStartCommand: './blacklight_node',
  },
  linux: {
    name: 'Linux',
    displayName: 'Linux',
    dockerInstallCommand:
      'curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh',
    dockerPullCommand: `docker pull ${dockerImageBase}:${dockerImageVersions[NETWORK_KEY]}`,
    dockerRunCommand: getDockerRunCommand(),
    nodeStartCommand: './blacklight_node',
  },
  windows: {
    name: 'Windows',
    displayName: 'Windows',
    dockerInstallUrl: 'https://www.docker.com/products/docker-desktop',
    dockerPullCommand: `docker pull ${dockerImageBase}:${dockerImageVersions[NETWORK_KEY]}`,
    dockerRunCommand: getDockerRunCommand(),
    nodeStartCommand: './blacklight_node',
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
export const activeFundMinEth = fundMinEth[NETWORK_KEY];
export const activeGasReserveEth = gasReserveEth[NETWORK_KEY];

// Get contract addresses for a specific network ID
// Useful for components that receive chainId from wagmi hooks
export const getContractAddresses = (networkId: number) => {
  const key = chainIdToNetworkKey[networkId];
  if (key) {
    return contracts[key];
  }
  throw new Error(
    `Unsupported network ID: ${networkId}. Supported: ${nilavTestnet.id}, ${nilavMainnet.id}`,
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
export type ContractConfig = typeof activeContracts;
