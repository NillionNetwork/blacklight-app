# Cross-Node Stats (nilUV Router + StakingOperators)

Single-statement queries for network-wide views. Keep Conduit constraints in mind: no CTEs, no derived tables in FROM, one statement per request.

**Contracts:**
- NilAVRouter (HTX): `0x34ed5bcd598619f7aad6e3d9264c38ceb4cd1edf`
- StakingOperators: `0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46`

**Event signature hashes:**
- HTXAssigned: `0xe5e107df65b326826f1dde51ad91b9c54cabc5c21514f682765364fa985e3f05`
- HTXResponded: `0x7fe8ff9b88cfa25a5dcd699b4f56976e21c9f5448bc41f0536920009b74261ca`
- OperatorRegistered: `0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805`
- OperatorDeactivated: `0x07645aa614e7e509e4e09ca3dc57980735884f4b94a7172817c55d1472e36cad`
- StakedTo: `0xf0e819536818562378109499117dfd7b576bfc6fca3576e838f38b732a6b5143`

---

## 1) Active Nodes (registered, not deactivated)

Counts nodes whose latest registration is more recent than any deactivation. No router-activity requirement. Single statement; uses scalar subqueries instead of CTEs/derived tables.

```sql
SELECT COUNT(DISTINCT l.topics[2]) AS active_nodes
FROM logs l
WHERE l.address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
  AND l.topics[1] = 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805 -- OperatorRegistered
  AND l.block_num = (
    SELECT MAX(r.block_num)
    FROM logs r
    WHERE r.address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
      AND r.topics[1] = 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805
      AND r.topics[2] = l.topics[2]
  )
  AND NOT EXISTS (
    SELECT 1 FROM logs d
    WHERE d.address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
      AND d.topics[1] = 0x07645aa614e7e509e4e09ca3dc57980735884f4b94a7172817c55d1472e36cad -- OperatorDeactivated
      AND d.topics[2] = l.topics[2]
      AND d.block_num > l.block_num
  );
```

- Add a router-activity EXISTS if you want to require recent or any activity.

---

## 2) Unique HTX IDs (network-wide)

Counts distinct HTX IDs seen anywhere on the router (assigned vs responded).

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

---

## 3) Total Currently Staked (network-wide)

This depends on the ABI for `StakedTo`. Conduit doesn’t expose ABI decoding, so you need to decode `data` client-side or rely on numeric casts if supported.

**Conduit often disallows SUBSTR/LIKE; simplest path is client-side decode.**

1) Fetch rows to decode client-side (keep this tight to avoid huge payloads; adjust LIMIT and/or add a block filter):
```sql
SELECT block_num, block_timestamp, topics, data
FROM logs
WHERE address = 0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
  AND topics[1] = 0xf0e819536818562378109499117dfd7b576bfc6fca3576e838f38b732a6b5143
ORDER BY block_num DESC
LIMIT 100;
```

2) Client-side: decode `data` as `uint256 amount` (or your ABI), treat as +stake. If there’s a dedicated Unstaked/withdraw event, subtract those amounts. Sum to get current total staked.

> If you discover a Conduit-safe numeric cast (e.g., `data::numeric` without SUBSTR) that works in your environment, swap it in; otherwise stick to client-side decode.
> To keep responses small, combine LIMIT with a block filter: `AND block_num >= (SELECT MAX(block_num)-N FROM logs WHERE address = ...)`.
