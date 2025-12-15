import { useEffect, useState } from 'react';
import { getPublicClient } from '@wagmi/core';
import { useConfig } from 'wagmi';
import { activeContracts, activeNetwork } from '@/config';
import { stakingOperatorsABI } from '@/lib/abis/StakingOperators';
import { getStakedEvents } from '@/lib/indexer';

interface StakedOperator {
  /**
   * The operator/node address
   */
  operator: `0x${string}`;
  /**
   * Current stake amount (in wei)
   */
  stake: bigint;
  /**
   * The operator's metadata URI (nodeAddress or JSON metadata)
   */
  metadataURI?: string;
  /**
   * Whether the operator is currently active
   */
  isActive?: boolean;
}

/**
 * Hook to discover all operators a user has staked to using the indexer
 *
 * This uses indexer-based discovery to find operators:
 * 1. Queries StakedTo events from the indexer filtered by user's wallet address
 * 2. Extracts unique operator addresses from events
 * 3. Verifies current stake amounts for each operator
 * 4. Returns only operators with active stakes (stake > 0)
 *
 * Benefits over previous RPC-based approach:
 * - No block range limitations (queries from contract deployment)
 * - Much faster (SQL-based vs RPC event queries)
 * - No rate limiting issues
 * - Consistent with HTX Activity tab approach
 *
 * NOTE: Queries a large number of events (500) to ensure we find all unique operators,
 * since users may have staked to the same operator multiple times.
 *
 * @param userAddress - The wallet address to query staked operators for
 */
export function useUserStakedOperators(userAddress?: `0x${string}`) {
  const config = useConfig();
  const [operators, setOperators] = useState<StakedOperator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAddress) {
      setOperators([]);
      setIsLoading(false);
      return;
    }

    async function fetchOperators() {
      try {
        setIsLoading(true);
        setError(null);

        const publicClient = getPublicClient(config, {
          chainId: activeNetwork.id,
        });

        if (!publicClient) {
          throw new Error('Public client not available');
        }

        // Step 1: Query StakedTo events from indexer
        // Use a large limit (500) to ensure we capture all unique operators
        // since users may have staked to the same operator multiple times
        const fromBlock = activeContracts.stakingOperatorsDeploymentBlock;
        const limit = 500; // Large enough to find all operators
        const stakedEventsResult = await getStakedEvents(
          userAddress!, // Safe because we return early if undefined
          fromBlock,
          limit
        );

        if (!stakedEventsResult.data || stakedEventsResult.data.length === 0) {
          setOperators([]);
          return;
        }

        // Step 2: Extract unique operator addresses
        const operatorSet = new Set<`0x${string}`>();
        stakedEventsResult.data.forEach((event) => {
          if (event.operator) {
            operatorSet.add(event.operator as `0x${string}`);
          }
        });

        // Step 3: For each operator, get current stake and metadata
        const operatorPromises = Array.from(operatorSet).map(async (op) => {
          try {
            // Get current stake amount
            const stake = (await publicClient.readContract({
              address: activeContracts.stakingOperators as `0x${string}`,
              abi: stakingOperatorsABI,
              functionName: 'stakeOf',
              args: [op],
            })) as bigint;

            // Get operator info (metadata and active status)
            const operatorInfo = (await publicClient.readContract({
              address: activeContracts.stakingOperators as `0x${string}`,
              abi: stakingOperatorsABI,
              functionName: 'getOperatorInfo',
              args: [op],
            })) as { active: boolean; metadataURI: string };

            return {
              operator: op,
              stake,
              metadataURI: operatorInfo.metadataURI,
              isActive: operatorInfo.active,
            };
          } catch (err) {
            console.error(`Error fetching data for operator ${op}:`, err);
            // Return with zero stake if there's an error
            return {
              operator: op,
              stake: 0n,
            };
          }
        });

        const results = await Promise.all(operatorPromises);

        // Step 4: Filter to only operators with active stake
        const activeOperators = results.filter((r) => r.stake > 0n);

        setOperators(activeOperators);
      } catch (err) {
        const errorMessage = (err as Error).message;
        console.error('Error fetching staked operators:', err);

        // Provide user-friendly error messages
        if (
          errorMessage.includes('timeout') ||
          errorMessage.includes('timed out')
        ) {
          setError(
            'Request timed out. This can happen when querying events. Please refresh the page to try again.'
          );
        } else if (errorMessage.includes('rate limit')) {
          setError(
            'Rate limit exceeded. Please wait a moment and refresh the page.'
          );
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchOperators();
  }, [userAddress, config]);

  return {
    operators,
    isLoading,
    error,
  };
}
