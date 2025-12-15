# Network Migration Guide

## Overview

This guide explains how to migrate from hardcoded `nilavTestnet` references to the new environment-based network configuration system.

### What Changed?

The app now supports **environment-based network selection** via the `NEXT_PUBLIC_NETWORK` environment variable. This allows deploying the same codebase to different networks (testnet vs mainnet) without code changes.

---

## Configuration Changes

### Environment Variable

**`.env.local`** (or deployment environment):
```bash
# Active network: nilavTestnet (development) or nilavMainnet (production)
NEXT_PUBLIC_NETWORK=nilavTestnet
```

### New Exports from `config/index.ts`

| Export | Description | Usage |
|--------|-------------|-------|
| `activeNetwork` | The currently active network (based on env) | Use for chainId, RPC URLs, etc. |
| `activeContracts` | Contract addresses for active network | Use for contract addresses |
| `nilavTestnet` | Testnet chain definition | Available for reference |
| `nilavMainnet` | Mainnet chain definition | Available for reference |
| `networkMap` | Map of all networks | For iteration/lookups |
| `getContractAddresses(chainId)` | Get contracts by chain ID | For dynamic lookups |

---

## Migration Patterns

### Pattern 1: Direct Network References

**Before:**
```typescript
import { nilavTestnet } from '@/config';

chainId: nilavTestnet.id
```

**After:**
```typescript
import { activeNetwork } from '@/config';

chainId: activeNetwork.id
```

---

### Pattern 2: Contract Address References

**Before:**
```typescript
import { contracts } from '@/config';

address: contracts.nilavTestnet.nilToken as `0x${string}`
```

**After:**
```typescript
import { activeContracts } from '@/config';

address: activeContracts.nilToken as `0x${string}`
```

---

### Pattern 3: Network Validation

**Before:**
```typescript
import { nilavTestnet } from '@/config';

const isCorrectNetwork = chainId === nilavTestnet.id;
```

**After:**
```typescript
import { activeNetwork } from '@/config';

const isCorrectNetwork = chainId === activeNetwork.id;
```

---

### Pattern 4: Network Switching

**Before:**
```typescript
import { nilavTestnet } from '@/config';

switchChain({ chainId: nilavTestnet.id })
```

**After:**
```typescript
import { activeNetwork } from '@/config';

switchChain({ chainId: activeNetwork.id })
```

---

### Pattern 5: Block Explorer Links

**Before:**
```typescript
import { contracts } from '@/config';

href={`${contracts.nilavTestnet.blockExplorer}/tx/${txHash}`}
```

**After:**
```typescript
import { activeContracts } from '@/config';

href={`${activeContracts.blockExplorer}/tx/${txHash}`}
```

---

### Pattern 6: Token Symbol Display

**Before:**
```typescript
import { contracts } from '@/config';

{contracts.nilavTestnet.nilTokenSymbol}
```

**After:**
```typescript
import { activeContracts } from '@/config';

{activeContracts.nilTokenSymbol}
```

---

## Example: Complete Hook Migration

### Before: `useWalletBalances.ts`

```typescript
import { useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { nilavTestnet, contracts } from '@/config';

export function useWalletBalances(address?: `0x${string}`) {
  const { data: ethBalance } = useBalance({
    address: address,
    chainId: nilavTestnet.id,  // ❌ Hardcoded
  });

  const { data: tokenBalance } = useReadContract({
    address: contracts.nilavTestnet.nilToken as `0x${string}`,  // ❌ Hardcoded
    chainId: nilavTestnet.id,  // ❌ Hardcoded
    // ...
  });

  // ...
}
```

### After: `useWalletBalances.ts`

```typescript
import { useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { activeNetwork, activeContracts } from '@/config';  // ✅ Updated imports

export function useWalletBalances(address?: `0x${string}`) {
  const { data: ethBalance } = useBalance({
    address: address,
    chainId: activeNetwork.id,  // ✅ Dynamic
  });

  const { data: tokenBalance } = useReadContract({
    address: activeContracts.nilToken as `0x${string}`,  // ✅ Dynamic
    chainId: activeNetwork.id,  // ✅ Dynamic
    // ...
  });

  // ...
}
```

---

## Files That Need Migration

### Priority 1: Critical (Core Functionality)

These files must be migrated for the app to work on mainnet:

1. **`lib/hooks/useStakingOperators.ts`** (~20 references)
   - All contract addresses
   - All chainId references
   - Block explorer links

2. **`lib/indexer/queries.ts`** (~10 references)
   - All query builders use hardcoded chainId
   - All contract addresses

3. **`lib/indexer/contracts.ts`**
   - Pre-configured contract objects

4. **`lib/hooks/useUserStakedOperators.ts`**
   - chainId in getPublicClient
   - Contract addresses
   - Deployment block

### Priority 2: High (User-Facing Components)

5. **`components/auth/ConnectWallet.tsx`**
   - Network validation
   - Auto-switch logic

6. **`components/staking/StakingForm.tsx`**
   - Network validation
   - Network switching
   - Contract references

7. **`components/staking/UnbondingForm.tsx`**
8. **`components/staking/UnstakingForm.tsx`**
9. **`components/transfer/FundNodeForm.tsx`**

### Priority 3: Medium (Display Components)

10. **`components/ui/TransactionTracker.tsx`**
11. **`components/activity/ActivityEvent.tsx`**
12. **`app/nodes/page.tsx`**
13. **`app/nodes/[nodePublicKey]/page.tsx`**

### Already Migrated ✅

- ✅ `lib/hooks/useWalletBalances.ts`
- ✅ `config/index.ts`
- ✅ `.env.local`

---

## Migration Checklist

For each file:

- [ ] Update imports: `nilavTestnet` → `activeNetwork`
- [ ] Update imports: `contracts` → keep same, but use `activeContracts`
- [ ] Replace `nilavTestnet.id` with `activeNetwork.id`
- [ ] Replace `contracts.nilavTestnet.*` with `activeContracts.*`
- [ ] Search for hardcoded `78651` and replace with `activeNetwork.id`
- [ ] Test on testnet (NEXT_PUBLIC_NETWORK=nilavTestnet)
- [ ] Test network switching behavior

---

## Testing

### Test Locally with Testnet

```bash
# .env.local
NEXT_PUBLIC_NETWORK=nilavTestnet

npm run dev
```

### Simulate Mainnet Locally

```bash
# .env.local
NEXT_PUBLIC_NETWORK=nilavMainnet

npm run dev
```

**Note:** You'll need to update mainnet addresses in `config/index.ts` first:
- Replace `0x0000...` placeholder addresses with real deployed contract addresses
- Update chain ID (currently `0`)
- Update RPC URLs
- Update block explorer URL

---

## Deployment Strategy

### Option 1: Environment Variables (Recommended)

Deploy the same codebase with different environment variables:

**Testnet Deployment:**
```bash
NEXT_PUBLIC_NETWORK=nilavTestnet
NEXT_PUBLIC_PROJECT_ID=...
INDEXER_API_KEY=...
```

**Mainnet Deployment:**
```bash
NEXT_PUBLIC_NETWORK=nilavMainnet
NEXT_PUBLIC_PROJECT_ID=...
INDEXER_API_KEY=...
```

### Option 2: Branches

- `main` branch → Testnet (`NEXT_PUBLIC_NETWORK=nilavTestnet`)
- `production` branch → Mainnet (`NEXT_PUBLIC_NETWORK=nilavMainnet`)

---

## Common Pitfalls

### ❌ Mixing Old and New Patterns

```typescript
import { nilavTestnet, activeContracts } from '@/config';

// ❌ Don't mix patterns
chainId: nilavTestnet.id  // Old
address: activeContracts.nilToken  // New
```

```typescript
import { activeNetwork, activeContracts } from '@/config';

// ✅ Use consistent pattern
chainId: activeNetwork.id  // New
address: activeContracts.nilToken  // New
```

### ❌ Forgetting Indexer Queries

Indexer queries often have hardcoded chainIds in SQL strings:

```typescript
// ❌ Before
const query = `SELECT * FROM logs WHERE chain = ${indexer.chainId}`;
```

```typescript
// ✅ After (indexer.chainId is now dynamic)
const query = `SELECT * FROM logs WHERE chain = ${indexer.chainId}`;
```

### ❌ Not Testing Both Networks

Always test with:
1. `NEXT_PUBLIC_NETWORK=nilavTestnet` - Should work exactly as before
2. `NEXT_PUBLIC_NETWORK=nilavMainnet` - Should use mainnet contracts (once deployed)

---

## Benefits

After migration:

✅ **Zero code changes** needed to switch networks
✅ **Environment-based** deployment (testnet vs mainnet)
✅ **Type-safe** - TypeScript ensures all networks have same config shape
✅ **Future-proof** - Easy to add new networks (e.g., devnet, staging)
✅ **Centralized** - Network config in one place
✅ **Backwards compatible** - Testnet still works exactly as before

---

## Need Help?

If you encounter issues during migration:

1. Check the **migration patterns** above for your specific use case
2. Look at `lib/hooks/useWalletBalances.ts` as a reference example
3. Search for TODO comments in `config/index.ts` for mainnet values that need updating
4. Verify `NEXT_PUBLIC_NETWORK` is set correctly in `.env.local`

---

## Next Steps

1. ✅ Config updated with `activeNetwork` and `activeContracts`
2. ✅ One hook migrated as example (`useWalletBalances`)
3. ⏳ Migrate remaining hooks (see Priority 1 above)
4. ⏳ Migrate components (see Priority 2-3 above)
5. ⏳ Update mainnet addresses in config when contracts deployed
6. ⏳ Test thoroughly on both networks
7. ⏳ Deploy!
