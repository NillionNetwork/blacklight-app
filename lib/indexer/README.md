# Indexer Module

Secure, type-safe blockchain event queries using the Conduit Indexer API.

**All indexer documentation is in this file. For advanced SQL patterns, see [STATS.md](./STATS.md).**

---

## Table of Contents

- [Quick Start](#-quick-start)
- [Security Model](#-security-model)
- [Available Queries](#-available-queries)
- [Adding a New Query](#-adding-a-new-query)
- [Common Patterns](#-common-patterns)
- [Query Helpers](#-query-helpers)
- [Performance Tips](#-performance-tips)
- [Formatting Utilities](#-formatting-utilities)
- [Troubleshooting](#-troubleshooting)
- [Advanced Topics](#-advanced-topics)

---

## 🚀 Quick Start

### Using from Client Components

```typescript
'use client';

import { getHTXAssignments, formatTimeAgo } from '@/lib/indexer';
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
        <li key={assignment.tx_hash}>
          HTX {assignment.htxId.slice(0, 8)}...{' '}
          {formatTimeAgo(assignment.block_timestamp)}
        </li>
      ))}
    </ul>
  );
}
```

### Using from Server Components

```typescript
import { getHTXAssignments } from '@/lib/indexer';

export default async function NodePage({ params }) {
  const nodeAddress = params.address;

  // Call directly - no useQuery needed
  const assignments = await getHTXAssignments(nodeAddress, undefined, 25);

  return (
    <ul>
      {assignments.data.map((assignment) => (
        <li key={assignment.tx_hash}>{assignment.htxId}</li>
      ))}
    </ul>
  );
}
```

---

## 🔒 Security Model

**The indexer uses Server Actions to prevent SQL injection attacks.**

### Old Architecture (Insecure) ❌

```
Client → /api/indexer?query=SELECT... → Conduit API
Problem: Users can craft arbitrary SQL queries
```

### New Architecture (Secure) ✅

```
Client Component → Server Action (validated) → queryIndexer() → Conduit API
```

### Key Security Features

- ✅ **Input Validation**: All parameters validated (address format, limits, block numbers)
- ✅ **No Arbitrary SQL**: Clients cannot craft custom queries
- ✅ **API Key Protection**: `INDEXER_API_KEY` never exposed to browsers
- ✅ **Contract Scoping**: All queries filter by specific contract addresses
- ✅ **Rate Limiting Ready**: Single point for future rate limiting

---

## 📚 Available Queries

All queries are Server Actions exported from `@/lib/indexer`:

### Operator Events

```typescript
// Get when operator registered
getOperatorRegistration(operatorAddress: string)
// Returns: { data: [{ operator, block_num, block_timestamp, tx_hash }] }

// Get when operator was deactivated
getOperatorDeactivation(operatorAddress: string, fromBlock?: number)
// Returns: { data: [{ operator, block_num, block_timestamp, tx_hash }] }
```

### HTX Verification Events

```typescript
// Get HTX tasks assigned to a node
getHTXAssignments(
  nodeAddress: string,
  fromBlock?: number,
  limit?: number  // Max: 1000, default: 50
)
// Returns: { data: [{ htxId, node, block_num, block_timestamp, tx_hash }] }

// Get node's responses to HTX tasks
getHTXResponses(
  nodeAddress: string,
  fromBlock?: number,
  limit?: number
)
// Returns: { data: [{ htxId, node, result, block_num, block_timestamp, tx_hash }] }
```

### Staking Events

```typescript
// Get all staking events for a user's wallet
getStakedEvents(
  stakerAddress: string,
  fromBlock?: number,
  limit?: number
)
// Returns: { data: [{ operator, staker, amount, block_num, block_timestamp, tx_hash }] }
```

### Response Format

All queries return:

```typescript
interface IndexerResponse<T> {
  data: T[];  // Array of events
  meta?: {
    total?: number;
    page?: number;
  };
}
```

Each event extends `BlockchainEvent`:

```typescript
interface BlockchainEvent {
  block_num: number;        // Block number
  block_timestamp: string;  // ISO 8601 timestamp
  tx_hash: string;          // Transaction hash
}
```

---

## 🛠️ Adding a New Query

Follow these 5 steps to add a new blockchain event query.

### Step 1: Add Event Signature

**File:** `events.ts`

```typescript
export const STAKING_EVENTS = {
  YourNewEvent: 'YourNewEvent(address indexed param1, uint256 param2)',
} as const;
```

**Important:**
- Include `indexed` keywords (automatically stripped during hashing)
- Match exact Solidity event signature

### Step 2: Define Type Interface

**File:** `queries.ts`

```typescript
export interface YourNewEventData extends BlockchainEvent {
  param1: string;  // Ethereum address (from topics[2])
  param2: string;  // Will be string from indexer (from data field)
}
```

**Note:** All events extend `BlockchainEvent` (block_num, block_timestamp, tx_hash).

### Step 3: Create Query Function

**File:** `queries.ts`

Choose the appropriate helper based on event structure:

#### Option A: Operator in topics[2]

```typescript
export async function getYourNewEventQuery(
  operatorAddress: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<YourNewEventData>> {
  const query = buildOperatorEventQuery(
    STAKING_EVENTS.YourNewEvent,
    operatorAddress,
    { fromBlock, limit }
  );

  return await queryIndexer<YourNewEventData>(query, [
    STAKING_EVENTS.YourNewEvent,
  ]);
}
```

#### Option B: Staker in topics[2]

```typescript
export async function getYourNewEventQuery(
  stakerAddress: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<YourNewEventData>> {
  const query = buildStakerEventQuery(
    STAKING_EVENTS.YourNewEvent,
    stakerAddress,
    { fromBlock, limit }
  );

  return await queryIndexer<YourNewEventData>(query, [
    STAKING_EVENTS.YourNewEvent,
  ]);
}
```

#### Option C: Node in topics[3] (HTX events)

```typescript
export async function getYourNewEventQuery(
  nodeAddress: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<YourNewEventData>> {
  const query = buildRouterEventQuery(
    ROUTER_EVENTS.YourNewEvent,
    nodeAddress,
    { fromBlock, limit }
  );

  return await queryIndexer<YourNewEventData>(query, [
    ROUTER_EVENTS.YourNewEvent,
  ]);
}
```

### Step 4: Create Server Action

**File:** `actions.ts`

```typescript
'use server';

export async function getYourNewEvent(
  address: string,
  fromBlock?: number,
  limit?: number
) {
  // Validate address format
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid address format');
  }

  // Validate fromBlock
  if (fromBlock !== undefined && (fromBlock < 0 || !Number.isInteger(fromBlock))) {
    throw new Error('Invalid fromBlock value');
  }

  // Validate limit
  if (limit !== undefined && (limit < 1 || limit > 1000 || !Number.isInteger(limit))) {
    throw new Error('Invalid limit value (must be between 1 and 1000)');
  }

  // Call the query
  return await getYourNewEventQuery(address, fromBlock, limit);
}
```

**Validation is critical!** Always validate:
- Address format (must be valid Ethereum address)
- Block numbers (must be positive integers)
- Limits (must be between 1 and 1000)

### Step 5: Export Server Action

**File:** `index.ts`

```typescript
export { getYourNewEvent } from './actions';
```

**Done!** Now client components can import and use `getYourNewEvent()`.

### Checklist

- [ ] Add signature to `lib/indexer/events.ts`
- [ ] Create interface extending `BlockchainEvent` in `queries.ts`
- [ ] Choose correct helper function (buildOperatorEventQuery, buildStakerEventQuery, or buildRouterEventQuery)
- [ ] Create query function in `queries.ts`
- [ ] Create Server Action in `actions.ts` with validation
- [ ] Export Server Action in `index.ts`
- [ ] Post-process: strip address padding (if needed)
- [ ] Decode `data` field (if event has non-indexed params)
- [ ] Test query in Conduit UI first
- [ ] Use `fromBlock` for performance

---

## 🎯 Common Patterns

### Pattern 1: Event Timeline

Display recent events in chronological order:

```typescript
'use client';

import { getHTXAssignments, formatTimeAgo } from '@/lib/indexer';
import { useQuery } from '@tanstack/react-query';

export function EventTimeline({ nodeAddress }: { nodeAddress: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['htx-assignments', nodeAddress],
    queryFn: () => getHTXAssignments(nodeAddress, undefined, 10),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data.map((event) => (
        <div key={event.tx_hash}>
          <span>{event.htxId}</span>
          <span>{formatTimeAgo(event.block_timestamp)}</span>
          <a href={`https://explorer.../tx/${event.tx_hash}`}>View TX</a>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Discovering Unique Values

Find all unique operators a user has staked to:

```typescript
'use client';

import { getStakedEvents } from '@/lib/indexer';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function UserOperators({ userAddress }: { userAddress: string }) {
  const { data } = useQuery({
    queryKey: ['staked-events', userAddress],
    queryFn: () => getStakedEvents(userAddress, undefined, 500),
  });

  // Extract unique operators
  const operators = useMemo(() => {
    if (!data?.data) return [];
    return Array.from(new Set(data.data.map(e => e.operator)));
  }, [data]);

  return (
    <ul>
      {operators.map(op => (
        <li key={op}>{op}</li>
      ))}
    </ul>
  );
}
```

### Pattern 3: Grouping Related Events

Group HTX assignments with their responses:

```typescript
'use client';

import { getHTXAssignments, getHTXResponses } from '@/lib/indexer';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function HTXLifecycle({ nodeAddress }: { nodeAddress: string }) {
  const { data: assignments } = useQuery({
    queryKey: ['assignments', nodeAddress],
    queryFn: () => getHTXAssignments(nodeAddress, undefined, 50),
  });

  const { data: responses } = useQuery({
    queryKey: ['responses', nodeAddress],
    queryFn: () => getHTXResponses(nodeAddress, undefined, 50),
  });

  // Group by HTX ID
  const htxMap = useMemo(() => {
    const map = new Map();

    assignments?.data.forEach(a => {
      map.set(a.htxId, { assignment: a });
    });

    responses?.data.forEach(r => {
      const existing = map.get(r.htxId);
      if (existing) existing.response = r;
    });

    return map;
  }, [assignments, responses]);

  return (
    <div>
      {Array.from(htxMap.values()).map(({ assignment, response }) => (
        <div key={assignment.htxId}>
          <span>HTX: {assignment.htxId}</span>
          {response ? (
            <span>Result: {response.result ? '✓ Valid' : '✗ Invalid'}</span>
          ) : (
            <span>⏳ Pending</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Pattern 4: Performance Optimization with Registration Block

Only query events from when operator registered (much faster):

```typescript
'use client';

import { getOperatorRegistration, getHTXAssignments } from '@/lib/indexer';
import { useQuery } from '@tanstack/react-query';

export function OptimizedActivity({ nodeAddress }: { nodeAddress: string }) {
  // Step 1: Get registration block
  const { data: registration } = useQuery({
    queryKey: ['registration', nodeAddress],
    queryFn: () => getOperatorRegistration(nodeAddress),
  });

  const registrationBlock = registration?.data?.[0]?.block_num;

  // Step 2: Only query from registration block onwards
  const { data: assignments } = useQuery({
    queryKey: ['assignments', nodeAddress, registrationBlock],
    queryFn: () => getHTXAssignments(nodeAddress, registrationBlock, 50),
    enabled: registrationBlock !== undefined, // Don't run until we have block
  });

  return <div>{/* Use assignments... */}</div>;
}
```

**Why this works:**
- Operator can't have events before registration
- Reduces blocks scanned by indexer (faster queries)
- Lower API costs
- Logical correctness

---

## 🔧 Query Helpers

Pre-built query builders ensure contract filtering and proper formatting.

### buildOperatorEventQuery

For events where operator is in topics[2]:

```typescript
buildOperatorEventQuery(eventName, operatorAddress, options)
```

**Options:**
- `selectFields?: string[]` - Default: `['topics[2] as operator', 'block_num', 'block_timestamp', 'tx_hash']`
- `limit?: number` - Default: 1
- `orderBy?: string` - Default: 'block_num DESC'
- `fromBlock?: number` - Optional performance optimization

**Example:**
```typescript
const query = buildOperatorEventQuery(
  STAKING_EVENTS.OperatorRegistered,
  '0x...',
  { fromBlock: 1000000, limit: 50 }
);
```

### buildStakerEventQuery

For events where staker is in topics[2]:

```typescript
buildStakerEventQuery(eventName, stakerAddress, options)
```

**Same options as buildOperatorEventQuery.**

### buildRouterEventQuery

For HTX events where node is in topics[3]:

```typescript
buildRouterEventQuery(eventName, nodeAddress, options)
```

**Options:**
- `selectFields?: string[]` - Default: `['topics[3] as node', 'block_num', 'block_timestamp', 'tx_hash']`
- Other options same as above

### Event Data Structure

```
Event: YourEvent(address indexed param1, address indexed param2, uint256 value)

Stored in logs table as:
├─ topics[1] → event signature hash (auto-calculated)
├─ topics[2] → param1 (padded to 32 bytes)
├─ topics[3] → param2 (padded to 32 bytes)
└─ data      → ABI-encoded value (non-indexed params)
```

**Max 3 indexed params** (+ signature = 4 topics total)

### Decoding Non-Indexed Parameters

For data in the `data` field:

```typescript
import { decodeAbiParameters } from 'viem';

const decoded = decodeAbiParameters(
  [{ type: 'uint256', name: 'amount' }],
  event.data as `0x${string}`
);
```

**Example:** See `getHTXResponses()` in `queries.ts` - decodes bool result from data field.

---

## ⚡ Performance Tips

### 1. Use `fromBlock` Parameter

```typescript
// ❌ Slow - scans from contract deployment
getHTXAssignments(nodeAddress, undefined, 50)

// ✅ Fast - only scans from registration
getHTXAssignments(nodeAddress, registrationBlock, 50)
```

### 2. Set Reasonable Limits

```typescript
// ✅ Good: Small limit for recent activity
getHTXAssignments(address, undefined, 25)

// ✅ Okay: Larger limit for discovery
getStakedEvents(address, undefined, 500)

// ⚠️ Avoid: Very large limits (slow queries)
getStakedEvents(address, undefined, 1000)
```

### 3. Query Only What You Need

```typescript
// ❌ Bad: Query everything then filter client-side
const allEvents = await getStakedEvents(address, undefined, 1000);
const recent = allEvents.data.slice(0, 10);

// ✅ Good: Limit at the query level
const recentEvents = await getStakedEvents(address, undefined, 10);
```

### 4. Use Dependent Queries Pattern

```typescript
// Step 1: Get registration (small query)
const { data: reg } = useQuery({
  queryKey: ['registration', address],
  queryFn: () => getOperatorRegistration(address),
});

const startBlock = reg?.data?.[0]?.block_num;

// Step 2: Use registration block for other queries
const { data: assignments } = useQuery({
  queryKey: ['assignments', address, startBlock],
  queryFn: () => getHTXAssignments(address, startBlock, 50),
  enabled: startBlock !== undefined, // Wait for Step 1
});
```

---

## 🎨 Formatting Utilities

### Timestamp Formatting

Conduit returns timestamps in non-standard format: `"2025-12-19 10:30:00.0 +00:00:00"`

Use our helpers to format them:

```typescript
import { formatTimeAgo, formatFullDate, formatShortDate } from '@/lib/indexer';

formatTimeAgo('2025-12-19 10:30:00.0 +00:00:00');
// → "2 hours ago"

formatFullDate('2025-12-19 10:30:00.0 +00:00:00');
// → "December 19, 2025 at 10:30 AM"

formatShortDate('2025-12-19 10:30:00.0 +00:00:00');
// → "Dec 19, 2025"
```

### Address Utilities

```typescript
import { padAddressTo32Bytes, stripAddressPadding } from '@/lib/indexer';

// Pad address for topic matching (20 bytes → 32 bytes)
padAddressTo32Bytes('0xabc...');
// → '0x000000000000000000000000abc...'

// Extract address from padded topic
stripAddressPadding('0x000000000000000000000000abc...');
// → '0xabc...'
```

---

## ❓ Troubleshooting

### Error: "queryIndexer() can only be called server-side"

**Problem:** You're importing from `./client` or `./queries` in a client component.

**Solution:** Import from `@/lib/indexer` instead (gets Server Actions):

```typescript
// ❌ Wrong
import { queryIndexer } from '@/lib/indexer/client';

// ✅ Correct
import { getHTXAssignments } from '@/lib/indexer';
```

### Error: "Invalid address format"

**Problem:** Address doesn't match Ethereum address format.

**Solution:** Ensure address is lowercase hex string starting with `0x`:

```typescript
// ❌ Wrong
getHTXAssignments('not-an-address')

// ✅ Correct
getHTXAssignments('0x1234567890123456789012345678901234567890')
```

### Error: "Invalid limit (must be 1-1000)"

**Problem:** Limit parameter is out of range.

**Solution:** Set limit between 1 and 1000:

```typescript
// ❌ Wrong
getHTXAssignments(address, undefined, 5000)

// ✅ Correct
getHTXAssignments(address, undefined, 500)
```

### No Results Returned

**Possible causes:**
1. Event doesn't exist for this address
2. Wrong `fromBlock` parameter (too recent)
3. Contract address mismatch

**Debug steps:**
1. Check block explorer to verify events exist
2. Try querying without `fromBlock` parameter
3. Test SQL directly in Conduit UI

### Query Timeout or Slow

**Solutions:**
1. Use `fromBlock` parameter to reduce scan range
2. Reduce `limit` parameter
3. Check if contract address filter is applied (helpers do this automatically)

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` with:

```bash
# Required: Conduit API key (server-side only)
INDEXER_API_KEY=your-key-here

# Optional: Override API endpoint
INDEXER_API_URL=https://indexing.conduit.xyz/v2/query
```

**Important:**
- ✅ Use `INDEXER_API_KEY` (server-side only)
- ❌ Never use `NEXT_PUBLIC_INDEXER_API_KEY` (would expose to clients)

### Contract Addresses

Configured in `contracts.ts`:

```typescript
export const STAKING_CONTRACT = {
  chainId: 78651,
  contractAddress: '0x2913f0A4C1BE4e991CCf76F04C795E5646e02049',
  contractName: 'StakingOperators',
};

export const NILAV_ROUTER_CONTRACT = {
  chainId: 78651,
  contractAddress: '0x34ED5BCD598619f7Aad6e3d9264C38CEb4Cd1edF',
  contractName: 'NilAVRouter',
};
```

---

## 🧪 Testing

### Step 1: Test SQL in Conduit UI

Before adding to code, test your query in Conduit's UI:

**Visit:** https://indexing.conduit.xyz

**Example Query:**
```sql
SELECT topics[2] as operator, block_num, block_timestamp, tx_hash
FROM logs
WHERE chain = 78651
  AND address = '0x2913f0a4c1be4e991ccf76f04c795e5646e02049'
  AND topics[1] = '0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805'
  AND topics[2] = '0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d'
ORDER BY block_num DESC
LIMIT 5
```

**Tips:**
- Find event signature hash using `getEventSignatureHash()`
- Addresses in topics must be padded to 32 bytes
- Always filter by `chain` and `address`

### Step 2: Add to Codebase

Follow the [5-step guide](#-adding-a-new-query) above.

### Step 3: Test in Component

```typescript
const { data, error } = useQuery({
  queryKey: ['test-query'],
  queryFn: () => getYourNewEvent('0x...'),
});

console.log('Results:', data);
console.log('Error:', error);
```

---

## 🏗️ Architecture

### File Structure

```
lib/indexer/
├── README.md              ← You are here (complete guide)
├── actions.ts             ← Server Actions (client-safe, validated)
├── queries.ts             ← Query functions (server-only, raw SQL)
├── client.ts              ← Conduit API client (server-only)
├── events.ts              ← Event signatures
├── helpers.ts             ← Query builders
├── contracts.ts           ← Contract addresses
├── formatters.ts          ← Timestamp formatting
├── index.ts               ← Public exports
├── STATS.md               ← Advanced SQL patterns for statistics
├── SingleNodeStats.md     ← Node-specific metrics
└── CrossNodeStats.md      ← Network-wide aggregations
```

### Import Hierarchy

**Client Components:**
```typescript
import { getHTXAssignments } from '@/lib/indexer';
// Gets: Server Actions (validated, secure)
```

**Server Components:**
```typescript
import { getHTXAssignments as getHTXAssignmentsQuery } from '@/lib/indexer/queries';
// Gets: Direct query functions (no validation overhead)
```

**Never Import (Protected):**
```typescript
import { queryIndexer } from '@/lib/indexer/client';
// ❌ Will throw error if called from client components
```

---

## 📖 Advanced Topics

### Custom SQL Queries

For advanced queries not covered by helpers, see:
- **[STATS.md](./STATS.md)** - Aggregations, GROUP BY, COUNT, SUM
- **[SingleNodeStats.md](./SingleNodeStats.md)** - Per-node metrics
- **[CrossNodeStats.md](./CrossNodeStats.md)** - Network-wide statistics

### Adding Custom Query Builders

If you need a new query pattern (beyond operator/staker/router):

**File:** `helpers.ts`

```typescript
export function buildCustomEventQuery(
  eventSignature: string,
  filterParam: string,
  options: QueryOptions = {}
): string {
  const { fromBlock, limit = 50, orderBy = 'block_num DESC' } = options;

  // Always filter by contract address!
  const whereClause = buildEventWhereClause(
    CONTRACT_ADDRESS,
    eventSignature,
    fromBlock
  );

  return `
    SELECT custom_field, block_num, block_timestamp, tx_hash
    FROM logs
    WHERE ${whereClause}
      AND custom_condition = '${filterParam}'
    ORDER BY ${orderBy}
    LIMIT ${limit}
  `;
}
```

---

## ⚠️ Important Rules

### DO ✅

- **Import from `@/lib/indexer`** in client components
- **Validate all inputs** in Server Actions
- **Filter by contract address** in all queries (helpers do this automatically)
- **Use `fromBlock`** parameter when possible
- **Set reasonable limits** (max 1000 per query)
- **Test SQL in Conduit UI** before adding to code
- **Handle errors gracefully** in components

### DON'T ❌

- **Don't call `queryIndexer()` directly from client components** (will throw error)
- **Don't skip input validation** in Server Actions
- **Don't query without contract filtering** (expensive and slow)
- **Don't expose `INDEXER_API_KEY`** (never use `NEXT_PUBLIC_` prefix)
- **Don't forget to export** Server Actions from `index.ts`
- **Don't use very large limits** without good reason (impacts performance)

---

## 💡 Examples in Codebase

Study these for implementation patterns:

| Pattern | File | What to Learn |
|---------|------|---------------|
| Client component with React Query | `components/activity/ActivityFeed.tsx` | useQuery patterns, dependent queries |
| Operator discovery | `lib/hooks/useUserStakedOperators.ts` | Finding unique values from events |
| Event lifecycle grouping | `components/activity/ActivityFeed.tsx` | Combining multiple event types |
| Decode data field | `lib/indexer/queries.ts` (getHTXResponses) | Decoding non-indexed params |
| Server Action validation | `lib/indexer/actions.ts` | Input validation patterns |
| Query builder usage | `lib/indexer/queries.ts` | Using helper functions |

---

## 🤝 Contributing

When adding new queries:

1. ✅ Test SQL in Conduit UI first
2. ✅ Add event signature to `events.ts`
3. ✅ Create interface in `queries.ts`
4. ✅ Create query function in `queries.ts`
5. ✅ Create Server Action in `actions.ts` with validation
6. ✅ Export from `index.ts`
7. ✅ Update this README with the new query
8. ✅ Test in both client and server components

---

**Questions?** Check [STATS.md](./STATS.md) for advanced SQL patterns.
