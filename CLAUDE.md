# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**nilav-ui** is the Next.js 15 web application for managing NilAV verification nodes. Users stake tokens to operators, monitor node activity, and track heartbeat verifications on the Blacklight Network (custom EVM chain).

---

## Quick Start

```bash
npm install
npm run dev          # Runs on http://localhost:4269
npm run build        # Production build
npm run lint         # Biome linting
npm run format       # Biome formatting
```

### Environment Setup

```bash
cp .env.example .env.local
```

Required variables:
```bash
NEXT_PUBLIC_PROJECT_ID=          # Reown/WalletConnect project ID
NEXT_PUBLIC_NETWORK=nilavTestnet # Network selection (nilavTestnet | nilavMainnet)
INDEXER_API_KEY=                 # Conduit Indexer API key (server-side only)
```

---

## Web3 Architecture

### Network Configuration (`config/index.ts`)

All blockchain configuration is centralized in `config/index.ts`.

#### Defining Networks

Networks are defined using viem's `defineChain`:

```typescript
import { defineChain } from 'viem';

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
  },
  blockExplorers: {
    default: {
      name: 'Blacklight Explorer',
      url: 'https://explorer-nilav-shzvox09l5.t.conduit.xyz',
    },
  },
  testnet: true,
});
```

#### Adding a New Chain

1. **Define the chain** in `config/index.ts`:

```typescript
export const myNewChain = defineChain({
  id: 12345,
  name: 'My New Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mychain.com'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.mychain.com' },
  },
  testnet: false,
});
```

2. **Add to network map**:

```typescript
export const networkMap = {
  nilavTestnet,
  nilavMainnet,
  myNewChain,  // Add here
} as const;
```

3. **Add contract addresses** for the new chain:

```typescript
export const contracts = {
  nilavTestnet: { /* ... */ },
  nilavMainnet: { /* ... */ },
  myNewChain: {
    nilToken: '0x...',
    stakingOperators: '0x...',
    heartbeatManager: '0x...',
    blockExplorer: 'https://explorer.mychain.com',
    stakingOperatorsDeploymentBlock: 0,
  },
} as const;
```

4. **Update NEXT_PUBLIC_NETWORK validation**:

```typescript
const NETWORK_KEY = (process.env.NEXT_PUBLIC_NETWORK || 'nilavTestnet') as
  | 'nilavTestnet'
  | 'nilavMainnet'
  | 'myNewChain';  // Add here

if (!['nilavTestnet', 'nilavMainnet', 'myNewChain'].includes(NETWORK_KEY)) {
  throw new Error(`Invalid NEXT_PUBLIC_NETWORK: ${NETWORK_KEY}`);
}
```

5. **Set in environment**:

```bash
NEXT_PUBLIC_NETWORK=myNewChain
```

#### Switching Chains

Change the `NEXT_PUBLIC_NETWORK` environment variable:

```bash
# .env.local
NEXT_PUBLIC_NETWORK=nilavTestnet  # Use testnet
# or
NEXT_PUBLIC_NETWORK=nilavMainnet  # Use mainnet
```

**Active network and contracts are auto-selected:**

```typescript
import { activeNetwork, activeContracts } from '@/config';

// These automatically match NEXT_PUBLIC_NETWORK
activeNetwork.id                    // Current chain ID
activeNetwork.rpcUrls               // Current RPC
activeContracts.stakingOperators    // Current contract address
```

#### Current Networks

- **nilavTestnet** (Blacklight Testnet)
  - Chain ID: 78651
  - RPC: `https://rpc-nilav-shzvox09l5.t.conduit.xyz`
  - Explorer: `https://explorer-nilav-shzvox09l5.t.conduit.xyz`

- **nilavMainnet** (Placeholder)
  - Chain ID: TBD
  - Addresses: TBD

---

## Contract Integration

### Contract Addresses (`config/index.ts`)

Contract addresses are defined per network in the `contracts` object:

```typescript
export const contracts = {
  nilavTestnet: {
    nilToken: '0xf65b7cCF9f13ef932093bac19Eb5ea77ee70F4A4',
    nilTokenSymbol: 'NIL',
    nilTokenDecimals: 6,
    nilTokenStakeMin: 10,
    stakingOperators: '0x2913f0A4C1BE4e991CCf76F04C795E5646e02049',
    heartbeatManager: '0x3dbE95E20B370C5295E7436e2d887cFda8bcb02c',
    blockExplorer: 'https://explorer-nilav-shzvox09l5.t.conduit.xyz',
    stakingOperatorsDeploymentBlock: 700000,  // For indexer optimization
  },
} as const;

// Auto-selected based on NEXT_PUBLIC_NETWORK
export const activeContracts = contracts[NETWORK_KEY];
```

**Always use `activeContracts`** to get the correct addresses for the current network:

```typescript
import { activeContracts } from '@/config';

const stakingAddress = activeContracts.stakingOperators;
const tokenAddress = activeContracts.nilToken;
```

### Contract ABIs (`lib/abis/`)

ABIs are stored as **TypeScript files** (not JSON) for type safety:

**Location:** `lib/abis/StakingOperators.ts`

```typescript
export const stakingOperatorsABI = [
  {
    type: 'function',
    name: 'stakeTo',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ... more functions
] as const;
```

**Usage in hooks:**

```typescript
import { stakingOperatorsABI } from '@/lib/abis/StakingOperators';
import { activeContracts } from '@/config';

useWriteContract({
  abi: stakingOperatorsABI,
  address: activeContracts.stakingOperators,
  functionName: 'stakeTo',
  args: [operatorAddress, amount],
});
```

#### Adding a New ABI

1. **Get the ABI** from contract deployment or Foundry output
2. **Create TypeScript file** at `lib/abis/YourContract.ts`
3. **Export as const** for type inference:

```typescript
export const yourContractABI = [
  // ... ABI array
] as const;
```

4. **Add address to config**:

```typescript
// config/index.ts
export const contracts = {
  nilavTestnet: {
    // ...
    yourContract: '0x...',
  },
};
```

5. **Use in hooks** with wagmi's type safety

### Contract Interaction Hooks (`lib/hooks/`)

All contract calls go through custom hooks that wrap wagmi:

**Main hook:** `lib/hooks/useStakingOperators.ts`

```typescript
import { useStakingOperators } from '@/lib/hooks';

function Component() {
  const {
    // Write functions
    stakeTo,              // Stake tokens to operator
    registerOperator,     // Register as operator
    requestUnstake,       // Start unbonding
    withdrawUnstaked,     // Complete unstake

    // State
    isPending,            // Transaction pending
    isSuccess,            // Transaction success
    error,                // User-friendly error message
    txHash,              // Transaction hash

    // Read functions
    getOperatorInfo,      // Get operator details
  } = useStakingOperators();

  // Use functions...
}
```

**Key features:**
- Pre-configured with correct contract addresses and ABIs
- Auto-invalidates React Query caches after transactions
- Parses contract errors into user-friendly messages
- Provides transaction tracking state

---

## Wallet Connection

### Checking Connection Status

Use Reown AppKit's `useAppKitAccount` hook:

```typescript
'use client';

import { useAppKitAccount } from '@reown/appkit/react';

export default function Page() {
  const { address, isConnected } = useAppKitAccount();

  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }

  return <div>Connected: {address}</div>;
}
```

**Available from hook:**
- `address` - User's wallet address (checksummed)
- `isConnected` - Boolean connection status
- `chainId` - Current chain ID
- `status` - Connection status ('connected' | 'disconnected' | 'connecting')

### Connection UI

Pre-built component: `components/auth/ConnectWallet.tsx`

```typescript
import { ConnectWallet } from '@/components/auth';

<ConnectWallet />  // Shows wallet connection button
```

### AppKit Configuration (`app/providers.tsx`)

AppKit is configured in the providers:

```typescript
import { createAppKit } from '@reown/appkit/react';
import { wagmiAdapter, projectId, networks } from '@/config';

createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId,           // From NEXT_PUBLIC_PROJECT_ID
  networks: networks,              // From config (auto-selected)
  defaultNetwork: networks[0],     // Active network
  themeMode: 'dark',
  allowUnsupportedChain: true,     // Important for custom chains
  enableWalletConnect: false,      // Disabled for custom network
  enableInjected: true,            // MetaMask, Brave, etc.
});
```

**Note:** WalletConnect is disabled for custom networks. Only injected wallets (MetaMask, etc.) work.

### Checking Chain ID

```typescript
import { useAppKitAccount } from '@reown/appkit/react';
import { activeNetwork } from '@/config';

const { chainId, isConnected } = useAppKitAccount();

if (isConnected && chainId !== activeNetwork.id) {
  // User is on wrong chain
  return <div>Please switch to {activeNetwork.name}</div>;
}
```

---

## Blockchain Event Indexer

### Overview

The indexer queries historical blockchain events using **Conduit Indexer API** via **Server Actions** (prevents SQL injection).

**Location:** `lib/indexer/`

**Complete documentation:** `lib/indexer/README.md`

### Architecture

```
Client Component
    ↓ (import Server Action)
lib/indexer/actions.ts     ← Input validation (address format, limits)
    ↓
lib/indexer/queries.ts     ← SQL query construction
    ↓
lib/indexer/client.ts      ← Conduit API call (uses INDEXER_API_KEY)
    ↓
Conduit Indexer API
```

**Security:**
- ✅ API key never exposed to browser (server-side only)
- ✅ No arbitrary SQL (clients can't craft queries)
- ✅ Input validation on all parameters
- ✅ Contract address filtering on all queries

### File Structure

```
lib/indexer/
├── README.md              # Complete guide (READ THIS)
├── index.ts               # Public exports
├── actions.ts             # Server Actions (client imports these)
├── queries.ts             # SQL query functions (server-only)
├── client.ts              # Conduit API client (server-only)
├── events.ts              # Event signatures
├── helpers.ts             # Query builders
├── contracts.ts           # Contract addresses for queries
├── formatters.ts          # Timestamp utilities
└── STATS.md               # Advanced SQL patterns
```

### Available Queries

Import from `@/lib/indexer`:

```typescript
import {
  getOperatorRegistration,
  getOperatorDeactivation,
  getHTXAssignments,
  getHTXResponses,
  getStakedEvents,
} from '@/lib/indexer';
```

**Operator events:**
```typescript
// When operator registered
await getOperatorRegistration(operatorAddress)
// Returns: [{ operator, block_num, block_timestamp, tx_hash }]

// When operator deactivated
await getOperatorDeactivation(operatorAddress, fromBlock?)
```

**HTX verification events:**
```typescript
// Heartbeat tasks assigned to node
await getHTXAssignments(nodeAddress, fromBlock?, limit?)
// Returns: [{ htxId, node, block_num, block_timestamp, tx_hash }]

// Node's verification responses
await getHTXResponses(nodeAddress, fromBlock?, limit?)
// Returns: [{ htxId, node, result, block_num, block_timestamp, tx_hash }]
```

**Staking events:**
```typescript
// All stakes by a wallet
await getStakedEvents(stakerAddress, fromBlock?, limit?)
// Returns: [{ operator, staker, amount, block_num, block_timestamp, tx_hash }]
```

### Usage Pattern

**In client components** (with React Query):

```typescript
'use client';

import { getHTXAssignments } from '@/lib/indexer';
import { useQuery } from '@tanstack/react-query';

export function ActivityFeed({ nodeAddress }: { nodeAddress: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['htx-assignments', nodeAddress],
    queryFn: () => getHTXAssignments(nodeAddress, undefined, 25),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {data?.data.map((assignment) => (
        <li key={assignment.tx_hash}>{assignment.htxId}</li>
      ))}
    </ul>
  );
}
```

**In server components** (direct call):

```typescript
import { getHTXAssignments } from '@/lib/indexer';

export default async function Page() {
  const assignments = await getHTXAssignments(nodeAddress, undefined, 25);

  return (
    <ul>
      {assignments.data.map((a) => (
        <li key={a.tx_hash}>{a.htxId}</li>
      ))}
    </ul>
  );
}
```

### Performance Optimization

Use `fromBlock` parameter to query from operator registration instead of genesis:

```typescript
// Step 1: Get registration block
const reg = await getOperatorRegistration(operatorAddress);
const registrationBlock = reg.data[0]?.block_num;

// Step 2: Query from that block onwards (much faster)
const assignments = await getHTXAssignments(
  operatorAddress,
  registrationBlock,  // Start from registration
  50
);
```

**Why this matters:**
- Operator can't have events before registration
- Reduces blocks scanned (faster queries, lower costs)
- Deployment block also available: `activeContracts.stakingOperatorsDeploymentBlock`

### Configuration

**Environment variables:**

```bash
# Required (server-side only, never NEXT_PUBLIC_*)
INDEXER_API_KEY=your-conduit-api-key

# Optional: Override API endpoint
INDEXER_API_URL=https://indexing.conduit.xyz/v2/query
```

**Indexer config** in `config/index.ts`:

```typescript
export const indexer = {
  chainId: activeNetwork.id,  // Auto-selected based on NEXT_PUBLIC_NETWORK
} as const;
```

### Adding a New Query

See `lib/indexer/README.md` for complete guide. Quick overview:

1. **Add event signature** (`lib/indexer/events.ts`):
```typescript
export const STAKING_EVENTS = {
  YourEvent: 'YourEvent(address indexed param1, uint256 param2)',
} as const;
```

2. **Define type** (`lib/indexer/queries.ts`):
```typescript
export interface YourEventData extends BlockchainEvent {
  param1: string;
  param2: string;
}
```

3. **Create query function** (`lib/indexer/queries.ts`):
```typescript
export async function getYourEventQuery(
  address: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<YourEventData>> {
  const query = buildOperatorEventQuery(
    STAKING_EVENTS.YourEvent,
    address,
    { fromBlock, limit }
  );
  return await queryIndexer<YourEventData>(query, [STAKING_EVENTS.YourEvent]);
}
```

4. **Create Server Action** (`lib/indexer/actions.ts`):
```typescript
'use server';

export async function getYourEvent(address: string, fromBlock?: number, limit?: number) {
  // Validate inputs
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid address format');
  }
  return await getYourEventQuery(address, fromBlock, limit);
}
```

5. **Export** (`lib/indexer/index.ts`):
```typescript
export { getYourEvent } from './actions';
```

### Indexer Contract Configuration

Indexer queries filter by contract address automatically (from `lib/indexer/contracts.ts`):

```typescript
export const STAKING_CONTRACT = {
  chainId: 78651,
  contractAddress: '0x2913f0A4C1BE4e991CCf76F04C795E5646e02049',
  contractName: 'StakingOperators',
};

export const HEARTBEAT_MANAGER_CONTRACT = {
  chainId: 78651,
  contractAddress: '0x3dbE95E20B370C5295E7436e2d887cFda8bcb02c',
  contractName: 'HeartbeatManager',
};
```

**When adding a new chain:**
Update these contracts with the new chain's addresses.

---

## Common Web3 Tasks

### Reading Contract State

```typescript
import { useStakingOperators } from '@/lib/hooks';
import { useQuery } from '@tanstack/react-query';

const { getOperatorInfo } = useStakingOperators();

const { data } = useQuery({
  queryKey: ['operator', address],
  queryFn: () => getOperatorInfo(address),
});

// data: { staker, stake, active, jailed, ... }
```

### Writing to Contract

```typescript
import { useStakingOperators } from '@/lib/hooks';

const { stakeTo, isPending, isSuccess, error } = useStakingOperators();

// Call contract function
await stakeTo(operatorAddress, parseUnits('100', 6));

// Hook provides:
// - isPending: transaction in progress
// - isSuccess: transaction confirmed
// - error: user-friendly error message
// - Auto cache invalidation after success
```

### Querying Historical Events

```typescript
import { getStakedEvents } from '@/lib/indexer';
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['stakes', userAddress],
  queryFn: () => getStakedEvents(userAddress, undefined, 100),
});

// data.data: Array of stake events with timestamps
```

### Getting User's Token Balance

```typescript
import { useWalletBalances } from '@/lib/hooks';

const { nilBalance, ethBalance, isLoading } = useWalletBalances(userAddress);

// nilBalance: BigInt (in token's smallest unit)
// ethBalance: BigInt (in wei)
```

### Parsing Token Amounts

```typescript
import { parseUnits, formatUnits } from 'viem';
import { activeContracts } from '@/config';

// User input "100" → contract amount
const amount = parseUnits('100', activeContracts.nilTokenDecimals);

// Contract amount → display "100.000000"
const display = formatUnits(amount, activeContracts.nilTokenDecimals);
```

---

## Wagmi Configuration

Wagmi is configured in `config/index.ts` and wrapped in `app/providers.tsx`:

```typescript
// config/index.ts
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { cookieStorage, createStorage } from '@wagmi/core';

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,                      // Server-side rendering support
  projectId,                      // Reown project ID
  networks,                       // Active network(s)
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
```

```typescript
// app/providers.tsx
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter } from '@/config';

export function Providers({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

---

## Important Web3 Conventions

### Always Use activeContracts

```typescript
import { activeContracts } from '@/config';

// ✅ Correct - adapts to environment
const address = activeContracts.stakingOperators;

// ❌ Wrong - hardcoded
const address = '0x2913f0A4C1BE4e991CCf76F04C795E5646e02049';
```

### Address Padding in Events

Ethereum event topics pad addresses to 32 bytes:

```typescript
import { stripAddressPadding } from '@/lib/indexer';

// Event topic: '0x000000000000000000000000abc...'
const cleanAddress = stripAddressPadding(paddedTopic);
// Result: '0xabc...'
```

Indexer queries handle this automatically.

### Environment Variable Security

```bash
# ✅ Public (can be in browser)
NEXT_PUBLIC_PROJECT_ID=...
NEXT_PUBLIC_NETWORK=...

# ✅ Server-only (API keys)
INDEXER_API_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# ❌ NEVER do this (exposes API key to browser)
NEXT_PUBLIC_INDEXER_API_KEY=...
```

---

## Deployment Block Optimization

Set deployment block in config to optimize indexer queries:

```typescript
export const contracts = {
  nilavTestnet: {
    stakingOperators: '0x...',
    stakingOperatorsDeploymentBlock: 700000,  // No events before this
  },
};
```

Use in queries:

```typescript
const { stakingOperatorsDeploymentBlock } = activeContracts;

await getStakedEvents(
  address,
  stakingOperatorsDeploymentBlock,  // Start from deployment
  100
);
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `config/index.ts` | **Networks, chains, contract addresses** |
| `lib/abis/StakingOperators.ts` | **Contract ABI** |
| `lib/hooks/useStakingOperators.ts` | **Contract interaction hook** |
| `lib/indexer/` | **Blockchain event queries** |
| `lib/indexer/README.md` | **Complete indexer documentation** |
| `lib/indexer/contracts.ts` | **Indexer contract configuration** |
| `app/providers.tsx` | **Wagmi, AppKit, React Query setup** |

---

## Further Reading

- **Indexer Guide:** `lib/indexer/README.md` - Complete event query documentation
- **Parent Project:** `../CLAUDE.md` - Full NilAV ecosystem overview
- **wagmi docs:** https://wagmi.sh - React hooks for Ethereum
- **viem docs:** https://viem.sh - Low-level Ethereum library
