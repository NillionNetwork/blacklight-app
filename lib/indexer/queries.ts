import { queryIndexer, IndexerResponse } from './client';
import { STAKING_EVENTS, NILAV_ROUTER_EVENTS, HEARTBEAT_MANAGER_EVENTS, REWARD_POLICY_EVENTS } from './events';
import { getEventSignatureHash, padAddressTo32Bytes, buildHeartbeatEventQuery } from './helpers';
import { indexer, activeContracts } from '@/config';
import { decodeAbiParameters } from 'viem';

/**
 * Helper for building common operator event queries
 * This reduces boilerplate for simple operator-indexed events
 *
 * @param eventName - Name of the event from STAKING_EVENTS
 * @param operatorAddress - Operator address to filter by
 * @param options - Optional query customization
 * @param options.selectFields - Columns to select (default: operator, block_num, block_timestamp, tx_hash)
 * @param options.limit - Maximum number of results (default: 1)
 * @param options.orderBy - ORDER BY clause (default: 'block_num DESC')
 * @param options.fromBlock - Only include events from this block onwards (for performance)
 * @returns SQL query string
 *
 * @example
 * // Get the most recent registration event (default limit: 1)
 * buildOperatorEventQuery('OperatorRegistered', '0x...')
 *
 * @example
 * // Get last 50 staking events after a specific block
 * buildOperatorEventQuery('Staked', '0x...', { limit: 50, fromBlock: 1036389 })
 *
 * @example
 * // Get events with custom fields and ordering
 * buildOperatorEventQuery('Staked', '0x...', {
 *   selectFields: ['topics[2] as operator', 'topics[3] as staker', 'data', 'block_num', 'tx_hash'],
 *   orderBy: 'block_num ASC',
 *   limit: 100,
 *   fromBlock: 1000000
 * })
 */
function buildOperatorEventQuery(
  eventName: keyof typeof STAKING_EVENTS,
  operatorAddress: string,
  options: {
    selectFields?: string[];
    limit?: number;
    orderBy?: string;
    fromBlock?: number;
  } = {}
): string {
  const {
    selectFields = ['topics[2] as operator', 'block_num', 'block_timestamp', 'tx_hash'],
    limit = 1,
    orderBy = 'block_num DESC',
    fromBlock,
  } = options;

  const eventSignature = getEventSignatureHash(STAKING_EVENTS[eventName]);
  const paddedOperator = padAddressTo32Bytes(operatorAddress);

  // Build WHERE clause with optional fromBlock filter
  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.stakingOperators.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[2] = '${paddedOperator}'`;

  // Add fromBlock filter if provided (improves performance)
  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  return `
    SELECT
      ${selectFields.join(',\n      ')}
    FROM logs
    WHERE${whereClause}
    ORDER BY ${orderBy}
    LIMIT ${limit}
  `;
}

/**
 * Helper for building NilAVRouter event queries
 * HTX events have node address in topics[3] (not topics[2] like operator events)
 *
 * @param eventName - Name of the event from NILAV_ROUTER_EVENTS
 * @param nodeAddress - Node address to filter by
 * @param options - Optional query customization
 * @param options.selectFields - Columns to select
 * @param options.limit - Maximum number of results (default: 50)
 * @param options.orderBy - ORDER BY clause (default: 'block_num DESC')
 * @param options.fromBlock - Only include events from this block onwards
 * @returns SQL query string
 *
 * @example
 * // Get last 50 HTX assignments for a node
 * buildRouterEventQuery('HTXAssigned', '0x...', { limit: 50, fromBlock: 1036389 })
 */
function buildRouterEventQuery(
  eventName: keyof typeof NILAV_ROUTER_EVENTS,
  nodeAddress: string,
  options: {
    selectFields?: string[];
    limit?: number;
    orderBy?: string;
    fromBlock?: number;
  } = {}
): string {
  const {
    selectFields = ['topics[2] as htxId', 'topics[3] as node', 'block_num', 'block_timestamp', 'tx_hash'],
    limit = 50,
    orderBy = 'block_num DESC',
    fromBlock,
  } = options;

  const eventSignature = getEventSignatureHash(NILAV_ROUTER_EVENTS[eventName]);
  const paddedNode = padAddressTo32Bytes(nodeAddress);

  // Build WHERE clause - NOTE: node address is in topics[3] for HTX events!
  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.heartbeatManager.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[3] = '${paddedNode}'`;

  // Add fromBlock filter if provided (improves performance)
  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  return `
    SELECT
      ${selectFields.join(',\n      ')}
    FROM logs
    WHERE${whereClause}
    ORDER BY ${orderBy}
    LIMIT ${limit}
  `;
}

/**
 * Helper for building staking event queries filtered by staker address
 * StakedTo events have staker address in topics[2] (operator is in topics[3])
 *
 * @param eventName - Name of the event from STAKING_EVENTS
 * @param stakerAddress - Staker address to filter by
 * @param options - Optional query customization
 * @param options.selectFields - Columns to select
 * @param options.limit - Maximum number of results (default: 100)
 * @param options.orderBy - ORDER BY clause (default: 'block_num DESC')
 * @param options.fromBlock - Only include events from this block onwards
 * @returns SQL query string
 *
 * @example
 * // Get last 100 StakedTo events for a user
 * buildStakerEventQuery('StakedTo', '0x...', { limit: 100 })
 */
function buildStakerEventQuery(
  eventName: keyof typeof STAKING_EVENTS,
  stakerAddress: string,
  options: {
    selectFields?: string[];
    limit?: number;
    orderBy?: string;
    fromBlock?: number;
  } = {}
): string {
  const {
    selectFields = ['topics[2] as staker', 'topics[3] as operator', 'block_num', 'block_timestamp', 'tx_hash'],
    limit = 100,
    orderBy = 'block_num DESC',
    fromBlock,
  } = options;

  const eventSignature = getEventSignatureHash(STAKING_EVENTS[eventName]);
  const paddedStaker = padAddressTo32Bytes(stakerAddress);

  // Build WHERE clause - NOTE: staker address is in topics[2] for StakedTo events!
  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.stakingOperators.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[2] = '${paddedStaker}'`;

  // Add fromBlock filter if provided (improves performance)
  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  return `
    SELECT
      ${selectFields.join(',\n      ')}
    FROM logs
    WHERE${whereClause}
    ORDER BY ${orderBy}
    LIMIT ${limit}
  `;
}

// =============================================================================
// ⚠️ SECURITY REMINDER
// =============================================================================
//
// ALWAYS filter queries by contract address!
// - Use activeContracts.stakingOperators for staking events
// - Use activeContracts.heartbeatManager for heartbeat/verification events
// - NEVER query the entire chain
//
// Our helper functions in helpers.ts enforce this requirement.
//
// ⚠️ NOTE: Event queries below still use old HTX event format.
// See docs/MIGRATION.md for complete HeartbeatManager event migration guide.
//
// =============================================================================

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Base interface for all blockchain events
 * Contains standard metadata fields that all events share
 */
export interface BlockchainEvent {
  block_num: number;
  block_timestamp: string; // ISO 8601 timestamp from blockchain
  tx_hash: string;
}

/**
 * OperatorRegistered event data
 * Emitted when a new operator registers on the network
 */
export interface OperatorRegisteredEvent extends BlockchainEvent {
  operator: string;
  metadataURI?: string; // Optional since we need to decode from data field
}

/**
 * OperatorDeactivated event data
 * Emitted when an operator is deactivated
 */
export interface OperatorDeactivatedEvent extends BlockchainEvent {
  operator: string;
}

/**
 * StakedTo event data
 * Emitted when a user stakes tokens to an operator
 * Event signature: StakedTo(address indexed staker, address indexed operator, uint256 amount)
 */
export interface StakedEvent extends BlockchainEvent {
  staker: string; // address - the user staking tokens (topics[2])
  operator: string; // address - the operator being staked to (topics[3])
  amount?: string; // uint256 - amount staked (needs decoding from data field)
}

/**
 * UnstakedWithdrawn event data
 * Emitted when a user withdraws unstaked tokens after the unbonding period
 * Event signature: UnstakedWithdrawn(address indexed staker, address indexed operator, uint256 amount)
 */
export interface UnstakedWithdrawnEvent extends BlockchainEvent {
  staker: string; // address - the user withdrawing tokens (topics[2])
  operator: string; // address - the operator being withdrawn from (topics[3])
  amount: string; // uint256 - amount withdrawn (decoded from data field)
}

/**
 * UnstakeRequested event data
 * Emitted when a user requests to unstake tokens (starts unbonding period)
 * Event signature: UnstakeRequested(address indexed staker, address indexed operator, uint256 amount, uint64 releaseTime)
 */
export interface UnstakeRequestedEvent extends BlockchainEvent {
  staker: string; // address - the user unstaking tokens (topics[2])
  operator: string; // address - the operator being unstaked from (topics[3])
  amount: string; // uint256 - amount being unstaked (decoded from data field)
  releaseTime: string; // uint64 - timestamp when tokens can be withdrawn (decoded from data field)
}

  /**
   * RewardsAccrued event data
   * Emitted when rewards are allocated to recipients by the RewardPolicy
   * Event signature: RewardsAccrued(bytes32 indexed heartbeatKey, uint8 round, address indexed recipient, uint256 amount)
   */
  export interface RewardsAccruedEvent extends BlockchainEvent {
    heartbeatKey: string;
    round: number;
    recipient: string;
    amount: string;
  }

  /**
   * RewardClaimed event data
   * Emitted when a recipient claims rewards
   * Event signature: RewardClaimed(address indexed recipient, uint256 amount)
   */
  export interface RewardClaimedEvent extends BlockchainEvent {
    recipient: string;
    amount: string;
  }

/**
 * HeartbeatEnqueued event
 *
 * WHEN EMITTED: When a new heartbeat is submitted to the system
 * USE CASE: Track heartbeat submissions, show recent activity
 */
export interface HeartbeatEnqueuedEvent extends BlockchainEvent {
  heartbeatKey: string;
  submitter: string;
  // rawHTX is in data field
}

/**
 * RoundStarted event
 *
 * WHEN EMITTED: When a new verification round begins with selected committee
 * USE CASE: Show committee assignments, check if operator is selected
 * IMPORTANT: members[] array is in data field - requires client-side decoding
 */
export interface RoundStartedEvent extends BlockchainEvent {
  heartbeatKey: string;
  round: number;
  committeeRoot: string;
  snapshotId: string;
  startedAt: string;
  deadline: string;
  members: string[];  // Decoded from data field - committee member addresses
  // rawHTX is in data field
}

/**
 * OperatorVoted event
 *
 * WHEN EMITTED: When an operator submits their verification vote
 * USE CASE: Show operator's voting history, track participation
 */
export interface OperatorVotedEvent extends BlockchainEvent {
  heartbeatKey: string;
  round: number;
  operator: string;
  verdict: number;  // 1=Valid, 2=Invalid, 3=Error
  weight: string;   // Stake weight at time of vote
}

/**
 * RoundFinalized event
 *
 * WHEN EMITTED: When a round completes and outcome is determined
 * USE CASE: Show round results, track consensus outcomes
 */
export interface RoundFinalizedEvent extends BlockchainEvent {
  heartbeatKey: string;
  round: number;
  outcome: number;  // 0=Inconclusive, 1=ValidThreshold, 2=InvalidThreshold
}

/**
 * HeartbeatStatusChanged event
 *
 * WHEN EMITTED: When heartbeat status changes (e.g., Pending → Verified)
 * USE CASE: Show final heartbeat verification results
 */
export interface HeartbeatStatusChangedEvent extends BlockchainEvent {
  heartbeatKey: string;
  oldStatus: number;
  newStatus: number;  // 0=None, 1=Pending, 2=Verified, 3=Invalid, 4=Expired
  round: number;
}

/**
 * @deprecated Use HeartbeatManager events instead
 * HTXAssigned event data
 * Emitted when an HTX verification task is assigned to a node
 */
export interface HTXAssignedEvent extends BlockchainEvent {
  htxId: string; // bytes32 - unique identifier for the HTX
  node: string; // address - the node assigned to verify
}

/**
 * @deprecated Use HeartbeatManager events instead
 * HTXResponded event data
 * Emitted when a node responds to an HTX verification task
 */
export interface HTXRespondedEvent extends BlockchainEvent {
  htxId: string; // bytes32 - unique identifier for the HTX
  node: string; // address - the node that responded
  result: boolean; // verification result (true/false)
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Get operator registration event for a specific node
 *
 * Query the logs table directly since virtual event tables don't exist.
 *
 * @param operatorAddress - The operator address to query
 * @returns Promise with registration event data
 */
export async function getOperatorRegistration(
  operatorAddress: string
): Promise<IndexerResponse<OperatorRegisteredEvent>> {
  // Use helper to build query - much cleaner!
  const query = buildOperatorEventQuery('OperatorRegistered', operatorAddress);

  const result = await queryIndexer<OperatorRegisteredEvent>(query, []);

  // Strip padding from operator address (topics are 32 bytes, address is last 20 bytes)
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event) => {
      // Handle case where operator might be undefined or null
      const cleanedOperator = event.operator && typeof event.operator === 'string'
        ? '0x' + event.operator.replace('0x', '').slice(-40)
        : operatorAddress.toLowerCase();

      return {
        ...event,
        operator: cleanedOperator,
      };
    });
  }

  return result;
}

/**
 * Get operator deactivation event for a specific node
 *
 * @param operatorAddress - The operator address to query
 * @param fromBlock - Optional: Only look for events from this block onwards (performance optimization)
 * @returns Promise with deactivation event data
 */
export async function getOperatorDeactivation(
  operatorAddress: string,
  fromBlock?: number
): Promise<IndexerResponse<OperatorDeactivatedEvent>> {
  // Use helper to build query - much cleaner!
  const query = buildOperatorEventQuery('OperatorDeactivated', operatorAddress, {
    fromBlock,
  });

  const result = await queryIndexer<OperatorDeactivatedEvent>(query, []);

  // Strip padding from operator address
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event) => {
      const cleanedOperator =
        event.operator && typeof event.operator === 'string'
          ? '0x' + event.operator.replace('0x', '').slice(-40)
          : operatorAddress.toLowerCase();

      return {
        ...event,
        operator: cleanedOperator,
      };
    });
  }

  return result;
}

/**
 * Get HTX assignment events for a specific node
 *
 * @param nodeAddress - The node address to query
 * @param fromBlock - Optional: Only look for events from this block onwards (performance optimization)
 * @param limit - Maximum number of results (default: 50)
 * @returns Promise with HTX assignment event data
 */
export async function getHTXAssignments(
  nodeAddress: string,
  fromBlock?: number,
  limit: number = 10
): Promise<IndexerResponse<HTXAssignedEvent>> {
  const query = buildRouterEventQuery('HTXAssigned', nodeAddress, {
    fromBlock,
    limit,
  });

  const result = await queryIndexer<HTXAssignedEvent>(query, []);

  // Strip padding from htxId and node address
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      // Extract block_timestamp as string (handle various formats from indexer)
      let timestamp: string = '';
      if (event.block_timestamp) {
        if (typeof event.block_timestamp === 'string') {
          timestamp = event.block_timestamp;
        } else if (typeof event.block_timestamp === 'object' && event.block_timestamp.value) {
          // Handle case where timestamp is wrapped in an object
          timestamp = event.block_timestamp.value;
        } else if (typeof event.block_timestamp === 'object') {
          // Try to extract from object properties
          console.warn(`[getHTXAssignments] block_timestamp is an object for HTX ${event.htxId || event.htxid}`, {
            timestamp_obj: event.block_timestamp,
            event,
          });
          // Try common properties
          timestamp = event.block_timestamp.toString?.() || JSON.stringify(event.block_timestamp);
        }
      }

      if (!timestamp) {
        console.warn(`[getHTXAssignments] Missing or invalid block_timestamp for HTX ${event.htxId || event.htxid}`, {
          event,
          block_num: event.block_num,
        });
      }

      return {
        htxId: event.htxId || event.htxid || '',
        node:
          event.node && typeof event.node === 'string'
            ? '0x' + event.node.replace('0x', '').slice(-40)
            : nodeAddress.toLowerCase(),
        block_num: event.block_num,
        block_timestamp: timestamp,
        tx_hash: event.tx_hash,
      };
    });
  }

  return result;
}

/**
 * Get HTX response events for a specific node
 *
 * @param nodeAddress - The node address to query
 * @param fromBlock - Optional: Only look for events from this block onwards (performance optimization)
 * @param limit - Maximum number of results (default: 50)
 * @returns Promise with HTX response event data
 */
export async function getHTXResponses(
  nodeAddress: string,
  fromBlock?: number,
  limit: number = 10
): Promise<IndexerResponse<HTXRespondedEvent>> {
  const query = buildRouterEventQuery('HTXResponded', nodeAddress, {
    selectFields: [
      'topics[2] as htxId',
      'topics[3] as node',
      'data',
      'block_num',
      'block_timestamp',
      'tx_hash',
    ],
    fromBlock,
    limit,
  });

  const result = await queryIndexer<HTXRespondedEvent>(query, []);

  // Strip padding and decode result from data field
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      // Decode result (bool) from data field
      let resultBool = false;
      if (event.data && typeof event.data === 'string') {
        const hexData = event.data.replace('0x', '');
        // Bool is stored as 32-byte word, true = 0x...01, false = 0x...00
        resultBool = hexData.endsWith('1');
      }

      return {
        htxId: event.htxId || event.htxid || '',
        node:
          event.node && typeof event.node === 'string'
            ? '0x' + event.node.replace('0x', '').slice(-40)
            : nodeAddress.toLowerCase(),
        result: resultBool,
        block_num: event.block_num,
        block_timestamp: event.block_timestamp,
        tx_hash: event.tx_hash,
      };
    });
  }

  return result;
}

/**
 * Get StakedTo events for a specific staker (user wallet)
 * Used to discover which operators a user has staked to
 *
 * @param stakerAddress - The staker/user address to query
 * @param fromBlock - Optional: Only look for events from this block onwards (performance optimization)
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise with StakedTo event data
 */
export async function getStakedEvents(
  stakerAddress: string,
  fromBlock?: number,
  limit: number = 10
): Promise<IndexerResponse<StakedEvent>> {
  const query = buildStakerEventQuery('StakedTo', stakerAddress, {
    fromBlock,
    limit,
  });

  const result = await queryIndexer<StakedEvent>(query, []);

  // Strip padding from staker and operator addresses
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => ({
      ...event,
      staker:
        event.staker && typeof event.staker === 'string'
          ? '0x' + event.staker.replace('0x', '').slice(-40)
          : stakerAddress.toLowerCase(),
      operator:
        event.operator && typeof event.operator === 'string'
          ? '0x' + event.operator.replace('0x', '').slice(-40)
          : '',
      block_num: event.block_num,
      block_timestamp: event.block_timestamp,
      tx_hash: event.tx_hash,
    }));
  }

  return result;
}

// =============================================================================
// HeartbeatManager Query Functions (New System)
// =============================================================================

/**
 * Get RoundStarted events (all recent committees)
 *
 * WHAT IT RETURNS:
 * - All RoundStarted events (not filtered by operator)
 * - Contains raw data field that needs client-side decoding
 *
 * CLIENT-SIDE STEPS:
 * 1. Decode data field to extract members[] array
 * 2. Filter to find events where your operator is in members[]
 * 3. Display those as "Your Committee Assignments"
 *
 * PERFORMANCE:
 * - Use a reasonable limit (50-100 events)
 * - Cache globally (shared across all node pages)
 * - Consider pagination if needed
 *
 * @param fromBlock - Only return events after this block (performance optimization)
 * @param limit - Maximum number of events to return (default: 50)
 * @returns All recent RoundStarted events with raw data field
 */
export async function getRoundStartedEvents(
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<RoundStartedEvent>> {
  const eventSignature = getEventSignatureHash(HEARTBEAT_MANAGER_EVENTS.RoundStarted);

  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.heartbeatManager.toLowerCase()}'
      AND topics[1] = '${eventSignature}'`;

  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  const query = `
    SELECT
      topics[2] as heartbeatKey,
      data,
      block_num,
      block_timestamp,
      tx_hash
    FROM logs
    WHERE${whereClause}
    ORDER BY block_num DESC
    LIMIT ${limit}
  `;

  const result = await queryIndexer<RoundStartedEvent>(query, []);

  // Decode data field to extract round, committeeRoot, members[], etc.
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      try {
        // Decode the data field containing: (uint8 round, bytes32 committeeRoot, uint64 snapshotId, uint64 startedAt, uint64 deadline, address[] members, bytes rawHTX)
        const decoded = decodeAbiParameters(
          [
            { type: 'uint8', name: 'round' },
            { type: 'bytes32', name: 'committeeRoot' },
            { type: 'uint64', name: 'snapshotId' },
            { type: 'uint64', name: 'startedAt' },
            { type: 'uint64', name: 'deadline' },
            { type: 'address[]', name: 'members' },
            { type: 'bytes', name: 'rawHTX' }
          ],
          event.data as `0x${string}`
        );

        // Handle case-insensitive field names from SQL
        const heartbeatKey = event.heartbeatKey || event.heartbeatkey || '';

        return {
          heartbeatKey,
          round: Number(decoded[0]),
          committeeRoot: decoded[1] as string,
          snapshotId: decoded[2].toString(),
          startedAt: decoded[3].toString(),
          deadline: decoded[4].toString(),
          members: (decoded[5] as string[]).map(m => m.toLowerCase()),
          block_num: event.block_num,
          block_timestamp: event.block_timestamp,
          tx_hash: event.tx_hash,
        };
      } catch (error) {
        console.error('[getRoundStartedEvents] Failed to decode event data:', error, event);
        // Return partial data if decoding fails
        return {
          heartbeatKey: event.heartbeatKey || event.heartbeatkey || '',
          round: 0,
          committeeRoot: '',
          snapshotId: '',
          startedAt: '',
          deadline: '',
          members: [],
          block_num: event.block_num,
          block_timestamp: event.block_timestamp,
          tx_hash: event.tx_hash,
        };
      }
    });
  }

  return result;
}

/**
 * Get OperatorVoted events for a specific operator
 *
 * WHAT IT RETURNS:
 * - All votes submitted by the operator
 * - Decoded verdict (1=Valid, 2=Invalid, 3=Error)
 * - Stake weight used for the vote
 *
 * SQL FILTERING:
 * - Filters by operator address in topics[3] ✅
 * - Much simpler than RoundStarted (no array decoding needed)
 *
 * DATA DECODING:
 * - Decodes data field: (uint8 round, uint8 verdict, uint256 weight)
 * - Uses viem's decodeAbiParameters
 *
 * @param operatorAddress - Operator to get votes for
 * @param fromBlock - Only return votes after this block
 * @param limit - Maximum number of votes to return (default: 50)
 * @returns Operator's voting history with decoded verdicts
 */
export async function getOperatorVotes(
  operatorAddress: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<OperatorVotedEvent>> {
  const query = buildHeartbeatEventQuery('OperatorVoted', operatorAddress, {
    selectFields: [
      'topics[2] as heartbeatKey',
      'data',  // Contains: round (uint8), verdict (uint8), weight (uint256)
      'topics[3] as operator',
      'block_num',
      'block_timestamp',
      'tx_hash'
    ],
    fromBlock,
    limit,
  });

  const result = await queryIndexer<OperatorVotedEvent>(query, []);

  // Decode data field
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      try {
        // Decode: (uint8 round, uint8 verdict, uint256 weight) from data
        const decoded = decodeAbiParameters(
          [
            { type: 'uint8', name: 'round' },
            { type: 'uint8', name: 'verdict' },
            { type: 'uint256', name: 'weight' }
          ],
          event.data as `0x${string}`
        );

        // Handle case-insensitive field names from SQL
        const heartbeatKey = event.heartbeatKey || event.heartbeatkey || '';

        return {
          heartbeatKey,
          round: Number(decoded[0]),
          operator: event.operator && typeof event.operator === 'string'
            ? '0x' + event.operator.replace('0x', '').slice(-40)
            : operatorAddress.toLowerCase(),
          verdict: Number(decoded[1]),
          weight: decoded[2].toString(),
          block_num: event.block_num,
          block_timestamp: event.block_timestamp,
          tx_hash: event.tx_hash,
        };
      } catch (error) {
        console.error('[getOperatorVotes] Failed to decode event data:', error, event);
        // Return partial data if decoding fails
        return {
          heartbeatKey: event.heartbeatKey || event.heartbeatkey || '',
          round: 0,
          operator: event.operator && typeof event.operator === 'string'
            ? '0x' + event.operator.replace('0x', '').slice(-40)
            : operatorAddress.toLowerCase(),
          verdict: 0,
          weight: '0',
          block_num: event.block_num,
          block_timestamp: event.block_timestamp,
          tx_hash: event.tx_hash,
        };
      }
    });
  }

  return result;
}

/**
 * Get RoundStarted events for specific heartbeatKeys (OPTIMIZED)
 *
 * WHEN TO USE:
 * - When you already know which heartbeatKeys you care about
 * - Example: After fetching OperatorVoted events, fetch only those rounds
 *
 * PERFORMANCE:
 * - Much faster than getRoundStartedEvents() when filtering by heartbeatKeys
 * - Only fetches the rounds you actually need
 * - Example: Fetch 10 specific rounds instead of 100 all rounds
 *
 * PATTERN:
 * ```
 * // Step 1: Get operator's votes (SQL-filtered by operator)
 * const votes = await getOperatorVotes(operator);
 *
 * // Step 2: Extract unique heartbeatKeys
 * const heartbeatKeys = [...new Set(votes.data.map(v => v.heartbeatKey))];
 *
 * // Step 3: Fetch ONLY those RoundStarted events
 * const rounds = await getRoundStartedByKeys(heartbeatKeys);
 * ```
 *
 * @param heartbeatKeys - Array of heartbeatKeys to fetch
 * @param fromBlock - Only return events after this block (optional)
 * @returns RoundStarted events for the specified heartbeatKeys
 */
export async function getRoundStartedByKeys(
  heartbeatKeys: string[],
  fromBlock?: number
): Promise<IndexerResponse<RoundStartedEvent>> {
  // Handle empty array case
  if (!heartbeatKeys || heartbeatKeys.length === 0) {
    return { data: [] };
  }

  const eventSignature = getEventSignatureHash(HEARTBEAT_MANAGER_EVENTS.RoundStarted);

  // Build IN clause for heartbeatKeys
  // Need to pad each key to 32 bytes for topics comparison
  const paddedKeys = heartbeatKeys.map(key => {
    // If already padded (66 chars: 0x + 64 hex chars), use as-is
    if (key.length === 66) {
      return `'${key.toLowerCase()}'`;
    }
    // Otherwise pad it
    const cleaned = key.replace('0x', '').padStart(64, '0');
    return `'0x${cleaned.toLowerCase()}'`;
  }).join(', ');

  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.heartbeatManager.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[2] IN (${paddedKeys})`;

  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  const query = `
    SELECT
      topics[2] as heartbeatKey,
      data,
      block_num,
      block_timestamp,
      tx_hash
    FROM logs
    WHERE${whereClause}
    ORDER BY block_num DESC
  `;

  const result = await queryIndexer<RoundStartedEvent>(query, []);

  // Decode data field (same logic as getRoundStartedEvents)
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      try {
        // Decode the data field containing: (uint8 round, bytes32 committeeRoot, uint64 snapshotId, uint64 startedAt, uint64 deadline, address[] members, bytes rawHTX)
        const decoded = decodeAbiParameters(
          [
            { type: 'uint8', name: 'round' },
            { type: 'bytes32', name: 'committeeRoot' },
            { type: 'uint64', name: 'snapshotId' },
            { type: 'uint64', name: 'startedAt' },
            { type: 'uint64', name: 'deadline' },
            { type: 'address[]', name: 'members' },
            { type: 'bytes', name: 'rawHTX' }
          ],
          event.data as `0x${string}`
        );

        // Handle case-insensitive field names from SQL
        const heartbeatKey = event.heartbeatKey || event.heartbeatkey || '';

        return {
          heartbeatKey,
          round: Number(decoded[0]),
          committeeRoot: decoded[1] as string,
          snapshotId: decoded[2].toString(),
          startedAt: decoded[3].toString(),
          deadline: decoded[4].toString(),
          members: (decoded[5] as string[]).map(m => m.toLowerCase()),
          block_num: event.block_num,
          block_timestamp: event.block_timestamp,
          tx_hash: event.tx_hash,
        };
      } catch (error) {
        console.error('[getRoundStartedByKeys] Failed to decode event data:', error, event);
        // Return partial data if decoding fails
        return {
          heartbeatKey: event.heartbeatKey || event.heartbeatkey || '',
          round: 0,
          committeeRoot: '',
          snapshotId: '',
          startedAt: '',
          deadline: '',
          members: [],
          block_num: event.block_num,
          block_timestamp: event.block_timestamp,
          tx_hash: event.tx_hash,
        };
      }
    });
  }

  return result;
}

/**
 * Get withdrawal history for an operator
 * Returns UnstakedWithdrawn events showing when tokens were withdrawn
 *
 * @param operatorAddress - The operator address to query withdrawals for
 * @param fromBlock - Optional: Only look for events from this block onwards
 * @param limit - Maximum number of results (default: 50)
 * @returns Promise with withdrawal event data
 *
 * @example
 * // Get last 50 withdrawals for an operator
 * const withdrawals = await getWithdrawalHistory('0x...');
 *
 * @example
 * // Get last 100 withdrawals from a specific block
 * const withdrawals = await getWithdrawalHistory('0x...', 1036389, 100);
 */
export async function getWithdrawalHistory(
  operatorAddress: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<UnstakedWithdrawnEvent>> {
  // UnstakedWithdrawn event signature: UnstakedWithdrawn(address indexed staker, address indexed operator, uint256 amount)
  // In SQL (1-indexed):
  // topics[1] = event signature
  // topics[2] = staker (first indexed)
  // topics[3] = operator (second indexed) <-- Filter by this!
  // data = amount (non-indexed)

  const eventSignature = getEventSignatureHash(STAKING_EVENTS.UnstakedWithdrawn);
  const paddedOperator = padAddressTo32Bytes(operatorAddress);

  // Build WHERE clause - NOTE: operator is in topics[3] for UnstakedWithdrawn!
  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.stakingOperators.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[3] = '${paddedOperator}'`;

  // Add fromBlock filter if provided (improves performance)
  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  const query = `
    SELECT
      topics[2] as staker,
      topics[3] as operator,
      data,
      block_num,
      block_timestamp,
      tx_hash
    FROM logs
    WHERE${whereClause}
    ORDER BY block_num DESC
    LIMIT ${limit}
  `;

  const result = await queryIndexer<UnstakedWithdrawnEvent>(query, []);

  // Process the results
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      // Strip padding from addresses (topics are 32 bytes)
      const cleanStaker = event.staker && typeof event.staker === 'string'
        ? '0x' + event.staker.replace('0x', '').slice(-40)
        : '';
      const cleanOperator = event.operator && typeof event.operator === 'string'
        ? '0x' + event.operator.replace('0x', '').slice(-40)
        : operatorAddress.toLowerCase();

      // Decode amount from data field (uint256)
      let amount = '0';
      try {
        if (event.data) {
          const decoded = decodeAbiParameters(
            [{ type: 'uint256', name: 'amount' }],
            event.data as `0x${string}`
          );
          amount = decoded[0].toString();
        }
      } catch (error) {
        console.error('[getWithdrawalHistory] Failed to decode amount:', error);
      }

      return {
        staker: cleanStaker,
        operator: cleanOperator,
        amount,
        block_num: event.block_num,
        block_timestamp: event.block_timestamp,
        tx_hash: event.tx_hash,
      };
    });
  }

  return result;
}

/**
 * Get staking history for an operator
 * Returns StakedTo events showing when tokens were staked
 *
 * @param operatorAddress - The operator address to query staking events for
 * @param fromBlock - Optional: Only look for events from this block onwards
 * @param limit - Maximum number of results (default: 50)
 * @returns Promise with staking event data
 *
 * @example
 * // Get last 50 staking events for an operator
 * const stakings = await getStakingHistory('0x...');
 *
 * @example
 * // Get last 100 staking events from a specific block
 * const stakings = await getStakingHistory('0x...', 1036389, 100);
 */
export async function getStakingHistory(
  operatorAddress: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<StakedEvent>> {
  // StakedTo event signature: StakedTo(address indexed staker, address indexed operator, uint256 amount)
  // In SQL (1-indexed):
  // topics[1] = event signature
  // topics[2] = staker (first indexed)
  // topics[3] = operator (second indexed) <-- Filter by this!
  // data = amount (non-indexed)

  const eventSignature = getEventSignatureHash(STAKING_EVENTS.StakedTo);
  const paddedOperator = padAddressTo32Bytes(operatorAddress);

  // Build WHERE clause - NOTE: operator is in topics[3] for StakedTo!
  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.stakingOperators.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[3] = '${paddedOperator}'`;

  // Add fromBlock filter if provided (improves performance)
  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  const query = `
    SELECT
      topics[2] as staker,
      topics[3] as operator,
      data,
      block_num,
      block_timestamp,
      tx_hash
    FROM logs
    WHERE${whereClause}
    ORDER BY block_num DESC
    LIMIT ${limit}
  `;

  const result = await queryIndexer<StakedEvent>(query, []);

  // Process the results
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      // Strip padding from addresses (topics are 32 bytes)
      const cleanStaker = event.staker && typeof event.staker === 'string'
        ? '0x' + event.staker.replace('0x', '').slice(-40)
        : '';
      const cleanOperator = event.operator && typeof event.operator === 'string'
        ? '0x' + event.operator.replace('0x', '').slice(-40)
        : operatorAddress.toLowerCase();

      // Decode amount from data field (uint256)
      let amount = '0';
      try {
        if (event.data) {
          const decoded = decodeAbiParameters(
            [{ type: 'uint256', name: 'amount' }],
            event.data as `0x${string}`
          );
          amount = decoded[0].toString();
        }
      } catch (error) {
        console.error('[getStakingHistory] Failed to decode amount:', error);
      }

      return {
        staker: cleanStaker,
        operator: cleanOperator,
        amount,
        block_num: event.block_num,
        block_timestamp: event.block_timestamp,
        tx_hash: event.tx_hash,
      };
    });
  }

  return result;
}


/**
 * Get unstaking history for an operator
 * Returns UnstakeRequested events showing when tokens were unstaked (started unbonding)
 *
 * @param operatorAddress - The operator address to query unstaking events for
 * @param fromBlock - Optional: Only look for events from this block onwards
 * @param limit - Maximum number of results (default: 50)
 * @returns Promise with unstaking event data
 *
 * @example
 * // Get last 50 unstaking events for an operator
 * const unstakings = await getUnstakingHistory('0x...');
 *
 * @example
 * // Get last 100 unstaking events from a specific block
 * const unstakings = await getUnstakingHistory('0x...', 1036389, 100);
 */
export async function getUnstakingHistory(
  operatorAddress: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<UnstakeRequestedEvent>> {
  // UnstakeRequested event signature: UnstakeRequested(address indexed staker, address indexed operator, uint256 amount, uint64 releaseTime)
  // In SQL (1-indexed):
  // topics[1] = event signature
  // topics[2] = staker (first indexed)
  // topics[3] = operator (second indexed) <-- Filter by this!
  // data = amount + releaseTime (non-indexed)

  const eventSignature = getEventSignatureHash(STAKING_EVENTS.UnstakeRequested);
  const paddedOperator = padAddressTo32Bytes(operatorAddress);

  // Build WHERE clause - NOTE: operator is in topics[3] for UnstakeRequested!
  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.stakingOperators.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[3] = '${paddedOperator}'`;

  // Add fromBlock filter if provided (improves performance)
  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  const query = `
    SELECT
      topics[2] as staker,
      topics[3] as operator,
      data,
      block_num,
      block_timestamp,
      tx_hash
    FROM logs
    WHERE${whereClause}
    ORDER BY block_num DESC
    LIMIT ${limit}
  `;

  const result = await queryIndexer<UnstakeRequestedEvent>(query, []);

  // Process the results
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      // Strip padding from addresses (topics are 32 bytes)
      const cleanStaker = event.staker && typeof event.staker === 'string'
        ? '0x' + event.staker.replace('0x', '').slice(-40)
        : '';
      const cleanOperator = event.operator && typeof event.operator === 'string'
        ? '0x' + event.operator.replace('0x', '').slice(-40)
        : operatorAddress.toLowerCase();

      // Decode amount and releaseTime from data field (uint256 + uint64)
      let amount = '0';
      let releaseTime = '0';
      try {
        if (event.data) {
          const decoded = decodeAbiParameters(
            [
              { type: 'uint256', name: 'amount' },
              { type: 'uint64', name: 'releaseTime' },
            ],
            event.data as `0x${string}`
          );
          amount = decoded[0].toString();
          releaseTime = decoded[1].toString();
        }
      } catch (error) {
        console.error('[getUnstakingHistory] Failed to decode data:', error);
      }

      return {
        staker: cleanStaker,
        operator: cleanOperator,
        amount,
        releaseTime,
        block_num: event.block_num,
        block_timestamp: event.block_timestamp,
        tx_hash: event.tx_hash,
      };
    });
  }

  return result;
}

/**
 * Get reward accrual history for a recipient
 * Returns RewardsAccrued events filtered by recipient
 */
export async function getRewardAccruedHistory(
  recipient: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<RewardsAccruedEvent>> {
  if (!activeContracts.rewardPolicy) {
    throw new Error('RewardPolicy contract not configured');
  }
  const eventSignature = getEventSignatureHash(REWARD_POLICY_EVENTS.RewardsAccrued);
  const paddedRecipient = padAddressTo32Bytes(recipient);

  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.rewardPolicy?.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[3] = '${paddedRecipient}'`;

  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  const query = `
    SELECT
      topics[2] as heartbeatKey,
      topics[3] as recipient,
      data,
      block_num,
      block_timestamp,
      tx_hash
    FROM logs
    WHERE${whereClause}
    ORDER BY block_num DESC
    LIMIT ${limit}
  `;

  const result = await queryIndexer<RewardsAccruedEvent>(query, []);

  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      const cleanRecipient = event.recipient && typeof event.recipient === 'string'
        ? '0x' + event.recipient.replace('0x', '').slice(-40)
        : '';

      let amount = '0';
      let round = 0;
      try {
        if (event.data) {
          const decoded = decodeAbiParameters(
            [
              { type: 'uint8', name: 'round' },
              { type: 'uint256', name: 'amount' },
            ],
            event.data as `0x${string}`
          );
          round = Number(decoded[0]);
          amount = decoded[1].toString();
        }
      } catch (error) {
        console.error('[getRewardAccruedHistory] Failed to decode data:', error);
      }

      return {
        heartbeatKey: event.heartbeatKey,
        round,
        recipient: cleanRecipient,
        amount,
        block_num: event.block_num,
        block_timestamp: event.block_timestamp,
        tx_hash: event.tx_hash,
      };
    });
  }

  return result;
}

/**
 * Get reward claim history for a recipient
 * Returns RewardClaimed events filtered by recipient
 */
export async function getRewardClaimHistory(
  recipient: string,
  fromBlock?: number,
  limit: number = 50
): Promise<IndexerResponse<RewardClaimedEvent>> {
  if (!activeContracts.rewardPolicy) {
    throw new Error('RewardPolicy contract not configured');
  }
  const eventSignature = getEventSignatureHash(REWARD_POLICY_EVENTS.RewardClaimed);
  const paddedRecipient = padAddressTo32Bytes(recipient);

  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.rewardPolicy?.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[2] = '${paddedRecipient}'`;

  if (fromBlock !== undefined) {
    whereClause += `\n      AND block_num >= ${fromBlock}`;
  }

  const query = `
    SELECT
      topics[2] as recipient,
      data,
      block_num,
      block_timestamp,
      tx_hash
    FROM logs
    WHERE${whereClause}
    ORDER BY block_num DESC
    LIMIT ${limit}
  `;

  const result = await queryIndexer<RewardClaimedEvent>(query, []);

  if (result.data && result.data.length > 0) {
    result.data = result.data.map((event: any) => {
      const cleanRecipient = event.recipient && typeof event.recipient === 'string'
        ? '0x' + event.recipient.replace('0x', '').slice(-40)
        : '';

      let amount = '0';
      try {
        if (event.data) {
          const decoded = decodeAbiParameters(
            [{ type: 'uint256', name: 'amount' }],
            event.data as `0x${string}`
          );
          amount = decoded[0].toString();
        }
      } catch (error) {
        console.error('[getRewardClaimHistory] Failed to decode data:', error);
      }

      return {
        recipient: cleanRecipient,
        amount,
        block_num: event.block_num,
        block_timestamp: event.block_timestamp,
        tx_hash: event.tx_hash,
      };
    });
  }

  return result;
}
