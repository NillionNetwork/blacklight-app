import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { useQueryClient } from '@tanstack/react-query';
import { parseUnits, BaseError, ContractFunctionRevertedError } from 'viem';
import { contracts, nilavTestnet } from '@/config';
import { stakingOperatorsABI } from '@/lib/abis/StakingOperators';

// Helper to parse contract errors into user-friendly messages
function parseContractError(error: any): string {
  if (error instanceof BaseError) {
    const revertError = error.walk(err => err instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? '';

      // Map contract errors to user-friendly messages
      const errorMessages: Record<string, string> = {
        'NoStake': 'You must stake tokens before registering as an operator. Please complete Step 5 first.',
        'ZeroAmount': 'Stake amount must be greater than zero.',
        'ZeroAddress': 'Invalid operator address.',
        'NotActive': 'This operator is not active.',
        'OperatorJailed': 'This operator has been jailed and cannot accept stakes.',
        'DifferentStaker': 'This operator already has a different staker.',
        'InsufficientStake': 'Insufficient stake amount.',
        'PendingUnbonding': 'There is a pending unbonding request.',
        'NotStaker': 'You are not the staker for this operator.',
        'NotReady': 'Unstake period has not elapsed yet.',
        'NoUnbonding': 'No unbonding request found.',
        'UnbondingExists': 'An unbonding request already exists.',
      };

      if (errorName && errorMessages[errorName]) {
        return errorMessages[errorName];
      }

      return `Contract error: ${errorName || 'Unknown error'}`;
    }
  }

  // Check for user rejection
  if (error?.message?.includes('User rejected') || error?.code === 4001) {
    return 'Transaction was rejected';
  }

  // Check for insufficient funds
  if (error?.message?.includes('insufficient funds')) {
    return 'Insufficient funds to complete transaction';
  }

  return error?.shortMessage || error?.message || 'Transaction failed';
}

// ERC-20 ABI for approve
const erc20ABI = [
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
] as const;

export function useStakingOperators() {
  const { writeContractAsync } = useWriteContract();
  const config = useConfig();
  const queryClient = useQueryClient();

  /**
   * Register the connected wallet as an operator
   * @param metadataURI - URI pointing to operator metadata (can be public key or JSON metadata)
   */
  const registerOperator = async (metadataURI: string) => {
    try {
      const hash = await writeContractAsync({
        address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
        abi: stakingOperatorsABI,
        functionName: 'registerOperator',
        args: [metadataURI],
        chainId: nilavTestnet.id,
      });

      return { hash, success: true, error: null };
    } catch (error) {
      console.error('Error registering operator:', error);
      const message = parseContractError(error);
      throw new Error(message);
    }
  };

  /**
   * Stake TEST tokens to an operator
   * @param operatorAddress - Address of the operator to stake to
   * @param amount - Amount of TEST tokens to stake (in whole units, not wei)
   * @param onProgress - Optional callback for progress updates
   */
  const stakeTo = async (
    operatorAddress: `0x${string}`,
    amount: string,
    onProgress?: (
      step: 'approving' | 'confirming_approve' | 'staking' | 'confirming_stake',
      data?: { approveHash?: `0x${string}`; stakeHash?: `0x${string}` }
    ) => void
  ) => {
    let approveHash: `0x${string}` | undefined;

    try {
      // Convert amount to wei (18 decimals)
      const amountInWei = parseUnits(amount, 18);

      console.log('=== STAKING PROCESS STARTED ===');
      console.log('Step 1: Approving TEST tokens...');
      onProgress?.('approving');

      // First, approve the StakingOperators contract to spend NIL tokens
      try {
        approveHash = await writeContractAsync({
          address: contracts.nilavTestnet.nilToken as `0x${string}`,
          abi: erc20ABI,
          functionName: 'approve',
          args: [contracts.nilavTestnet.stakingOperators as `0x${string}`, amountInWei],
          chainId: nilavTestnet.id,
        });

        console.log('✓ Approval transaction submitted:', approveHash);
        console.log('  Explorer:', `${contracts.nilavTestnet.blockExplorer}/tx/${approveHash}`);
        console.log('  Waiting for confirmation...');
        onProgress?.('confirming_approve', { approveHash });

        // Wait for approval to be confirmed on-chain
        const approveReceipt = await waitForTransactionReceipt(config, {
          hash: approveHash,
          chainId: nilavTestnet.id,
        });

        if (approveReceipt.status === 'reverted') {
          throw new Error('Approval transaction was reverted on-chain');
        }

        console.log('✓ Approval confirmed in block:', approveReceipt.blockNumber);
      } catch (error) {
        console.error('Approval transaction failed:', error);
        const message = parseContractError(error);
        throw new Error(message);
      }

      console.log('Step 2: Staking tokens to operator...');
      onProgress?.('staking');

      // Now stake the tokens
      let stakeHash: `0x${string}`;
      try {
        stakeHash = await writeContractAsync({
          address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
          abi: stakingOperatorsABI,
          functionName: 'stakeTo',
          args: [operatorAddress, amountInWei],
          chainId: nilavTestnet.id,
        });

        console.log('✓ Stake transaction submitted:', stakeHash);
        console.log('  Explorer:', `${contracts.nilavTestnet.blockExplorer}/tx/${stakeHash}`);
        console.log('  Waiting for confirmation...');
        onProgress?.('confirming_stake', { approveHash, stakeHash });

        // Wait for stake to be confirmed on-chain
        const stakeReceipt = await waitForTransactionReceipt(config, {
          hash: stakeHash,
          chainId: nilavTestnet.id,
        });

        if (stakeReceipt.status === 'reverted') {
          throw new Error('Stake transaction was reverted on-chain');
        }

        console.log('✓ Stake confirmed in block:', stakeReceipt.blockNumber);
        console.log('===============================');

        // Invalidate all stake-related queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['readContract'] });

        return { approveHash, stakeHash, success: true, error: null };
      } catch (error) {
        console.error('Stake transaction failed:', error);
        const message = parseContractError(error);
        throw new Error(message);
      }
    } catch (error) {
      // This catches both approval and staking errors
      // The specific error message is already set above
      throw error;
    }
  };

  /**
   * Request to unstake tokens from an operator
   * @param operatorAddress - Address of the operator to unstake from
   * @param amount - Amount of TEST tokens to unstake (in whole units, not wei)
   * @param onProgress - Optional callback for progress updates
   */
  const requestUnstake = async (
    operatorAddress: `0x${string}`,
    amount: string,
    onProgress?: (
      step: 'requesting' | 'confirming',
      data?: { requestHash?: `0x${string}` }
    ) => void
  ) => {
    try {
      const amountInWei = parseUnits(amount, 18);

      console.log('=== UNSTAKE REQUEST STARTED ===');
      console.log('Requesting unstake...');
      onProgress?.('requesting');

      const hash = await writeContractAsync({
        address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
        abi: stakingOperatorsABI,
        functionName: 'requestUnstake',
        args: [operatorAddress, amountInWei],
        chainId: nilavTestnet.id,
      });

      console.log('✓ Unstake request submitted:', hash);
      console.log('  Explorer:', `${contracts.nilavTestnet.blockExplorer}/tx/${hash}`);
      console.log('  Waiting for confirmation...');
      onProgress?.('confirming', { requestHash: hash });

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: nilavTestnet.id,
      });

      if (receipt.status === 'reverted') {
        throw new Error('Unstake request was reverted on-chain');
      }

      console.log('✓ Unstake request confirmed in block:', receipt.blockNumber);
      console.log('===============================');

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['readContract'] });

      return { hash, success: true, error: null };
    } catch (error) {
      console.error('Error requesting unstake:', error);
      const message = parseContractError(error);
      throw new Error(message);
    }
  };

  /**
   * Deactivate the operator (only callable by the operator themselves)
   */
  const deactivateOperator = async () => {
    try {
      const hash = await writeContractAsync({
        address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
        abi: stakingOperatorsABI,
        functionName: 'deactivateOperator',
        chainId: nilavTestnet.id,
      });

      return { hash, success: true };
    } catch (error) {
      console.error('Error deactivating operator:', error);
      throw error;
    }
  };

  /**
   * Withdraw unstaked tokens after the unbonding period
   * @param operatorAddress - Address of the operator to withdraw from
   * @param onProgress - Optional callback for progress updates
   */
  const withdrawUnstaked = async (
    operatorAddress: `0x${string}`,
    onProgress?: (
      step: 'withdrawing' | 'confirming',
      data?: { withdrawHash?: `0x${string}` }
    ) => void
  ) => {
    try {
      console.log('=== WITHDRAW UNSTAKED STARTED ===');
      console.log('Withdrawing unstaked tokens...');
      onProgress?.('withdrawing');

      const hash = await writeContractAsync({
        address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
        abi: stakingOperatorsABI,
        functionName: 'withdrawUnstaked',
        args: [operatorAddress],
        chainId: nilavTestnet.id,
      });

      console.log('✓ Withdraw transaction submitted:', hash);
      console.log('  Explorer:', `${contracts.nilavTestnet.blockExplorer}/tx/${hash}`);
      console.log('  Waiting for confirmation...');
      onProgress?.('confirming', { withdrawHash: hash });

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: nilavTestnet.id,
      });

      if (receipt.status === 'reverted') {
        throw new Error('Withdraw transaction was reverted on-chain');
      }

      console.log('✓ Withdraw confirmed in block:', receipt.blockNumber);
      console.log('===============================');

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['readContract'] });

      return { hash, success: true };
    } catch (error) {
      console.error('Error withdrawing unstaked tokens:', error);
      const message = parseContractError(error);
      throw new Error(message);
    }
  };

  return {
    registerOperator,
    stakeTo,
    requestUnstake,
    deactivateOperator,
    withdrawUnstaked,
  };
}

/**
 * Hook to read operator information
 * @param operatorAddress - Address of the operator to query
 */
export function useOperatorInfo(operatorAddress?: `0x${string}`) {
  const { data: operatorInfo, isLoading } = useReadContract({
    address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
    abi: stakingOperatorsABI,
    functionName: 'getOperatorInfo',
    args: operatorAddress ? [operatorAddress] : undefined,
    chainId: nilavTestnet.id,
  });

  return {
    operatorInfo: operatorInfo as { active: boolean; metadataURI: string } | undefined,
    isLoading,
  };
}

/**
 * Hook to check if an address is an active operator
 * @param operatorAddress - Address to check
 */
export function useIsActiveOperator(operatorAddress?: `0x${string}`) {
  const { data: isActive, isLoading } = useReadContract({
    address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
    abi: stakingOperatorsABI,
    functionName: 'isActiveOperator',
    args: operatorAddress ? [operatorAddress] : undefined,
    chainId: nilavTestnet.id,
  });

  return {
    isActive: isActive as boolean | undefined,
    isLoading,
  };
}

/**
 * Hook to get the stake amount for an operator
 * @param operatorAddress - Address of the operator
 */
export function useStakeOf(operatorAddress?: `0x${string}`) {
  const { data: stake, isLoading } = useReadContract({
    address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
    abi: stakingOperatorsABI,
    functionName: 'stakeOf',
    args: operatorAddress ? [operatorAddress] : undefined,
    chainId: nilavTestnet.id,
  });

  return {
    stake: stake as bigint | undefined,
    isLoading,
  };
}

/**
 * Hook to check if an operator is jailed
 * @param operatorAddress - Address of the operator
 */
export function useIsJailed(operatorAddress?: `0x${string}`) {
  const { data: isJailed, isLoading } = useReadContract({
    address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
    abi: stakingOperatorsABI,
    functionName: 'isJailed',
    args: operatorAddress ? [operatorAddress] : undefined,
    chainId: nilavTestnet.id,
  });

  return {
    isJailed: isJailed as boolean | undefined,
    isLoading,
  };
}

/**
 * Hook to get all active operators
 */
export function useActiveOperators() {
  const { data: operators, isLoading } = useReadContract({
    address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
    abi: stakingOperatorsABI,
    functionName: 'getActiveOperators',
    chainId: nilavTestnet.id,
  });

  return {
    operators: operators as `0x${string}`[] | undefined,
    isLoading,
  };
}

/**
 * Hook to get unbonding information for an operator
 * @param operatorAddress - Address of the operator
 */
export function useUnbondingInfo(operatorAddress?: `0x${string}`) {
  const { data: unbondingRaw, isLoading } = useReadContract({
    address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
    abi: stakingOperatorsABI,
    functionName: 'unbondings',
    args: operatorAddress ? [operatorAddress] : undefined,
    chainId: nilavTestnet.id,
  });

  // Contract returns array: [staker, amount, releaseTime]
  const unbonding = unbondingRaw
    ? {
        staker: (unbondingRaw as any)[0] as `0x${string}`,
        amount: (unbondingRaw as any)[1] as bigint,
        releaseTime: (unbondingRaw as any)[2] as bigint,
      }
    : undefined;

  return {
    unbonding,
    isLoading,
  };
}

/**
 * Hook to get the unstake delay period (in seconds)
 */
export function useUnstakeDelay() {
  const { data: delay, isLoading } = useReadContract({
    address: contracts.nilavTestnet.stakingOperators as `0x${string}`,
    abi: stakingOperatorsABI,
    functionName: 'unstakeDelay',
    chainId: nilavTestnet.id,
  });

  return {
    delay: delay as bigint | undefined,
    isLoading,
  };
}
