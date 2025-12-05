import { useEffect, useState } from 'react';
import { getPublicClient } from '@wagmi/core';
import { useConfig } from 'wagmi';
import { contracts, nilavTestnet } from '@/config';
import { stakingOperatorsABI } from '@/lib/abis/StakingOperators';

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
   * The operator's metadata URI (public key or JSON metadata)
   */
  metadataURI?: string;
  /**
   * Whether the operator is currently active
   */
  isActive?: boolean;
}

/**
 * Hook to discover all operators a user has staked to by querying on-chain events
 *
 * This uses event-based discovery to find operators:
 * 1. Queries StakedTo events filtered by user's wallet address
 * 2. Extracts unique operator addresses from events
 * 3. Verifies current stake amounts for each operator
 * 4. Returns only operators with active stakes (stake > 0)
 *
 * IMPORTANT LIMITATIONS:
 * - Currently queries only the last ~100k blocks to avoid RPC timeouts
 * - This means if you staked MORE than ~100k blocks ago, it won't be found
 * - This is a temporary workaround until proper event indexing is implemented
 *
 * TODO: This approach queries events on every page load which can be slow.
 * Future improvements:
 * - Implement a backend event indexer to cache operator lists
 * - Use The Graph protocol or similar indexing service
 * - Cache results in local storage with periodic revalidation
 * - Use wagmi's useContractEvent for real-time updates
 * - Store contract deployment block in config to query from that block
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
          chainId: nilavTestnet.id,
        });

        if (!publicClient) {
          throw new Error('Public client not available');
        }

        console.log('=== FETCHING USER STAKED OPERATORS ===');
        console.log('User address:', userAddress);

        // TODO: Replace event querying with indexed data source for better performance
        // Options:
        // 1. Backend API with event indexer
        // 2. The Graph subgraph
        // 3. Alchemy/Moralis webhook indexing
        // Current approach queries full event history which can be slow and hit rate limits

        // Step 1: Query StakedTo events filtered by user
        console.log('Step 1: Querying StakedTo events...');

        // Determine starting block for event query
        // Priority: deployment block > recent blocks (to avoid timeout)
        const currentBlock = await publicClient.getBlockNumber();
        let fromBlock: bigint;

        if (contracts.nilavTestnet.stakingOperatorsDeploymentBlock !== undefined) {
          // Use deployment block if configured
          fromBlock = BigInt(contracts.nilavTestnet.stakingOperatorsDeploymentBlock);
          console.log(`Using deployment block: ${fromBlock}`);
        } else {
          // Fallback: query last 100k blocks to avoid timeout
          // This is a temporary fix - proper solution is event indexing
          fromBlock = currentBlock > 100000n ? currentBlock - 100000n : 0n;
          console.log(`Using recent blocks (last 100k): from ${fromBlock}`);
          console.warn(
            'stakingOperatorsDeploymentBlock not configured. Querying only recent blocks. ' +
            'Stakes older than ~100k blocks may not be found.'
          );
        }

        console.log(`Querying from block ${fromBlock} to ${currentBlock}`);

        const stakedEvents = await publicClient.getContractEvents({
          address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
          abi: stakingOperatorsABI,
          eventName: 'StakedTo',
          args: {
            staker: userAddress,
          },
          fromBlock,
          toBlock: 'latest',
        });

        console.log(`Found ${stakedEvents.length} StakedTo events`);

        // Step 2: Extract unique operator addresses
        const operatorSet = new Set<`0x${string}`>();
        stakedEvents.forEach((event) => {
          if (event.args.operator) {
            operatorSet.add(event.args.operator);
          }
        });

        console.log(`Unique operators: ${operatorSet.size}`);

        // Step 3: For each operator, get current stake and metadata
        console.log('Step 2: Fetching current stake amounts...');
        const operatorPromises = Array.from(operatorSet).map(async (op) => {
          try {
            // Get current stake amount
            const stake = (await publicClient.readContract({
              address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
              abi: stakingOperatorsABI,
              functionName: 'stakeOf',
              args: [op],
            })) as bigint;

            // Get operator info (metadata and active status)
            const operatorInfo = (await publicClient.readContract({
              address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
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

        console.log(`Operators with active stake: ${activeOperators.length}`);
        console.log('===============================');

        setOperators(activeOperators);
      } catch (err) {
        const errorMessage = (err as Error).message;
        console.error('Error fetching staked operators:', err);

        // Provide user-friendly error messages
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          setError(
            'Request timed out. This can happen when querying events. Please refresh the page to try again.'
          );
        } else if (errorMessage.includes('rate limit')) {
          setError('Rate limit exceeded. Please wait a moment and refresh the page.');
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
