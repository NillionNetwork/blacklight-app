/**
 * Conduit Indexer Integration
 *
 * This module provides utilities for querying blockchain events
 * using the Conduit Indexer API.
 *
 * ⚠️ SECURITY NOTES:
 * - Client components MUST use Server Actions from './actions'
 * - Server Components can import from './queries' directly
 * - All queries filter by contract address for security
 */

// Export Server Actions (SAFE for client-side use via 'use server')
export {
  getOperatorRegistration,
  getOperatorDeactivation,
  getHTXAssignments,
  getHTXResponses,
  getStakedEvents,
} from './actions';

// Export server-side utilities (Server Components/Actions only)
export * from './events';
export * from './helpers';
export * from './contracts';
export * from './formatters';

// Explicit exports for commonly used functions
export { formatTimeAgo, formatFullDate, formatShortDate } from './formatters';

// Export base types
export type { BlockchainEvent } from './queries';
export type { IndexerResponse } from './client';
