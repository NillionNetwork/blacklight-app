/**
 * Event signatures for Conduit Indexer queries
 *
 * These signatures are used to query specific events from the blockchain.
 * Format: EventName(type1 indexed param1, type2 param2, ...)
 */

// =============================================================================
// HeartbeatManager Events (New System)
// =============================================================================

export const HEARTBEAT_MANAGER_EVENTS = {
  HeartbeatEnqueued: 'HeartbeatEnqueued(bytes32 indexed heartbeatKey, bytes rawHTX, address indexed submitter)',

  RoundStarted: 'RoundStarted(bytes32 indexed heartbeatKey, uint8 round, bytes32 committeeRoot, uint64 snapshotId, uint64 startedAt, uint64 deadline, address[] members, bytes rawHTX)',

  OperatorVoted: 'OperatorVoted(bytes32 indexed heartbeatKey, uint8 round, address indexed operator, uint8 verdict, uint256 weight)',

  RoundFinalized: 'RoundFinalized(bytes32 indexed heartbeatKey, uint8 round, uint8 outcome)',

  HeartbeatStatusChanged: 'HeartbeatStatusChanged(bytes32 indexed heartbeatKey, uint8 oldStatus, uint8 newStatus, uint8 round)',
} as const;

// =============================================================================
// NilAVRouter Events (DEPRECATED - Old HTX System)
// =============================================================================

/**
 * @deprecated Use HEARTBEAT_MANAGER_EVENTS instead
 * These events are from the old HTX-based system and will be removed after migration
 */
export const NILAV_ROUTER_EVENTS = {
  HTXSubmitted: 'HTXSubmitted(bytes32 indexed htxId, bytes32 indexed rawHTXHash, address indexed sender)',
  HTXAssigned: 'HTXAssigned(bytes32 indexed htxId, address indexed node)',
  HTXResponded: 'HTXResponded(bytes32 indexed htxId, address indexed node, bool result)',
} as const;

// =============================================================================
// StakingOperators Events
// =============================================================================

export const STAKING_EVENTS = {
  OperatorRegistered: 'OperatorRegistered(address indexed operator, string metadataURI)',
  OperatorDeactivated: 'OperatorDeactivated(address indexed operator)',
  StakedTo: 'StakedTo(address indexed staker, address indexed operator, uint256 amount)',
  Staked: 'Staked(address indexed operator, address indexed staker, uint256 amount)',
  UnstakeRequested: 'UnstakeRequested(address indexed operator, address indexed staker, uint256 amount, uint256 releaseTime)',
  Unstaked: 'Unstaked(address indexed operator, address indexed staker, uint256 amount)',
  OperatorJailed: 'OperatorJailed(address indexed operator)',
  OperatorUnjailed: 'OperatorUnjailed(address indexed operator)',
  OperatorSlashed: 'OperatorSlashed(address indexed operator, uint256 amount)',
} as const;

// =============================================================================
// All Events (for convenience)
// =============================================================================

export const ALL_EVENTS = {
  ...HEARTBEAT_MANAGER_EVENTS,
  ...STAKING_EVENTS,
  // Old HTX events still exported for backward compatibility during migration
  ...NILAV_ROUTER_EVENTS,
} as const;
