'use server';

import {
  getOperatorRegistration as getOperatorRegistrationQuery,
  getOperatorDeactivation as getOperatorDeactivationQuery,
  getHTXAssignments as getHTXAssignmentsQuery,
  getHTXResponses as getHTXResponsesQuery,
  getStakedEvents as getStakedEventsQuery,
  getRoundStartedEvents as getRoundStartedEventsQuery,
  getRoundStartedByKeys as getRoundStartedByKeysQuery,
  getOperatorVotes as getOperatorVotesQuery,
} from './queries';

/**
 * ============================================================================
 * INDEXER SERVER ACTIONS
 * ============================================================================
 *
 * These Server Actions provide secure, validated access to the Conduit Indexer
 * from client components. They prevent SQL injection by validating all inputs
 * and only exposing predefined query functions.
 *
 * USAGE FROM CLIENT COMPONENTS:
 * ```typescript
 * import { getHTXAssignments } from '@/lib/indexer';
 *
 * const { data } = useQuery({
 *   queryKey: ['htx', nodeAddress],
 *   queryFn: () => getHTXAssignments(nodeAddress, undefined, 25),
 * });
 * ```
 *
 * SECURITY FEATURES:
 * - ✅ Input validation (address format, ranges, limits)
 * - ✅ No arbitrary SQL queries
 * - ✅ API key never exposed to clients
 * - ✅ All queries filter by contract address
 *
 * ADDING A NEW SERVER ACTION:
 * 1. Create query function in queries.ts
 * 2. Add Server Action here with validation
 * 3. Export from index.ts
 * 4. See README.md for full guide
 *
 * ============================================================================
 */

/**
 * Get operator registration event
 */
export async function getOperatorRegistration(operatorAddress: string) {
  // Validate address format
  if (!operatorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid operator address format');
  }

  return await getOperatorRegistrationQuery(operatorAddress);
}

/**
 * Get operator deactivation event
 */
export async function getOperatorDeactivation(
  operatorAddress: string,
  fromBlock?: number
) {
  if (!operatorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid operator address format');
  }

  if (fromBlock !== undefined && (fromBlock < 0 || !Number.isInteger(fromBlock))) {
    throw new Error('Invalid fromBlock value');
  }

  return await getOperatorDeactivationQuery(operatorAddress, fromBlock);
}

/**
 * Get HTX assignments for a node
 */
export async function getHTXAssignments(
  nodeAddress: string,
  fromBlock?: number,
  limit?: number
) {
  if (!nodeAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid node address format');
  }

  if (fromBlock !== undefined && (fromBlock < 0 || !Number.isInteger(fromBlock))) {
    throw new Error('Invalid fromBlock value');
  }

  if (limit !== undefined && (limit < 1 || limit > 1000 || !Number.isInteger(limit))) {
    throw new Error('Invalid limit value (must be between 1 and 1000)');
  }

  return await getHTXAssignmentsQuery(nodeAddress, fromBlock, limit);
}

/**
 * Get HTX responses from a node
 */
export async function getHTXResponses(
  nodeAddress: string,
  fromBlock?: number,
  limit?: number
) {
  if (!nodeAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid node address format');
  }

  if (fromBlock !== undefined && (fromBlock < 0 || !Number.isInteger(fromBlock))) {
    throw new Error('Invalid fromBlock value');
  }

  if (limit !== undefined && (limit < 1 || limit > 1000 || !Number.isInteger(limit))) {
    throw new Error('Invalid limit value (must be between 1 and 1000)');
  }

  return await getHTXResponsesQuery(nodeAddress, fromBlock, limit);
}

/**
 * Get staking events for a staker address
 */
export async function getStakedEvents(
  stakerAddress: string,
  fromBlock?: number,
  limit?: number
) {
  if (!stakerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid staker address format');
  }

  if (fromBlock !== undefined && (fromBlock < 0 || !Number.isInteger(fromBlock))) {
    throw new Error('Invalid fromBlock value');
  }

  if (limit !== undefined && (limit < 1 || limit > 1000 || !Number.isInteger(limit))) {
    throw new Error('Invalid limit value (must be between 1 and 1000)');
  }

  return await getStakedEventsQuery(stakerAddress, fromBlock, limit);
}

// =============================================================================
// HeartbeatManager Server Actions (New System)
// =============================================================================

/**
 * Get all recent RoundStarted events
 *
 * NOTE: This returns ALL RoundStarted events, not filtered by operator.
 * Client must decode data field and filter by operator in members[] array.
 */
export async function getRoundStartedEvents(
  fromBlock?: number,
  limit?: number
) {
  // Validate fromBlock
  if (fromBlock !== undefined && (fromBlock < 0 || !Number.isInteger(fromBlock))) {
    throw new Error('Invalid fromBlock value');
  }

  // Validate limit
  if (limit !== undefined && (limit < 1 || limit > 1000 || !Number.isInteger(limit))) {
    throw new Error('Invalid limit value (must be between 1 and 1000)');
  }

  return await getRoundStartedEventsQuery(fromBlock, limit);
}

/**
 * Get operator votes for a specific operator
 */
export async function getOperatorVotes(
  operatorAddress: string,
  fromBlock?: number,
  limit?: number
) {
  // Validate address
  if (!operatorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid operator address format');
  }

  // Validate fromBlock
  if (fromBlock !== undefined && (fromBlock < 0 || !Number.isInteger(fromBlock))) {
    throw new Error('Invalid fromBlock value');
  }

  // Validate limit
  if (limit !== undefined && (limit < 1 || limit > 1000 || !Number.isInteger(limit))) {
    throw new Error('Invalid limit value (must be between 1 and 1000)');
  }

  return await getOperatorVotesQuery(operatorAddress, fromBlock, limit);
}

/**
 * Get RoundStarted events for specific heartbeatKeys (OPTIMIZED)
 *
 * This is more efficient than getRoundStartedEvents when you already know
 * which heartbeatKeys you need (e.g., from operator votes).
 */
export async function getRoundStartedByKeys(
  heartbeatKeys: string[],
  fromBlock?: number
) {
  // Validate heartbeatKeys array
  if (!Array.isArray(heartbeatKeys)) {
    throw new Error('heartbeatKeys must be an array');
  }

  // Validate each heartbeatKey is a valid hex string
  for (const key of heartbeatKeys) {
    if (!key.match(/^0x[a-fA-F0-9]+$/)) {
      throw new Error(`Invalid heartbeatKey format: ${key}`);
    }
  }

  // Prevent excessive queries
  if (heartbeatKeys.length > 100) {
    throw new Error('Cannot query more than 100 heartbeatKeys at once');
  }

  // Validate fromBlock
  if (fromBlock !== undefined && (fromBlock < 0 || !Number.isInteger(fromBlock))) {
    throw new Error('Invalid fromBlock value');
  }

  return await getRoundStartedByKeysQuery(heartbeatKeys, fromBlock);
}
