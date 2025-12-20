import { keccak256, toBytes, pad, getAddress } from 'viem';
import { indexer, activeContracts } from '@/config';
import { HEARTBEAT_MANAGER_EVENTS } from './events';

/**
 * Helper utilities for building Conduit Indexer queries
 * These utilities make event queries more maintainable by using ABIs
 */

// =============================================================================
// Event Signature Helpers
// =============================================================================

/**
 * Calculate event signature hash from event signature string
 *
 * This function strips out 'indexed' keywords and parameter names before hashing.
 *
 * @param signature - Event signature with optional 'indexed' and parameter names
 *   e.g., "Transfer(address indexed from, address indexed to, uint256 value)"
 * @returns Event signature hash (keccak256)
 *
 * @example
 * getEventSignatureHash("Transfer(address indexed from, address indexed to, uint256 value)")
 * // Returns same as: keccak256("Transfer(address,address,uint256)")
 */
export function getEventSignatureHash(signature: string): `0x${string}` {
  // Extract event name and parameters
  const match = signature.match(/^(\w+)\((.*)\)$/);
  if (!match) {
    throw new Error(`Invalid event signature format: ${signature}`);
  }

  const [, eventName, paramsStr] = match;

  // Parse parameters and extract only types (remove 'indexed' and parameter names)
  const params = paramsStr
    .split(',')
    .map((param) => {
      // Remove leading/trailing whitespace
      param = param.trim();

      // Remove 'indexed' keyword
      param = param.replace(/\bindexed\b\s*/g, '');

      // Extract just the type (first word)
      // e.g., "address from" -> "address"
      // e.g., "uint256" -> "uint256"
      const type = param.split(/\s+/)[0];

      return type;
    })
    .filter((type) => type.length > 0);

  // Reconstruct canonical signature
  const canonicalSignature = `${eventName}(${params.join(',')})`;

  return keccak256(toBytes(canonicalSignature));
}

/**
 * Extract event signature from ABI entry
 * @param abiEntry - ABI event entry
 * @returns Event signature hash
 *
 * @example
 * const abi = [{ type: 'event', name: 'Transfer', inputs: [...] }];
 * const hash = getEventHashFromABI(abi[0]);
 */
export function getEventHashFromABI(abiEntry: any): `0x${string}` {
  if (abiEntry.type !== 'event') {
    throw new Error('ABI entry must be of type "event"');
  }

  // Build signature: EventName(type1,type2,...)
  const inputs = abiEntry.inputs
    .map((input: any) => input.type)
    .join(',');
  const signature = `${abiEntry.name}(${inputs})`;

  return getEventSignatureHash(signature);
}

// =============================================================================
// Address Padding Helpers
// =============================================================================

/**
 * Pad an Ethereum address to 32 bytes for topic matching
 * @param address - Ethereum address (0x...)
 * @returns Padded address (32 bytes / 64 hex chars)
 *
 * @example
 * padAddressTo32Bytes('0x0c57cb3432f3a493ecf3f465260139a2edbc753d')
 * // Returns: '0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d'
 */
export function padAddressTo32Bytes(address: string): `0x${string}` {
  // Remove 0x prefix, pad to 64 chars (32 bytes), add 0x back
  const cleanAddress = address.toLowerCase().replace('0x', '');
  return `0x${cleanAddress.padStart(64, '0')}` as `0x${string}`;
}

/**
 * Strip padding from a 32-byte topic to get the 20-byte address
 * @param paddedTopic - Padded topic from logs (32 bytes)
 * @returns Ethereum address (20 bytes)
 *
 * @example
 * stripAddressPadding('0x0000000000000000000000000c57cb3432f3a493ecf3f465260139a2edbc753d')
 * // Returns: '0x0c57cb3432f3a493ecf3f465260139a2edbc753d'
 */
export function stripAddressPadding(paddedTopic: string): `0x${string}` {
  // Take last 40 hex chars (20 bytes) and add 0x
  const cleanTopic = paddedTopic.replace('0x', '');
  return `0x${cleanTopic.slice(-40)}` as `0x${string}`;
}

// =============================================================================
// Query Builder Helpers
// =============================================================================

/**
 * Build a WHERE clause for event filtering
 *
 * ⚠️ SECURITY: Always filters by contract address to prevent querying entire chain
 *
 * @param chainId - Chain ID
 * @param contractAddress - Contract address (REQUIRED - never query without this!)
 * @param eventSignature - Event signature string or hash
 * @param indexedParams - Optional indexed parameters to filter by
 * @returns SQL WHERE clause
 *
 * @example
 * buildEventWhereClause(
 *   78651,
 *   '0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46',
 *   'OperatorRegistered(address,string)',
 *   { operator: '0x0c57cb3432f3a493ecf3f465260139a2edbc753d' }
 * )
 */
export function buildEventWhereClause(
  chainId: number,
  contractAddress: string,
  eventSignature: string,
  indexedParams?: Record<string, string>
): string {
  // Validate contract address is provided
  if (!contractAddress || contractAddress.trim() === '') {
    throw new Error(
      'Contract address is required. Never query events without filtering by contract address!'
    );
  }

  // Validate it's a valid hex address
  if (!isHexString(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  // Calculate event hash if not already a hash
  const eventHash = eventSignature.startsWith('0x')
    ? eventSignature
    : getEventSignatureHash(eventSignature);

  let whereClause = `
    chain = ${chainId}
    AND address = '${contractAddress.toLowerCase()}'
    AND topics[1] = '${eventHash}'
  `;

  // Add indexed parameter filters
  if (indexedParams) {
    Object.entries(indexedParams).forEach(([key, value], index) => {
      const topicIndex = index + 2; // topics[2], topics[3], etc.
      const paddedValue = padAddressTo32Bytes(value);
      whereClause += `\n    AND topics[${topicIndex}] = '${paddedValue}'`;
    });
  }

  return whereClause;
}

/**
 * Build a complete event query
 *
 * ⚠️ SECURITY: Always filters by contract address to prevent querying entire chain
 *
 * @param chainId - Chain ID
 * @param contractAddress - Contract address (REQUIRED - never query without this!)
 * @param eventSignature - Event signature string or hash
 * @param options - Query options
 * @returns SQL query string
 */
export function buildEventQuery(
  chainId: number,
  contractAddress: string,
  eventSignature: string,
  options: {
    selectFields?: string[];
    indexedParams?: Record<string, string>;
    orderBy?: string;
    limit?: number;
  } = {}
): string {
  const {
    selectFields = ['topics[2] as param1', 'block_num', 'block_timestamp', 'tx_hash'],
    indexedParams,
    orderBy = 'block_num DESC',
    limit = 50,
  } = options;

  const whereClause = buildEventWhereClause(
    chainId,
    contractAddress,
    eventSignature,
    indexedParams
  );

  return `
    SELECT
      ${selectFields.join(',\n      ')}
    FROM logs
    WHERE
      ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ${limit}
  `.trim();
}

// =============================================================================
// Type Helpers
// =============================================================================

/**
 * Type guard to check if a value is a valid hex string
 */
export function isHexString(value: any): value is `0x${string}` {
  return (
    typeof value === 'string' &&
    value.startsWith('0x') &&
    value.length > 2 &&
    /^0x[0-9a-fA-F]+$/.test(value)
  );
}

/**
 * Validate and normalize an Ethereum address
 */
export function normalizeAddress(address: string): `0x${string}` {
  try {
    return getAddress(address) as `0x${string}`;
  } catch (error) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
}

// =============================================================================
// Contract-Specific Query Builders
// =============================================================================

/**
 * Configuration for contract-specific event queries
 * Ensures we always query the correct contract for each event type
 */
export type ContractEventConfig = {
  chainId: number;
  contractAddress: string;
  contractName: string; // For error messages
};

/**
 * Build a query for events from a specific contract
 * This is a type-safe wrapper that ensures contract filtering
 *
 * @param config - Contract configuration
 * @param eventSignature - Event signature string or hash
 * @param options - Query options
 * @returns SQL query string
 *
 * @example
 * import { contracts, indexer } from '@/config';
 *
 * const query = buildContractEventQuery(
 *   {
 *     chainId: indexer.chainId,
 *     contractAddress: activeContracts.stakingOperators,
 *     contractName: 'StakingOperators'
 *   },
 *   'OperatorRegistered(address,string)',
 *   { limit: 10 }
 * );
 */
export function buildContractEventQuery(
  config: ContractEventConfig,
  eventSignature: string,
  options?: {
    selectFields?: string[];
    indexedParams?: Record<string, string>;
    orderBy?: string;
    limit?: number;
  }
): string {
  // Validate contract config
  if (!config.contractAddress || config.contractAddress.trim() === '') {
    throw new Error(
      `Contract address is required for ${config.contractName} events. Never query without specifying a contract!`
    );
  }

  return buildEventQuery(
    config.chainId,
    config.contractAddress,
    eventSignature,
    options
  );
}

// =============================================================================
// HeartbeatManager-Specific Query Builders
// =============================================================================

/**
 * Helper for building HeartbeatManager event queries
 *
 * WHEN TO USE:
 * - OperatorVoted events (filter by specific operator)
 * - Any HeartbeatManager event indexed by operator address
 *
 * HOW IT WORKS:
 * - Filters events by operator address in topics[3]
 * - Returns SQL query string for Conduit Indexer
 *
 * DON'T USE FOR:
 * - RoundStarted events (see getRoundStartedEvents query instead - requires special handling)
 *
 * @param eventName - Event from HEARTBEAT_MANAGER_EVENTS
 * @param operatorAddress - Operator to filter by
 * @param options - Query customization (fields, limit, ordering)
 * @returns SQL query string
 */
export function buildHeartbeatEventQuery(
  eventName: keyof typeof HEARTBEAT_MANAGER_EVENTS,
  operatorAddress: string,
  options: {
    selectFields?: string[];
    limit?: number;
    orderBy?: string;
    fromBlock?: number;
  } = {}
): string {
  const {
    selectFields = ['topics[2] as heartbeatKey', 'topics[3] as operator', 'block_num', 'block_timestamp', 'tx_hash'],
    limit = 50,
    orderBy = 'block_num DESC',
    fromBlock,
  } = options;

  const eventSignature = getEventSignatureHash(HEARTBEAT_MANAGER_EVENTS[eventName]);
  const paddedOperator = padAddressTo32Bytes(operatorAddress);

  let whereClause = `
      chain = ${indexer.chainId}
      AND address = '${activeContracts.heartbeatManager.toLowerCase()}'
      AND topics[1] = '${eventSignature}'
      AND topics[3] = '${paddedOperator}'`;

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
