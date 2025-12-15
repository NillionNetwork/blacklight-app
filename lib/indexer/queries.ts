import { queryIndexer, IndexerResponse } from './client';
import { STAKING_EVENTS, NILAV_ROUTER_EVENTS } from './events';
import { getEventSignatureHash, padAddressTo32Bytes } from './helpers';
import { indexer, activeContracts } from '@/config';

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
      AND address = '${activeContracts.nilavRouter.toLowerCase()}'
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
// - Use activeContracts.nilavRouter for HTX events
// - NEVER query the entire chain
//
// Our helper functions in helpers.ts enforce this requirement.
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
 * HTXAssigned event data
 * Emitted when an HTX verification task is assigned to a node
 */
export interface HTXAssignedEvent extends BlockchainEvent {
  htxId: string; // bytes32 - unique identifier for the HTX
  node: string; // address - the node assigned to verify
}

/**
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
    result.data = result.data.map((event: any) => ({
      ...event,
      htxId: event.htxId || event.htxid || '',
      node:
        event.node && typeof event.node === 'string'
          ? '0x' + event.node.replace('0x', '').slice(-40)
          : nodeAddress.toLowerCase(),
    }));
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
