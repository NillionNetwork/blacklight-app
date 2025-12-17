# Single Node Stats (nilUV Router + StakingOperators)

Concrete SQL you can run in Conduit for one node.

**Node:** `0x0c57cb3432f3a493ecf3f465260139a2edbc753d`  
**Padded:** `0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d`

**Contracts:**
- NilAVRouter (HTX): `0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf`
- StakingOperators: `0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46`

**Event signature hashes:**
- HTXAssigned: `0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05`
- HTXResponded: `0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca`
- OperatorRegistered: `0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805`
- StakedTo: `0xf0e819536818562378109499117dfd7b576bfc6fca3576e838f38b732a6b5143`

> Reminder: always filter by contract address first; use `COUNT(1)`; calculate percentages client-side.

---

## Registration History (re-register aware)

```sql
SELECT
  MIN(block_num) AS first_registration_block,
  MAX(block_num) AS latest_registration_block,
  COUNT(1) AS registration_events
FROM logs
WHERE address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
  AND topics[1] = 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805
  AND topics[2] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d;
```

Use `latest_registration_block` as the start for “current” tenure; `registration_events > 1` implies re-registrations.

---

## Current Tenure (since last registration)

```sql
SELECT
  MAX(CASE WHEN address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
            AND topics[1] = 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805
            AND topics[2] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
       THEN block_num END) AS reg_block,
  MAX(CASE WHEN address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
            AND topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
            AND topics[1] IN (
              0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05,
              0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
            )
       THEN block_num END) AS last_activity_block,
  (MAX(CASE WHEN address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
            AND topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
            AND topics[1] IN (
              0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05,
              0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
            )
       THEN block_num END)
   -
   MAX(CASE WHEN address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
            AND topics[1] = 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805
            AND topics[2] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
       THEN block_num END)) AS active_block_span
FROM logs
WHERE (
  address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
  AND topics[1] = 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805
  AND topics[2] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
) OR (
  address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
  AND topics[1] IN (
    0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05,
    0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
  )
);

> Interpret `active_block_span` by multiplying by your block time (e.g., ~2s → seconds; divide by 3600 for hours). Example: 5,161 blocks at 2s ≈ 2.9 hours; at 12s ≈ 17.2 hours. If `last_activity_block` is far from the tip, the node hasn’t acted recently.
```

---

## Daily Activity (for streaks)

```sql
SELECT
  block_timestamp::date AS date,
  COUNT(1) AS assignments,
  SUM(CASE WHEN topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca THEN 1 ELSE 0 END) AS responses
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
  AND topics[1] IN (
    0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05,
    0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
  )
GROUP BY block_timestamp::date
ORDER BY date DESC
LIMIT 90;
```

Compute current and longest streaks on the client by walking the date list.

---

## Assignments vs Responses (misses)

```sql
SELECT
  assignments.total_assignments,
  COALESCE(responses.total_responses, 0) AS total_responses,
  (assignments.total_assignments - COALESCE(responses.total_responses, 0)) AS open_assignments
FROM (
  SELECT COUNT(1) AS total_assignments
  FROM logs
  WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
    AND topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
    AND topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
) assignments
LEFT JOIN (
  SELECT COUNT(1) AS total_responses
  FROM logs
  WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
    AND topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
    AND topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
) responses ON true;
```

---

## Open Assignments Older Than N Blocks

```sql
-- Adjust 500 to your staleness threshold
SELECT COUNT(1) AS stale_open_assignments
FROM logs a
WHERE a.address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND a.topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
  AND a.topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
  AND a.block_num < (
    SELECT MAX(block_num) - 500
    FROM logs
    WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  )
  AND NOT EXISTS (
    SELECT 1 FROM logs r
    WHERE r.address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
      AND r.topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
      AND r.topics[2] = a.topics[2] -- same htxId
      AND r.topics[3] = a.topics[3] -- same node
  );
```

---

## Response Latency (blocks)

```sql
SELECT
  a.topics[2] AS htx_id,
  MIN(r.block_num - a.block_num) AS min_blocks_to_respond,
  MAX(r.block_num - a.block_num) AS max_blocks_to_respond
FROM logs a
JOIN logs r
  ON r.address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND r.topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
  AND r.topics[2] = a.topics[2] -- same htxId
  AND r.topics[3] = a.topics[3] -- same node
WHERE a.address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND a.topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05
  AND a.topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
GROUP BY a.topics[2]
ORDER BY min_blocks_to_respond ASC
LIMIT 50;
```

Compute median/p95 client-side from the block deltas.

---

## First-Responder Rate

```sql
SELECT COUNT(1) AS first_response_count
FROM logs r
WHERE r.address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND r.topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
  AND r.topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
  AND r.block_num = (
    SELECT MIN(r2.block_num)
    FROM logs r2
    WHERE r2.address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
      AND r2.topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
      AND r2.topics[2] = r.topics[2] -- same htxId
  );
```

You can divide `first_response_count` by total HTXs responded to (from earlier queries) on the client to get a percentage.

---

## Stake Activity Snapshot

Some Conduit deployments disallow `LIKE` on `data`, and the API requires a single SQL statement. Run these separately and decode amounts/sign client-side from `data` based on your ABI.

```sql
-- A) Quick aggregate (count + first/last)
SELECT
  COUNT(1) AS stake_events,
  MIN(block_num) AS first_stake_block,
  MAX(block_num) AS last_stake_block
FROM logs
WHERE address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
  AND topics[1] = 0xf0e819536818562378109499117dfd7b576bfc6fca3576e838f38b732a6b5143
  AND topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d;
```

```sql
-- B) Sample rows to decode client-side (amount/sign)
SELECT block_num, block_timestamp, data, topics
FROM logs
WHERE address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
  AND topics[1] = 0xf0e819536818562378109499117dfd7b576bfc6fca3576e838f38b732a6b5143
  AND topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
ORDER BY block_num DESC
LIMIT 50;
```

Decode `data` client-side to determine stake vs unstake and amounts, then compute net balance and volatility in code.

---

## Unique HTX IDs (per node)

Count distinct HTXs this node touched, split by assignment vs response (single statement).

```sql
SELECT
  COUNT(DISTINCT CASE WHEN topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05 THEN topics[2] END) AS unique_htx_assignments,
  COUNT(DISTINCT CASE WHEN topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca THEN topics[2] END) AS unique_htx_responses
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[3] = 0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d
  AND topics[1] IN (
    0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05,
    0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
  );

---

## Unique HTX IDs (network-wide)

Count distinct HTXs seen anywhere on the router, split by assignments vs responses (single statement).

```sql
SELECT
  COUNT(DISTINCT CASE WHEN topics[1] = 0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05 THEN topics[2] END) AS unique_htx_assignments,
  COUNT(DISTINCT CASE WHEN topics[1] = 0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca THEN topics[2] END) AS unique_htx_responses
FROM logs
WHERE address = 0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf
  AND topics[1] IN (
    0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05,
    0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca
  );
```
```
