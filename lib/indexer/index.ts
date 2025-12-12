/**
 * Conduit Indexer Integration
 *
 * This module provides utilities for querying blockchain events
 * using the Conduit Indexer API.
 *
 * ⚠️ SECURITY: All queries MUST filter by contract address
 * Use the pre-configured contract configs from './contracts' to ensure this.
 */

export * from './client';
export * from './events';
export * from './queries';
export * from './helpers';
export * from './contracts';
export * from './formatters';

// Explicit exports for commonly used functions
export {
  getOperatorRegistration,
  getOperatorDeactivation,
  getHTXAssignments,
  getHTXResponses,
} from './queries';
export { formatTimeAgo, formatFullDate, formatShortDate } from './formatters';

// Export base types
export type { BlockchainEvent } from './queries';
