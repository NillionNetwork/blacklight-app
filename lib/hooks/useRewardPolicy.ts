import { useWriteContract, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { activeContracts, activeNetwork } from '@/config';
import { rewardPolicyABI } from '@/lib/abis/RewardPolicy';
import { BaseError, ContractFunctionRevertedError } from 'viem';

function parseRewardError(error: any): string {
  if (error instanceof BaseError) {
    const revertError = error.walk(
      (err) => err instanceof ContractFunctionRevertedError
    );
    if (revertError instanceof ContractFunctionRevertedError) {
      const name = revertError.data?.errorName ?? '';
      if (name) return `Contract error: ${name}`;
    }
  }
  if (error?.message?.includes('User rejected') || error?.code === 4001) {
    return 'Transaction was rejected';
  }
  if (error?.message?.includes('insufficient funds')) {
    return 'Insufficient funds for gas';
  }
  return error?.shortMessage || error?.message || 'Transaction failed';
}

export function useRewardPolicy() {
  const { writeContractAsync } = useWriteContract();
  const waitConfig = useConfig();

  const claim = async () => {
    try {
      const hash = await writeContractAsync({
        address: activeContracts.rewardPolicy as `0x${string}`,
        abi: rewardPolicyABI,
        functionName: 'claim',
        args: [],
        chainId: activeNetwork.id,
      });

      const receipt = await waitForTransactionReceipt(waitConfig, {
        hash,
        chainId: activeNetwork.id,
      });

      if (receipt.status === 'reverted') {
        throw new Error('Claim transaction reverted');
      }

      return { hash, success: true, error: null };
    } catch (error) {
      throw new Error(parseRewardError(error));
    }
  };

  return { claim };
}
