# Stats Queries Guide

Guide for building statistics queries using the Conduit Indexer.

**Last Updated:** December 12, 2024

---

## Overview

This guide documents what SQL features work in Conduit's indexer and provides patterns for building:
1. **Node-specific stats** - Metrics for a single node address
2. **Network-wide stats** - Aggregated metrics across all nodes

---

## ⚠️ CRITICAL: Always Filter by Contract Address

**NEVER query the entire chain!** Every query MUST include a contract address filter.

```sql
-- ✅ CORRECT - Filters by contract address
SELECT COUNT(1) FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0x...

-- ❌ WRONG - Queries entire chain (expensive and slow!)
SELECT COUNT(1) FROM logs
WHERE topics[1] = 0x...
```

**Valid contract addresses:**
- **NilAVRouter** (HTX events): `0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf`
- **StakingOperators** (staking events): `0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46`

---

## Supported SQL Features

### ✅ What Works

| Feature | Example | Use Case |
|---------|---------|----------|
| `COUNT(1)` | `SELECT COUNT(1)` | Count rows |
| `COUNT(DISTINCT col)` | `COUNT(DISTINCT topics[2])` | Count unique values |
| `SUM(expression)` | `SUM(CASE WHEN ...)` | Totals, conditional counts |
| `MIN(col)` / `MAX(col)` | `MIN(block_num)`, `MAX(block_num)` | Range calculations |
| `GROUP BY` | `GROUP BY topics[3]` | Per-entity aggregations |
| `ORDER BY` | `ORDER BY count DESC` | Sorting results |
| `LIMIT` | `LIMIT 10` | Pagination |
| `CASE WHEN` | `CASE WHEN data = 0x...01 THEN 1 ELSE 0 END` | Conditional logic |
| Date casting | `block_timestamp::date` | Time-series grouping |
| Subqueries | `SELECT ... FROM (SELECT ...)` | Complex queries |
| `HAVING` | `HAVING COUNT(1) > 10` | Filter after GROUP BY |

### ❌ What Doesn't Work

| Feature | Error | Workaround |
|---------|-------|------------|
| `COUNT(*)` | "wild card function args not supported" | Use `COUNT(1)` instead |
| `AVG(col)` | "'avg' function not supported" | Calculate on client: `SUM(col) / COUNT(1)` |
| `STDDEV()` | Not tested, likely unsupported | Calculate on client |
| Derived tables in `FROM` (subqueries with alias) | "`(SELECT ...) AS alias` not supported" | Use filtered aggregates (`CASE WHEN`) in a single SELECT or scalar subqueries |
| `WITH` / CTEs | "with not supported" | Use nested subqueries / CROSS JOINs instead |
| `LIKE` on `data` (some deployments) | "LIKE not supported" | Fetch rows and decode client-side; or use equality filters |
| Multiple statements | "query must be exactly 1 sql statement" | Send one SQL statement per request; split multi-part examples into separate calls |
| Window functions | Not tested | Use subqueries or client-side |

---

## Contract & Event Reference

### Contract Addresses
```sql
-- NilAVRouter (HTX events)
address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf

-- StakingOperators (staking events)
address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
```

### Event Signature Hashes
```sql
-- HTX Events
HTXAssigned:  0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
HTXResponded: 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca

-- Staking Events
OperatorRegistered: 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805
StakedTo:           0xf0e819536818562378109499117dfd7b576bfc6fca3576e838f38b732a6b5143
```

### Event Data Structure
```
HTXAssigned(bytes32 indexed htxId, address indexed node)
├─ topics[1] → event signature hash
├─ topics[2] → htxId (bytes32)
└─ topics[3] → node address (padded to 32 bytes)

HTXResponded(bytes32 indexed htxId, address indexed node, bool result)
├─ topics[1] → event signature hash
├─ topics[2] → htxId (bytes32)
├─ topics[3] → node address (padded to 32 bytes)
└─ data      → result (bool: 0x...01 = true, 0x...00 = false)
```

---

## Node-Specific Stats

Queries for analyzing a single node's performance.

### 1. Total HTX Assignments

```sql
SELECT COUNT(1) as total_assignments
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
  AND topics[3] = 0x000000000000000000000000YOUR_NODE_ADDRESS
```

**Example Result:**
```json
{ "total_assignments": 110 }
```

---

### 2. Total HTX Responses

```sql
SELECT COUNT(1) as total_responses
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
  AND topics[3] = 0x000000000000000000000000YOUR_NODE_ADDRESS
```

---

### 3. Success Rate

```sql
SELECT
  COUNT(1) as total_responses,
  SUM(CASE WHEN data = 0x0000000000000000000000000000000000000000000000000000000000000001 THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN data = 0x0000000000000000000000000000000000000000000000000000000000000000 THEN 1 ELSE 0 END) as failed
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
  AND topics[3] = 0x000000000000000000000000YOUR_NODE_ADDRESS
```

**Client-side calculation:**
```typescript
const successRate = (successful / total_responses) * 100;
```

**Example Result:**
```json
{
  "total_responses": 100,
  "successful": 47,
  "failed": 53
}
// Success rate: 47%
```

---

### 4. Response Rate (Assignments vs Responses)

```sql
SELECT
  a.assigned,
  COALESCE(r.responded, 0) as responded
FROM (
  SELECT COUNT(1) as assigned
  FROM logs
  WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
    AND topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
    AND topics[3] = 0x000000000000000000000000YOUR_NODE_ADDRESS
) a
LEFT JOIN (
  SELECT COUNT(1) as responded
  FROM logs
  WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
    AND topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
    AND topics[3] = 0x000000000000000000000000YOUR_NODE_ADDRESS
) r ON true
```

**Client-side calculation:**
```typescript
const responseRate = (responded / assigned) * 100;
```

---

### 5. Activity Timeline (Daily)

```sql
SELECT
  block_timestamp::date as date,
  COUNT(1) as assignments
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
  AND topics[3] = 0x000000000000000000000000YOUR_NODE_ADDRESS
GROUP BY block_timestamp::date
ORDER BY date DESC
LIMIT 30
```

**Example Result:**
```json
[
  { "date": "2025-12-12", "assignments": 25 },
  { "date": "2025-12-11", "assignments": 18 },
  { "date": "2025-12-10", "assignments": 31 }
]
```

---

### 6. Block Range Activity

```sql
SELECT
  COUNT(1) as total_events,
  MIN(block_num) as first_block,
  MAX(block_num) as last_block,
  MAX(block_num) - MIN(block_num) as block_range
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
  AND topics[3] = 0x000000000000000000000000YOUR_NODE_ADDRESS
```

**Client-side calculation:**
```typescript
const avgBlocksPerEvent = block_range / total_events;
```

---

### 7. Unique HTXs Verified

```sql
SELECT
  COUNT(DISTINCT topics[2]) as unique_htxs
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
  AND topics[3] = 0x000000000000000000000000YOUR_NODE_ADDRESS
```

---

## Network-Wide Stats

Queries for analyzing the entire verification network.

### 1. Total Network Activity

```sql
SELECT
  COUNT(1) as total_assignments,
  COUNT(DISTINCT topics[2]) as unique_htxs,
  COUNT(DISTINCT topics[3]) as active_nodes
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
```

**Example Result:**
```json
{
  "total_assignments": 2217,
  "unique_htxs": 428,
  "active_nodes": 18
}
// Avg 5.2 nodes verify each HTX
```

---

### 2. Network Success Rate

```sql
SELECT
  COUNT(1) as total_responses,
  SUM(CASE WHEN data = 0x0000000000000000000000000000000000000000000000000000000000000001 THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN data = 0x0000000000000000000000000000000000000000000000000000000000000000 THEN 1 ELSE 0 END) as failed
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
```

**Real Data (Dec 12, 2024):**
```json
{
  "total_responses": 1935,
  "successful": 648,
  "failed": 1287
}
// Network success rate: 33.5%
```

---

### 3. Top Nodes by Activity (Leaderboard)

```sql
SELECT
  topics[3] as node_address,
  COUNT(1) as htx_count
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
GROUP BY topics[3]
ORDER BY htx_count DESC
LIMIT 10
```

**Example Result:**
```json
[
  { "node_address": "0x000...41d2", "htx_count": 217 },
  { "node_address": "0x000...56a6", "htx_count": 204 },
  { "node_address": "0x000...f2ff", "htx_count": 179 }
]
```

---

### 4. Top Nodes by Success Rate

```sql
SELECT
  topics[3] as node,
  COUNT(1) as total_responses,
  SUM(CASE WHEN data = 0x0000000000000000000000000000000000000000000000000000000000000001 THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN data = 0x0000000000000000000000000000000000000000000000000000000000000000 THEN 1 ELSE 0 END) as failed
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
GROUP BY topics[3]
HAVING COUNT(1) > 50
ORDER BY successful DESC
LIMIT 10
```

**Client-side calculation:**
```typescript
const nodesWithSuccessRate = results.map(node => ({
  ...node,
  success_rate: (node.successful / node.total_responses) * 100
})).sort((a, b) => b.success_rate - a.success_rate);
```

**Real Data (Top 3 nodes):**
```json
[
  { "node": "0x000...41d2", "total": 218, "successful": 103, "failed": 115, "success_rate": 47.2 },
  { "node": "0x000...56a6", "total": 205, "successful": 84, "failed": 121, "success_rate": 41.0 },
  { "node": "0x000...1584", "total": 167, "successful": 43, "failed": 124, "success_rate": 25.7 }
]
```

---

### 5. Network Activity Over Time

```sql
SELECT
  block_timestamp::date as date,
  COUNT(1) as htx_assignments
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
GROUP BY block_timestamp::date
ORDER BY date DESC
LIMIT 30
```

**Real Data:**
```json
[
  { "date": "2025-12-12", "htx_assignments": 581 },
  { "date": "2025-12-11", "htx_assignments": 21 },
  { "date": "2025-12-10", "htx_assignments": 9 },
  { "date": "2025-12-05", "htx_assignments": 1605 }
]
```

---

### 6. Total Registered Operators

```sql
SELECT COUNT(1) as total_operators
FROM logs
WHERE address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
  AND topics[1] = 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805
```

---

### 7. Active vs Registered Nodes

```sql
SELECT
  r.total_registered,
  a.total_active
FROM (
  SELECT COUNT(DISTINCT topics[2]) as total_registered
  FROM logs
  WHERE address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
    AND topics[1] = 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805
) r
CROSS JOIN (
  SELECT COUNT(DISTINCT topics[3]) as total_active
  FROM logs
  WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
    AND topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
) a
```

**Client-side calculation:**
```typescript
const activationRate = (total_active / total_registered) * 100;
```

---

## Common Patterns

### Pattern 1: Percentage Calculations

**Never calculate percentages in SQL** - Conduit doesn't support `AVG()` or division in SELECT.

```typescript
// ❌ Don't do this (won't work)
SELECT (successful / total) * 100 as success_rate

// ✅ Do this instead
const stats = await queryIndexer(sql);
const successRate = (stats.successful / stats.total) * 100;
```

---

### Pattern 2: Filtering by Node

**Always pad addresses to 32 bytes** for topic matching:

```typescript
import { padAddressTo32Bytes } from '@/lib/indexer/helpers';

const paddedNode = padAddressTo32Bytes(nodeAddress);
// 0x0c57cb... → 0x0000000000000000000000000c57cb...

const query = `
  WHERE topics[3] = ${paddedNode}
`;
```

---

### Pattern 3: Time-Based Queries

Use `::date` for daily aggregation:

```sql
-- Daily aggregation
GROUP BY block_timestamp::date

-- Weekly aggregation (calculate on client)
-- Fetch daily data, then group by week in TypeScript
```

---

### Pattern 4: Conditional Aggregation

Use `SUM(CASE WHEN ...)` for success/fail counts:

```sql
-- Success count
SUM(CASE WHEN data = 0x0000...0001 THEN 1 ELSE 0 END)

-- Failure count
SUM(CASE WHEN data = 0x0000...0000 THEN 1 ELSE 0 END)

-- Or use LIKE for partial matching
SUM(CASE WHEN data LIKE '%01' THEN 1 ELSE 0 END)
```

---

### Pattern 5: Response Stripping

**Strip padding from addresses in results:**

```typescript
// Addresses in topics are 32 bytes, need to strip to 20 bytes
const cleanAddress = '0x' + paddedAddress.replace('0x', '').slice(-40);
```

---

## Query Performance Tips

### 1. ⚠️ ALWAYS Filter by Contract Address (REQUIRED!)

**Every query MUST include a contract address filter** to avoid scanning the entire chain:

```sql
-- FIRST filter in WHERE clause must be contract address
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf  -- REQUIRED!
  AND topics[1] = 0x...
  AND ...
```

**Why?** Without this filter, the indexer scans ALL events across ALL contracts on the chain, which is:
- Extremely slow
- Expensive
- Returns incorrect/irrelevant data

### 2. Use Block Range Filters

If you know when a node registered, filter from that block:

```sql
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf  -- Contract filter FIRST
  AND topics[1] = 0x...
  AND block_num >= 1036389  -- Then add block range filter
```

### 3. Limit Result Sets

Always use `LIMIT` - don't fetch unbounded data:

```sql
LIMIT 100  -- For lists
LIMIT 1    -- For single record checks
```

### 4. Use HAVING for Post-Aggregation Filters

Filter after `GROUP BY` using `HAVING`:

```sql
GROUP BY topics[3]
HAVING COUNT(1) > 50  -- Only nodes with >50 responses
```

---

## Implementation Checklist

When building stats queries:

- [ ] **⚠️ MOST IMPORTANT: Filter by contract address** (NEVER query entire chain!)
  - NilAVRouter: `0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf`
  - StakingOperators: `0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46`
- [ ] Use `COUNT(1)` not `COUNT(*)`
- [ ] Calculate averages/percentages on client, not in SQL
- [ ] Pad node addresses to 32 bytes for topic matching
- [ ] Strip padding from addresses in results
- [ ] Use block range filters when possible
- [ ] Always use `LIMIT` to cap result size
- [ ] Handle `0x...01` (true) and `0x...00` (false) for bool data
- [ ] Use `::date` for daily time-series
- [ ] Use `SUM(CASE WHEN ...)` for conditional counts

---

## Real-World Examples

### Example 1: Node Dashboard Stats

```typescript
// Fetch all stats for a node in parallel
const [assignments, responses, successData] = await Promise.all([
  queryIndexer(assignmentsQuery),
  queryIndexer(responsesQuery),
  queryIndexer(successRateQuery)
]);

const stats = {
  totalAssignments: assignments.data[0].total,
  totalResponses: responses.data[0].total,
  responseRate: (responses.data[0].total / assignments.data[0].total) * 100,
  successRate: (successData.data[0].successful / successData.data[0].total) * 100,
  failed: successData.data[0].failed,
};
```

### Example 2: Network Leaderboard

```typescript
const result = await queryIndexer(topNodesBySuccessQuery);

const leaderboard = result.data
  .map(node => ({
    address: stripAddressPadding(node.node),
    total: node.total_responses,
    successful: node.successful,
    failed: node.failed,
    successRate: (node.successful / node.total_responses) * 100,
  }))
  .sort((a, b) => b.successRate - a.successRate)
  .slice(0, 10);
```

---

## Next Steps

1. **Create query helper functions** in `lib/indexer/stats.ts`
2. **Build API routes** at `/api/stats/node/[address]` and `/api/stats/network`
3. **Create React hooks** like `useNodeStats(address)` and `useNetworkStats()`
4. **Build UI components** for stats dashboards

---

## Reference

- **Integration Guide:** [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Event Definitions:** [events.ts](./events.ts)
- **Query Helpers:** [helpers.ts](./helpers.ts)
- **Contract Config:** [../config/index.ts](../config/index.ts)
