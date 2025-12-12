# Conduit Indexer Integration Guide

## Overview

This guide explains how to query blockchain events using the Conduit Indexer API based on our learnings from integrating `OperatorRegistered` event tracking.

## ⚠️ CRITICAL SECURITY REQUIREMENT

**ALWAYS filter by contract address in EVERY query!**

Never query the entire chain - this is:
- ❌ Expensive (can hit rate limits)
- ❌ Slow (poor performance)
- ❌ Insecure (could expose unrelated data)
- ❌ Unsustainable (wasteful resource usage)

✅ **ALWAYS include:** `AND address = '0xYOUR_CONTRACT_ADDRESS'`

Our helper functions enforce this requirement and will throw an error if you try to query without a contract address.

---

## How Conduit Indexer Works

### Data Structure

The Conduit Indexer stores events in the `logs` table with this structure:

```sql
logs (
  chain: int8,              -- Chain ID (e.g., 78651 for Nilav Testnet)
  address: bytea,           -- Contract address
  topics: _bytea,           -- Array of topics (event signature + indexed params)
  data: bytea,              -- ABI-encoded non-indexed parameters
  block_num: int8,          -- Block number
  tx_hash: bytea,           -- Transaction hash
  log_index: int8,          -- Log index within the transaction
  ...
)
```

### Event Encoding

For an event like:
```solidity
event OperatorRegistered(address indexed operator, string metadataURI);
```

The data is stored as:
- `topics[0]` = `keccak256("OperatorRegistered(address,string)")` = Event signature hash
- `topics[1]` = Operator address (padded to 32 bytes: `0x000...0c57cb`)
- `data` = ABI-encoded `metadataURI` (string)

**Key Points:**
- Indexed parameters go in `topics` (max 3 indexed params + signature = 4 topics total)
- Non-indexed parameters go in `data` (ABI-encoded)
- Addresses are left-padded with zeros to 32 bytes in topics

---

## Step-by-Step Integration

### 1. Add Event Signature

Add to `lib/indexer/events.ts`:

```typescript
export const STAKING_EVENTS = {
  OperatorRegistered: 'OperatorRegistered(address indexed operator, string metadataURI)',
  Staked: 'Staked(address indexed operator, address indexed staker, uint256 amount)',
  // Add new event here
} as const;
```

**Important:** Include the full signature with `indexed` keywords and parameter names. The `getEventSignatureHash()` helper automatically strips these before hashing:

```typescript
// Your event signature (with indexed and param names)
'OperatorRegistered(address indexed operator, string metadataURI)'

// Gets normalized to (for hashing)
'OperatorRegistered(address,string)'

// Which produces the correct event signature hash
'0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805'
```

### 2. Calculate Event Signature Hash

**✅ Recommended: Use Helper Function (Dynamic)**

```typescript
import { getEventSignatureHash } from './helpers';
import { STAKING_EVENTS } from './events';

// Dynamically calculated - no hardcoding!
const eventSignature = getEventSignatureHash(STAKING_EVENTS.OperatorRegistered);
```

**Benefits:**
- No hardcoded hashes
- Less error-prone
- Automatically updates if event signature changes
- Single source of truth in `events.ts`

**Alternative: Manual calculation (not recommended)**

Use this only for debugging or verification:

```javascript
// In Node.js with viem
const { keccak256, toBytes } = require('viem');
keccak256(toBytes('OperatorRegistered(address,string)'));
// Result: 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805
```

Or check in Conduit UI:
```sql
SELECT topics[1]
FROM logs
WHERE address = '0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46'
LIMIT 10
```

### 3. Create Query Function

Add to `lib/indexer/queries.ts`:

**Option A: Using Helper Functions (Recommended)**

```typescript
import { buildContractEventQuery, getEventSignatureHash } from './helpers';
import { STAKING_CONTRACT } from './contracts';
import { STAKING_EVENTS } from './events';
import { queryIndexer, IndexerResponse, BlockchainEvent } from './client';

// Extend BlockchainEvent for common fields (block_num, block_timestamp, tx_hash)
export interface YourEventData extends BlockchainEvent {
  param1: string;          // Event-specific field from topics or decoded data
  param2: number;          // Event-specific field from topics or decoded data
}

export async function getYourEvent(
  filterAddress: string
): Promise<IndexerResponse<YourEventData>> {
  // Use pre-configured contract to ensure filtering
  // Choose STAKING_CONTRACT or NILAV_ROUTER_CONTRACT based on your event
  const query = buildContractEventQuery(
    STAKING_CONTRACT,  // ✅ Contract address automatically included!
    'YourEvent(address,uint256)',
    {
      selectFields: ['topics[2] as param1', 'topics[3] as param2', 'block_num', 'block_timestamp', 'tx_hash'],
      indexedParams: { address: filterAddress },  // Automatically padded
      limit: 50,
    }
  );

  const result = await queryIndexer<YourEventData>(query, []);
  // Post-process results...
  return result;
}
```

**Customizing Query Options:**

The helper builder supports dynamic options:

```typescript
// Get the last 50 events (default is 1)
const query = buildOperatorEventQuery('Staked', operatorAddress, {
  limit: 50,
});

// Custom ordering
const query = buildOperatorEventQuery('Staked', operatorAddress, {
  orderBy: 'block_num ASC',  // Oldest first
  limit: 100,
});

// Custom select fields (e.g., to include additional data)
const query = buildOperatorEventQuery('Staked', operatorAddress, {
  selectFields: ['topics[2] as operator', 'topics[3] as staker', 'data', 'block_num', 'block_timestamp', 'tx_hash'],
  limit: 10,
});
```

**Option B: Manual Query (Not Recommended - Use Helpers Instead)**

```typescript
export async function getYourEvent(
  filterAddress: string
): Promise<IndexerResponse<YourEventData>> {
  // Calculate event signature hash dynamically
  const eventSignature = getEventSignatureHash(STAKING_EVENTS.YourEvent);

  // Pad address to 32 bytes for topic matching
  const paddedAddress = '0x' + '0'.repeat(24) + filterAddress.toLowerCase().slice(2);

  // ⚠️ CRITICAL: Always include contract address filter!
  const query = `
    SELECT
      topics[2] as param1,        -- First indexed param
      topics[3] as param2,        -- Second indexed param (if exists)
      block_num,
      block_timestamp,            -- Timestamp when block was mined
      tx_hash
    FROM logs
    WHERE
      chain = ${indexer.chainId}
      AND address = '${contracts.nilavTestnet.yourContract.toLowerCase()}'  -- ⚠️ REQUIRED!
      AND topics[1] = '${eventSignature}'
      AND topics[2] = '${paddedAddress}'  -- Filter by indexed param
    ORDER BY block_num DESC
    LIMIT 50
  `;

  const result = await queryIndexer<YourEventData>(query, []);

  // Post-process: Strip padding from addresses
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event) => ({
      ...event,
      param1: event.param1 ? '0x' + event.param1.replace('0x', '').slice(-40) : '',
    }));
  }

  return result;
}
```

### 4. Use in Component

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['your-event', filterAddress],
  queryFn: () => getYourEvent(filterAddress),
  refetchInterval: 30000, // Auto-refresh every 30s
});
```

---

## Response Transformation

Conduit returns data in this format:

```json
{
  "columns": [
    {"name": "param1", "pgtype": "bytea"},
    {"name": "block_num", "pgtype": "int8"}
  ],
  "rows": [
    ["0x000...value1", 1036389],
    ["0x000...value2", 1036390]
  ]
}
```

Our `client.ts` automatically transforms this to:

```json
[
  {"param1": "0x000...value1", "block_num": 1036389},
  {"param1": "0x000...value2", "block_num": 1036390}
]
```

**No action needed** - transformation happens automatically in `queryIndexer()`.

---

## Decoding Non-Indexed Parameters

For non-indexed parameters in the `data` field, you need ABI decoding:

### Example: Decode `metadataURI` from `data`

```typescript
import { decodeAbiParameters } from 'viem';

// Add data field to query
SELECT
  topics[2] as operator,
  data,              -- Add this
  block_num,
  block_timestamp,   -- Timestamp when block was mined
  tx_hash
FROM logs
WHERE ...

// Decode in post-processing
if (result.data && result.data.length > 0) {
  result.data = result.data.map((event) => {
    // Decode string from data field
    const decoded = decodeAbiParameters(
      [{ type: 'string', name: 'metadataURI' }],
      event.data as `0x${string}`
    );

    return {
      ...event,
      metadataURI: decoded[0],
    };
  });
}
```

---

## Testing in Conduit UI

Before implementing in code, test your query:

**1. Find your event:**
```sql
SELECT *
FROM logs
WHERE
  chain = 78651
  AND address = '0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46'
ORDER BY block_num DESC
LIMIT 5
```

**2. Identify the event signature hash:**
Look at `topics[0]` for your event type.

**3. Test filtering:**
```sql
SELECT
  topics,
  data,
  block_num,
  tx_hash
FROM logs
WHERE
  chain = 78651
  AND address = '0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46'
  AND topics[1] = '0xYOUR_EVENT_HASH'
ORDER BY block_num DESC
LIMIT 10
```

**4. Test topic filtering:**
```sql
-- Filter by indexed parameter (e.g., operator address)
SELECT
  topics[2] as operator,
  block_num
FROM logs
WHERE
  chain = 78651
  AND topics[1] = '0xYOUR_EVENT_HASH'
  AND topics[2] = '0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d'
LIMIT 5
```

---

## Common Patterns

### Pattern 1: Events for a Specific Address

```sql
-- Get all Staked events for operator 0x0c57cb...
SELECT
  topics[2] as operator,
  topics[3] as staker,
  block_num,
  block_timestamp::date as event_date,  -- Cast to date for daily grouping
  tx_hash
FROM logs
WHERE
  chain = 78651
  AND address = '0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46'
  AND topics[1] = '0xSTAKED_EVENT_HASH'
  AND topics[2] = '0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d'
ORDER BY block_num DESC
```

### Pattern 2: All Events for a Contract

```sql
-- Get recent activity on StakingOperators
SELECT
  topics[1] as event_signature,
  block_num,
  block_timestamp,
  tx_hash
FROM logs
WHERE
  chain = 78651
  AND address = '0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46'
ORDER BY block_num DESC
LIMIT 50
```

### Pattern 3: Combined Activity Timeline

```sql
-- Union multiple event types for a timeline
SELECT 'registered' as event_type, topics[2] as operator, block_num, block_timestamp, tx_hash
FROM logs
WHERE chain = 78651 AND topics[1] = '0xREGISTERED_HASH'

UNION ALL

SELECT 'staked' as event_type, topics[2] as operator, block_num, block_timestamp, tx_hash
FROM logs
WHERE chain = 78651 AND topics[1] = '0xSTAKED_HASH'

ORDER BY block_num DESC
LIMIT 100
```

---

## Gotchas & Tips

### ✅ DO:
- **ALWAYS filter by contract address** (most important!)
- **Use `BlockchainEvent` as base** for all event interfaces
- **Include `indexed` keywords** in event signatures - they're automatically stripped during hashing
- Always lowercase addresses when comparing
- Pad addresses to 32 bytes for topic matching
- Use `ORDER BY block_num DESC` for recent-first
- Test queries in Conduit UI first
- Strip padding from addresses in post-processing
- Use helper functions (`getEventSignatureHash`, `buildEventQuery`) for cleaner code

### ❌ DON'T:
- **DON'T query without a contract address filter** (will throw error in helpers)
- Don't use `SELECT *` (not supported by Conduit)
- Don't forget the `0x` prefix in hex values
- Don't compare unpadded addresses to topics
- Don't decode `data` without proper ABI types
- Don't query the entire chain (always scope to specific contracts)

---

## Event Interface Pattern

All blockchain events share common metadata fields. Use the `BlockchainEvent` base interface:

```typescript
import { BlockchainEvent } from '@/lib/indexer';

// Base interface (already defined in lib/indexer/queries.ts)
export interface BlockchainEvent {
  block_num: number;        // Block number where event occurred
  block_timestamp: string;  // ISO 8601 timestamp of the block
  tx_hash: string;          // Transaction hash
}

// Your event-specific interface extends it
export interface StakedEvent extends BlockchainEvent {
  operator: string;  // Event-specific field
  staker: string;    // Event-specific field
  amount: bigint;    // Event-specific field
}
```

**Benefits:**
- ✅ Type safety - compiler ensures you handle all common fields
- ✅ DRY - don't repeat block_num, block_timestamp, tx_hash definitions
- ✅ Consistency - all events have the same metadata structure
- ✅ Easy to extend - just add your event-specific fields

---

## Working with Timestamps

The `block_timestamp` field (included in `BlockchainEvent`) provides the exact time when a block was mined.

### ⚠️ Conduit Timestamp Format Quirk

**Important:** Conduit returns timestamps in a non-standard format that requires normalization:

```
Conduit format:  "2025-12-12 16:33:18.0 +00:00:00"
Standard ISO:    "2025-12-12T16:33:18.0+00:00"
```

The issue: timezone has extra `:00` seconds (`+00:00:00` instead of `+00:00`)

**Solution:** Use our `normalizeConduitTimestamp()` and `formatTimeAgo()` helpers from `lib/indexer/formatters.ts` - they automatically handle this conversion.

```typescript
import { formatTimeAgo, formatFullDate } from '@/lib/indexer';

// Automatically parses Conduit's weird format
const relativeTime = formatTimeAgo(event.block_timestamp);
// Returns: "2 hours ago"

const fullDate = formatFullDate(event.block_timestamp);
// Returns: "December 12, 2025 at 4:33 PM"
```

### PostgreSQL Timestamp Functions

You can use PostgreSQL's powerful timestamp functions in your queries:

### Timestamp Casting and Formatting

```sql
-- Cast to date (removes time component)
SELECT block_timestamp::date as event_date FROM logs;

-- Extract specific parts
SELECT
  date_trunc('day', block_timestamp) as day,
  date_trunc('hour', block_timestamp) as hour,
  extract(epoch from block_timestamp) as unix_timestamp
FROM logs;

-- Filter by time range
SELECT * FROM logs
WHERE block_timestamp > NOW() - INTERVAL '7 days'
AND block_timestamp < NOW();

-- Group by day for activity charts
SELECT
  block_timestamp::date as day,
  count(*) as event_count
FROM logs
WHERE chain = 78651 AND address = '0x...'
GROUP BY block_timestamp::date
ORDER BY day DESC;
```

### Frontend Timestamp Formatting

```typescript
// Format relative time (e.g., "2 hours ago")
const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// Format as full date
const fullDate = new Date(event.block_timestamp).toLocaleString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
```

---

## Performance Tips

1. **Limit results**: Always use `LIMIT` to avoid large responses
2. **Use `fromBlock` filter**: Query events only after a specific block (e.g., registration block)
3. **Index by block range**: Add `AND block_num >= X` for events after a certain point
4. **Filter by time**: Use `block_timestamp > NOW() - INTERVAL '7 days'` for recent events
5. **Use pagination**: Track `cursor` from response for pagination
6. **Cache queries**: Use React Query's caching (already implemented)
7. **Batch similar queries**: Combine with `UNION ALL` when possible

### Using Registration Block as Starting Point

**Best Practice:** For operator-specific activity, use the registration block as the starting point for all other event queries. This significantly improves performance by avoiding scanning irrelevant blocks.

```typescript
// Step 1: Get registration event (no fromBlock needed)
const { data: regData } = useQuery({
  queryKey: ['operator-registration', operatorAddress],
  queryFn: () => getOperatorRegistration(operatorAddress),
});

// Get the registration block
const registrationBlock = regData?.data?.[0]?.block_num;

// Step 2: Query other events ONLY from registration block onwards
const { data: deactivationData } = useQuery({
  queryKey: ['operator-deactivation', operatorAddress, registrationBlock],
  queryFn: () => getOperatorDeactivation(operatorAddress, registrationBlock),
  enabled: registrationBlock !== undefined, // Dependent query - wait for registration
});
```

**Why this matters:**
- ✅ **Performance**: Only scans blocks where the operator existed
- ✅ **Logic**: Operator can't have events before they registered
- ✅ **Cost**: Reduces indexer API usage
- ✅ **Accuracy**: Ensures you don't get events from previous operator with same address

**SQL Example:**
```sql
-- Without fromBlock (scans all blocks)
SELECT * FROM logs WHERE chain = 78651 AND address = '0x...' AND topics[1] = '0x...'

-- With fromBlock (only scans from registration onwards)
SELECT * FROM logs WHERE chain = 78651 AND address = '0x...' AND topics[1] = '0x...'
AND block_num >= 1036389  -- Registration block
```

---

## Using Activity Components

We've created reusable components to make it easy to display events in a timeline:

### Quick Start

```typescript
import { ActivityTimeline, ActivityEvent, getEventConfig } from '@/components/activity';
import { formatTimeAgo } from '@/lib/indexer';

function MyActivityFeed() {
  const events = [...]; // Array of events from indexer

  return (
    <ActivityTimeline title="Recent Activity">
      {events.map((event) => {
        const config = getEventConfig('operator_registered'); // or 'staked', 'htx_assigned', etc.

        return (
          <ActivityEvent
            key={event.tx_hash}
            icon={config.icon}
            title={config.title}
            description={config.descriptionTemplate}
            timeAgo={formatTimeAgo(event.block_timestamp)}
            txHash={event.tx_hash}
            variant={config.variant}
          />
        );
      })}
    </ActivityTimeline>
  );
}
```

### Adding New Event Types

1. **Add event type to `eventConfig.ts`:**

```typescript
export const EVENT_CONFIGS: Record<EventType, EventConfig> = {
  // ... existing events
  my_new_event: {
    icon: '🚀',
    title: 'My Event',
    variant: 'success',
    descriptionTemplate: 'Something happened with {{amount}} tokens',
  },
};
```

2. **Use in your component:**

```typescript
const config = getEventConfig('my_new_event');
const description = formatEventDescription(config.descriptionTemplate, {
  amount: '1000',
});
```

### Component Structure

```
components/activity/
├── ActivityFeed.tsx       - Example: Shows operator registration
├── ActivityEvent.tsx      - Reusable event card component
├── ActivityTimeline.tsx   - Timeline container component
├── eventConfig.ts         - Event type configurations (icons, titles, variants)
└── index.ts               - Public exports
```

---

## Examples from Codebase

See working examples:
- `lib/indexer/queries.ts` - Query functions
- `lib/indexer/formatters.ts` - Timestamp formatting
- `components/activity/ActivityFeed.tsx` - Activity timeline implementation
- `components/activity/eventConfig.ts` - Event type configurations
