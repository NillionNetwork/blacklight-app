// Application Configuration
// This file contains all network, platform, and contract configuration

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage } from "@wagmi/core";
import { type Chain, defineChain } from "viem";

// ==============================================
// AUTHENTICATION & NETWORK SETUP
// ==============================================

// Reown/WalletConnect Project ID
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "NEXT_PUBLIC_PROJECT_ID is not defined in environment variables",
  );
}

// Active network selection from environment
// Defaults to nilavTestnet if not specified
const NETWORK_KEYS = [
  "nilavTestnet",
  "nilavMainnet",
  "sepolia",
  "anvilL1",
] as const;
export type NetworkKey = (typeof NETWORK_KEYS)[number];

const NETWORK_KEY = (process.env.NEXT_PUBLIC_NETWORK ||
  "nilavTestnet") as NetworkKey;

if (!NETWORK_KEYS.includes(NETWORK_KEY)) {
  throw new Error(
    `Invalid NEXT_PUBLIC_NETWORK: ${NETWORK_KEY}. Must be one of: ${NETWORK_KEYS.join(", ")}`,
  );
}

// Shared token constants
const nilTokenDecimals = 6;
const dockerImageBase =
  "ghcr.io/nillionnetwork/blacklight-node/blacklight_node";
const dockerImageVersions = {
  nilavTestnet: "0.10.0",
  nilavMainnet: "0.10.0",
  sepolia: "0.10.0",
  anvilL1: "0.10.0",
} as const satisfies Record<NetworkKey, string>;
const dockerDataDir = "./blacklight_node";
const dockerCacheDir = "./blacklight_node";
const dockerCacheMountPath = "/tmp/blacklight-cache";
const fundMinEth = {
  nilavTestnet: 0.0001,
  nilavMainnet: 0.0001,
  // L1: votes cost real gas (~90k each); keep a working buffer
  sepolia: 0.02,
  anvilL1: 0.0001,
} as const satisfies Record<NetworkKey, number>;
const gasReserveEth = {
  nilavTestnet: 0.0001,
  nilavMainnet: 0.0001,
  sepolia: 0.01,
  anvilL1: 0.0001,
} as const satisfies Record<NetworkKey, number>;
const nilTokenStakeMin = {
  nilavTestnet: 70,
  nilavMainnet: 70000,
  // matches core.l1.json minOperatorStake (70000000000 raw at 6 decimals)
  sepolia: 70000,
  anvilL1: 10,
} as const satisfies Record<NetworkKey, number>;
const nilTokenStakePresets = {
  nilavTestnet: [nilTokenStakeMin.nilavTestnet, 1000, 5000],
  nilavMainnet: [nilTokenStakeMin.nilavMainnet, 100000, 200000],
  sepolia: [nilTokenStakeMin.sepolia, 100000, 200000],
  anvilL1: [nilTokenStakeMin.anvilL1, 100, 1000],
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
  name: "Nillion Network Sepolia Testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.nillion.network"],
      webSocket: ["wss://rpc.testnet.nillion.network"],
    },
    public: {
      http: ["https://rpc.testnet.nillion.network"],
      webSocket: ["wss://rpc.testnet.nillion.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Nillion Explorer",
      url: "https://explorer.testnet.nillion.network",
      apiUrl: "https://explorer.testnet.nillion.network/api",
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
  name: "Nillion Network",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.nillion.network"],
      webSocket: ["wss://rpc.nillion.network"],
    },
    public: {
      http: ["https://rpc.nillion.network"],
      webSocket: ["wss://rpc.nillion.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Nillion Explorer",
      url: "https://explorer.nillion.network",
      apiUrl: "https://explorer.nillion.network/api",
    },
  },
  contracts: {},
  testnet: false,
});

// Ethereum Sepolia (L1 port, Phase 1). RPC overridable for a dedicated key.
const sepoliaRpcHttp =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";
export const sepolia = defineChain({
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [sepoliaRpcHttp],
      webSocket: [sepoliaRpcHttp.replace("https://", "wss://")],
    },
    public: {
      http: [sepoliaRpcHttp],
      webSocket: [sepoliaRpcHttp.replace("https://", "wss://")],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
      apiUrl: "https://api-sepolia.etherscan.io/api",
    },
  },
  contracts: {},
  testnet: true,
});

// Local anvil devnet running the L1 configuration (devnet/run.sh in blacklight-node)
export const anvilL1 = defineChain({
  id: 31337,
  name: "Anvil L1 Devnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
      webSocket: ["ws://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
      webSocket: ["ws://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "Local",
      url: "http://127.0.0.1:8545",
      apiUrl: "http://127.0.0.1:8545",
    },
  },
  contracts: {},
  testnet: true,
});

// Map of all available networks
export const networkMap = {
  nilavTestnet,
  nilavMainnet,
  sepolia,
  anvilL1,
} as const satisfies Record<NetworkKey, Chain>;

const chainIdToNetworkKey: Record<number, NetworkKey> = {
  [nilavTestnet.id]: "nilavTestnet",
  [nilavMainnet.id]: "nilavMainnet",
  [sepolia.id]: "sepolia",
  [anvilL1.id]: "anvilL1",
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
    nilToken: "0x69AD6D3E17C99A3f66b5Ae410a5D1D4E14C7da35",
    nilTokenSymbol: "NIL",
    nilTokenDecimals,
    nilTokenStakePresets: nilTokenStakePresets.nilavTestnet,
    nilTokenStakeMin: nilTokenStakeMin.nilavTestnet,
    stakingOperators: "0x595A112FA10ED66Bc518b28781035BA50C9f2216",
    heartbeatManager: "0x8d683fb2CC794E085E8366c4f28f8CC991107576",
    rewardPolicy: "0xfD935474DCc8428eda1867E906E1005C5e717108",
    blockExplorer: nilavTestnet.blockExplorers.default.url,
    // StakingOperators contract deployment block
    // This allows event queries to start from deployment instead of querying all history
    stakingOperatorsDeploymentBlock: 2768782,
    rewardPolicyDeploymentBlock: 2768782,
    protocolConfig: "0xdd514DCF59767b4AaEf24CB5cbED81aD133660f0",
    weightedCommitteeSelector: "0x8aeC716fC0B8F998c0c897834409Be16d4302e34",
    jailingPolicy: "0x4a76Cb88D6FFb85cBe0ad28e7FFB3D51678e440d",
  },
  nilavMainnet: {
    nilToken: "0x32DEAe728473cb948B4D8661ac0f2755133D4173",
    nilTokenSymbol: "NIL",
    nilTokenDecimals,
    nilTokenStakePresets: nilTokenStakePresets.nilavMainnet,
    nilTokenStakeMin: nilTokenStakeMin.nilavMainnet,
    stakingOperators: "0x89c1312Cedb0B0F67e4913D2076bd4a860652B69",
    heartbeatManager: "0x0Ee49a8f50293Fa5d05Ba6d1FC136e7F79b2eA4f",
    rewardPolicy: "0x78E0FEBF3B8936f961729328a25dBA88d4Fea86B",
    blockExplorer: nilavMainnet.blockExplorers.default.url,
    stakingOperatorsDeploymentBlock: 1767042,
    rewardPolicyDeploymentBlock: 1767044,
    protocolConfig: "0x9204d2F933FC7A84b20952F72CA6Cfa5D4ce6520",
    weightedCommitteeSelector: "0x63167beD28912cDe2C7b8bC5B6BB1F8B41B22f46",
    jailingPolicy: "0x9a75E816941F692C23166eE9d61328544fb99490",
  },
  sepolia: {
    // Filled from the P1.M5 deployment's contract_addresses.env; env-overridable so
    // a redeploy doesn't need a code change. Zero-address placeholders until then.
    nilToken:
      process.env.NEXT_PUBLIC_SEPOLIA_NIL_TOKEN ||
      "0x0000000000000000000000000000000000000000",
    nilTokenSymbol: "TEST",
    nilTokenDecimals,
    nilTokenStakePresets: nilTokenStakePresets.sepolia,
    nilTokenStakeMin: nilTokenStakeMin.sepolia,
    stakingOperators:
      process.env.NEXT_PUBLIC_SEPOLIA_STAKING_OPERATORS ||
      "0x0000000000000000000000000000000000000000",
    heartbeatManager:
      process.env.NEXT_PUBLIC_SEPOLIA_HEARTBEAT_MANAGER ||
      "0x0000000000000000000000000000000000000000",
    rewardPolicy:
      process.env.NEXT_PUBLIC_SEPOLIA_REWARD_POLICY ||
      "0x0000000000000000000000000000000000000000",
    blockExplorer: sepolia.blockExplorers.default.url,
    stakingOperatorsDeploymentBlock: Number(
      process.env.NEXT_PUBLIC_SEPOLIA_DEPLOYMENT_BLOCK || 0,
    ),
    rewardPolicyDeploymentBlock: Number(
      process.env.NEXT_PUBLIC_SEPOLIA_DEPLOYMENT_BLOCK || 0,
    ),
    protocolConfig:
      process.env.NEXT_PUBLIC_SEPOLIA_PROTOCOL_CONFIG ||
      "0x0000000000000000000000000000000000000000",
    weightedCommitteeSelector:
      process.env.NEXT_PUBLIC_SEPOLIA_COMMITTEE_SELECTOR ||
      "0x0000000000000000000000000000000000000000",
    jailingPolicy:
      process.env.NEXT_PUBLIC_SEPOLIA_JAILING_POLICY ||
      "0x0000000000000000000000000000000000000000",
  },
  anvilL1: {
    // Deterministic addresses from devnet/run.sh (anvil account #0, fixed nonce order)
    nilToken: "0xFD471836031dc5108809D173A067e8486B9047A3",
    nilTokenSymbol: "TEST",
    nilTokenDecimals,
    nilTokenStakePresets: nilTokenStakePresets.anvilL1,
    nilTokenStakeMin: nilTokenStakeMin.anvilL1,
    stakingOperators: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    heartbeatManager: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    rewardPolicy: "0x1fA02b2d6A771842690194Cf62D91bdd92BfE28d",
    blockExplorer: anvilL1.blockExplorers.default.url,
    stakingOperatorsDeploymentBlock: 0,
    rewardPolicyDeploymentBlock: 0,
    protocolConfig: "0x922D6956C99E12DFeB3224DEA977D0939758A1Fe",
    weightedCommitteeSelector: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    jailingPolicy: "0x04C89607413713Ec9775E14b954286519d836FEf",
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

  const isL1 = NETWORK_KEY === "sepolia" || NETWORK_KEY === "anvilL1";
  return [
    "docker run -it --rm",
    "--name blacklight-node",
    `-v ${dockerDataDir}:/app/`,
    `-v ${dockerCacheDir}:${dockerCacheMountPath}`,
    `${dockerImageBase}:${imageVersion}`,
    `--rpc-url ${rpcUrl}`,
    `--manager-contract-address ${managerAddress}`,
    `--staking-contract-address ${stakingAddress}`,
    `--token-contract-address ${tokenAddress}`,
    // L1 (A3): real EIP-1559 fee handling with stuck-vote replacement
    ...(isL1 ? ["--fee-strategy eip1559"] : []),
  ].join(" ");
};

export const platforms = {
  mac: {
    name: "Mac",
    displayName: "macOS",
    dockerInstallCommand: "brew install --cask docker",
    dockerInstallUrl: "https://www.docker.com/products/docker-desktop",
    dockerPullCommand: `docker pull ${dockerImageBase}:${dockerImageVersions[NETWORK_KEY]}`,
    dockerRunCommand: getDockerRunCommand(),
    nodeStartCommand: "./blacklight_node",
  },
  linux: {
    name: "Linux",
    displayName: "Linux",
    dockerInstallCommand:
      "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh",
    dockerPullCommand: `docker pull ${dockerImageBase}:${dockerImageVersions[NETWORK_KEY]}`,
    dockerRunCommand: getDockerRunCommand(),
    nodeStartCommand: "./blacklight_node",
  },
  windows: {
    name: "Windows",
    displayName: "Windows",
    dockerInstallUrl: "https://www.docker.com/products/docker-desktop",
    dockerPullCommand: `docker pull ${dockerImageBase}:${dockerImageVersions[NETWORK_KEY]}`,
    dockerRunCommand: getDockerRunCommand(),
    nodeStartCommand: "./blacklight_node",
  },
} as const;

// ==============================================
// HELP & DOCUMENTATION
// ==============================================

export const helpLinks = {
  nilavHelp: "https://docs.nillion.com/blacklight/run-node/prerequisites",
  discord: "https://discord.com/invite/nillionnetwork",
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
    `Unsupported network ID: ${networkId}. Supported: ${Object.values(
      networkMap,
    )
      .map((n) => n.id)
      .join(", ")}`,
  );
};

// ==============================================
// INDEXER CONFIGURATION
// ==============================================

// Indexer configuration for active network
// Note: API key is stored server-side only (not exposed to clients)
// Client components use Server Actions from lib/indexer/actions.ts
// mode 'conduit': the Nillion L2's hosted Conduit indexer (SQL over logs).
// mode 'rpc': L1 networks without an indexer answer the same queries via
// eth_getLogs (lib/indexer/rpc.ts); deploymentBlock floors unbounded scans.
const INDEXER_MODES = {
  nilavTestnet: "conduit",
  nilavMainnet: "conduit",
  sepolia: "rpc",
  anvilL1: "rpc",
} as const satisfies Record<NetworkKey, "conduit" | "rpc">;

export const indexer = {
  chainId: activeNetwork.id,
  mode: INDEXER_MODES[NETWORK_KEY],
  deploymentBlock: activeContracts.stakingOperatorsDeploymentBlock,
} as const;

// ==============================================
// TYPE EXPORTS
// ==============================================

export type Platform = keyof typeof platforms;
export type ContractConfig = typeof activeContracts;
