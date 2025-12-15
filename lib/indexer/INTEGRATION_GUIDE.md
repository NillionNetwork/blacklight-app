# Conduit Indexer Integration Guide

Quick reference for adding new blockchain event queries.

---

## Architecture

**All indexer queries go through `/api/indexer` (server-side proxy):**

```
Client → /api/indexer → Conduit Indexer API
```

✅ API key stays server-side (never exposed to clients)
✅ Set `INDEXER_API_KEY` in `.env.local` (NOT `NEXT_PUBLIC_`)

---

## Adding a New Event (4 Steps)

### 1. Add Event Signature

`lib/indexer/events.ts`:
```typescript
export const STAKING_EVENTS = {
  YourNewEvent: 'YourNewEvent(address indexed param1, uint256 param2)',
} as const;
```

**Include `indexed` keywords** - automatically stripped during hashing.

---

### 2. Define Type Interface

`lib/indexer/queries.ts`:
```typescript
export interface YourNewEventData extends BlockchainEvent {
  param1: string;  // topics[2]
  param2: bigint;  // from data field
}
```

All events extend `BlockchainEvent` (block_num, block_timestamp, tx_hash).

---

### 3. Create Query Function

Choose helper based on event structure:

**Option A: Operator in topics[2]**
→ Use `buildOperatorEventQuery`
→ **Example:** `getOperatorRegistration()` in `queries.ts`

**Option B: Staker in topics[2]**
→ Use `buildStakerEventQuery`
→ **Example:** `getStakedEvents()` in `queries.ts`

**Option C: Node in topics[3] (HTX events)**
→ Use `buildRouterEventQuery`
→ **Example:** `getHTXAssignments()` in `queries.ts`

---

### 4. Use in Component

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['your-event', address],
  queryFn: () => getYourEvent(address),
});
```

---

## Event Data Structure

```
Event: YourEvent(address indexed param1, address indexed param2, uint256 value)

Stored as:
├─ topics[1] → event signature hash (auto-calculated)
├─ topics[2] → param1 (padded to 32 bytes)
├─ topics[3] → param2 (padded to 32 bytes)
└─ data      → ABI-encoded value (non-indexed params)
```

**Max 3 indexed params** (+ signature = 4 topics total)

---

## Helper Functions

### `buildOperatorEventQuery(eventName, operatorAddress, options)`
For events where operator is in topics[2].

**Options:**
- `selectFields` - Default: topics[2], block_num, block_timestamp, tx_hash
- `limit` - Default: 1
- `orderBy` - Default: block_num DESC
- `fromBlock` - Optional performance optimization

### `buildStakerEventQuery(eventName, stakerAddress, options)`
For events where staker is in topics[2].

### `buildRouterEventQuery(eventName, nodeAddress, options)`
For HTX events where node is in topics[3].

---

## Common Patterns

### Pattern 1: Use Registration Block as Starting Point

For operator-specific queries, fetch registration block first:

```typescript
// Step 1: Get registration block
const registrationBlock = regData?.data?.[0]?.block_num;

// Step 2: Query other events from registration onwards
queryFn: () => getOtherEvent(address, registrationBlock)
```

**Why:** Only scans blocks where operator existed (performance + accuracy).

**Example:** See `ActivityFeed.tsx` - HTX queries use registration block.

---

### Pattern 2: Decode Non-Indexed Parameters

For data in the `data` field:
```typescript
import { decodeAbiParameters } from 'viem';

const decoded = decodeAbiParameters(
  [{ type: 'uint256', name: 'amount' }],
  event.data as `0x${string}`
);
```

**Example:** See `getHTXResponses()` - decodes bool result from data field.

---

### Pattern 3: Group Multiple Events

For entity lifecycle (e.g., HTX assignment + response):
- Fetch both event types
- Group by common ID (e.g., htxId)
- Combine into lifecycle object

**Example:** See `ActivityFeed.tsx` - groups HTXAssigned + HTXResponded.

---

## Testing Queries

### In Conduit UI

**1. Find event signature hash:**
```sql
SELECT topics[1], block_num, tx_hash
FROM logs
WHERE chain = 78651
  AND address = '0xYOUR_CONTRACT_ADDRESS'
ORDER BY block_num DESC
LIMIT 10
```

**2. Test filtering:**
```sql
SELECT topics[2] as param1, block_num, tx_hash
FROM logs
WHERE chain = 78651
  AND address = '0xYOUR_CONTRACT_ADDRESS'
  AND topics[1] = '0xEVENT_SIGNATURE_HASH'
  AND topics[2] = '0x000000000000000000000000YOUR_ADDRESS'
ORDER BY block_num DESC
LIMIT 5
```

---

## Timestamp Formatting

```typescript
import { formatTimeAgo, formatFullDate } from '@/lib/indexer';

formatTimeAgo(event.block_timestamp);   // "2 hours ago"
formatFullDate(event.block_timestamp);  // "December 12, 2025 at 4:33 PM"
```

**Note:** Helpers automatically handle Conduit's non-standard timestamp format.

---

## Checklist for New Events

- [ ] Add signature to `lib/indexer/events.ts`
- [ ] Create interface extending `BlockchainEvent` in `queries.ts`
- [ ] Choose correct helper function
- [ ] Create query function (see existing examples)
- [ ] Post-process: strip address padding (if needed)
- [ ] Decode `data` field (if event has non-indexed params)
- [ ] Test query in Conduit UI first
- [ ] Use `fromBlock` for performance

---

## Quick Reference

### Files to Edit

```
lib/indexer/
├── events.ts    → Add event signature
└── queries.ts   → Add interface + query function
```

### Available Helpers

```typescript
// Event signature hashing
getEventSignatureHash(STAKING_EVENTS.YourEvent)

// Query builders
buildOperatorEventQuery(eventName, operatorAddress, options)
buildStakerEventQuery(eventName, stakerAddress, options)
buildRouterEventQuery(eventName, nodeAddress, options)

// Formatting
formatTimeAgo(timestamp)
formatFullDate(timestamp)
padAddressTo32Bytes(address)
```

---

## Examples in Codebase

**Reference these for implementation patterns:**

| Pattern | Example Function | File |
|---------|-----------------|------|
| Single event query | `getOperatorRegistration()` | `queries.ts` |
| Staker-indexed events | `getStakedEvents()` | `queries.ts` |
| Router events (topics[3]) | `getHTXAssignments()` | `queries.ts` |
| Decode data field | `getHTXResponses()` | `queries.ts` |
| Event lifecycle grouping | `ActivityFeed` component | `components/activity/` |
| Post-processing addresses | All query functions | `queries.ts` |

**Pro tip:** Copy an existing query function that's similar to your event structure, then modify it.
