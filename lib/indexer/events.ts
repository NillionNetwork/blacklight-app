/**
 * Event signatures for Conduit Indexer queries
 *
 * These signatures are used to query specific events from the blockchain.
 * Format: EventName(type1 indexed param1, type2 param2, ...)
 */

// =============================================================================
// NilAVRouter Events
// =============================================================================

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
  ...NILAV_ROUTER_EVENTS,
  ...STAKING_EVENTS,
} as const;
