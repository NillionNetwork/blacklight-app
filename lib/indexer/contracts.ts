import { indexer, activeContracts } from '@/config';
import { ContractEventConfig } from './helpers';

/**
 * Pre-configured contract settings for indexer queries
 *
 * ⚠️ SECURITY: These configs ensure all queries are scoped to specific contracts
 *
 * Use these instead of manually specifying contract addresses to prevent errors
 * and ensure you never accidentally query the entire chain.
 *
 * @example
 * import { STAKING_CONTRACT, NILAV_ROUTER_CONTRACT } from './contracts';
 * import { buildContractEventQuery } from './helpers';
 *
 * const query = buildContractEventQuery(
 *   STAKING_CONTRACT,
 *   'OperatorRegistered(address,string)'
 * );
 */

/**
 * StakingOperators contract configuration
 * Use for: OperatorRegistered, Staked, Unstaked, etc.
 */
export const STAKING_CONTRACT: ContractEventConfig = {
  chainId: indexer.chainId,
  contractAddress: activeContracts.stakingOperators,
  contractName: 'StakingOperators',
} as const;

/**
 * NilAVRouter contract configuration
 * Use for: HTXSubmitted, HTXAssigned, HTXResponded
 */
export const NILAV_ROUTER_CONTRACT: ContractEventConfig = {
  chainId: indexer.chainId,
  contractAddress: activeContracts.nilavRouter,
  contractName: 'NilAVRouter',
} as const;

/**
 * Helper function to validate a contract config
 * Throws if the contract address is missing
 */
export function validateContractConfig(config: ContractEventConfig): void {
  if (!config.contractAddress || config.contractAddress.trim() === '') {
    throw new Error(
      `${config.contractName} contract address not configured! Check config/index.ts`
    );
  }
}

// Validate on import to catch configuration errors early
validateContractConfig(STAKING_CONTRACT);
validateContractConfig(NILAV_ROUTER_CONTRACT);
