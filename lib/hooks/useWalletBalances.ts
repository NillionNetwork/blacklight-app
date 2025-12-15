import { useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { nilavTestnet, contracts } from '@/config';

// ERC20 ABI for balanceOf
const erc20ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Custom hook to fetch ETH and NIL token balances for a wallet address
 * @param address - The wallet address to check balances for
 * @returns Object containing ETH and token balances (formatted), plus refetch functions
 */
export function useWalletBalances(address?: `0x${string}`) {
  // Fetch ETH balance
  const {
    data: ethBalance,
    isLoading: isLoadingEth,
    refetch: refetchEthBalance,
  } = useBalance({
    address: address,
    chainId: nilavTestnet.id,
  });

  // Fetch staking token balance using contract read
  const {
    data: tokenBalance,
    isLoading: isLoadingToken,
    refetch: refetchTokenBalance,
  } = useReadContract({
    address: contracts.nilavTestnet.nilToken as `0x${string}`,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: nilavTestnet.id,
  });

  const ethBalanceFormatted = ethBalance
    ? parseFloat(formatUnits(ethBalance.value, 18))
    : 0;
  const tokenBalanceFormatted = tokenBalance
    ? parseFloat(formatUnits(tokenBalance as bigint, 18))
    : 0;

  return {
    ethBalance: ethBalanceFormatted,
    tokenBalance: tokenBalanceFormatted,
    isLoading: isLoadingEth || isLoadingToken,
    refetchEthBalance,
    refetchTokenBalance,
    refetchAll: async () => {
      await Promise.all([refetchEthBalance(), refetchTokenBalance()]);
    },
  };
}
