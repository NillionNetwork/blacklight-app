'use client';

import { useState } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useSwitchChain, useConfig } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { Button, Modal } from '@/components/ui';
import { ConnectWallet } from '@/components/auth';
import { TransactionTracker } from '@/components/ui/TransactionTracker';
import { activeContracts, activeNetwork } from '@/config';
import { rewardPolicyABI } from '@/lib/abis/RewardPolicy';
import { stakingOperatorsABI } from '@/lib/abis/StakingOperators';
import { getRewardClaimHistory, formatTimeAgo } from '@/lib/indexer';
import { useRewardPolicy } from '@/lib/hooks';

interface RewardsTabProps {
  operatorAddress: `0x${string}`;
}

export function RewardsTab({ operatorAddress }: RewardsTabProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { switchChain } = useSwitchChain();
  const wagmiConfig = useConfig();
  const { claim } = useRewardPolicy();
  const queryClient = useQueryClient();

  const tokenSymbol = activeContracts.nilTokenSymbol;
  const tokenDecimals = activeContracts.nilTokenDecimals;

  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    step: 'requesting' | 'confirming' | 'complete' | 'error';
    hash?: string;
  } | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: stakerAddress } = useQuery({
    queryKey: ['staker-for-operator', operatorAddress],
    queryFn: async () => {
      const { readContract } = await import('wagmi/actions');
      const staker = await readContract(wagmiConfig, {
        address: activeContracts.stakingOperators as `0x${string}`,
        abi: stakingOperatorsABI,
        functionName: 'operatorStaker',
        args: [operatorAddress],
        chainId: activeNetwork.id,
      });
      return (staker as string)?.toLowerCase();
    },
    enabled: !!operatorAddress,
  });

  const { data: claimable } = useQuery({
    queryKey: ['rewards-claimable', stakerAddress],
    queryFn: async () => {
      if (!stakerAddress) return 0n;
      const { readContract } = await import('wagmi/actions');
      const res = await readContract(wagmiConfig, {
        address: activeContracts.rewardPolicy as `0x${string}`,
        abi: rewardPolicyABI,
        functionName: 'rewards',
        args: [stakerAddress as `0x${string}`],
        chainId: activeNetwork.id,
      });
      return res as bigint;
    },
    enabled: !!stakerAddress,
  });

  const { data: accountingFrozen } = useQuery({
    queryKey: ['rewards-accounting', operatorAddress],
    queryFn: async () => {
      const { readContract } = await import('wagmi/actions');
      const frozen = await readContract(wagmiConfig, {
        address: activeContracts.rewardPolicy as `0x${string}`,
        abi: rewardPolicyABI,
        functionName: 'accountingFrozen',
        args: [],
        chainId: activeNetwork.id,
      });
      return frozen as boolean;
    },
    enabled: true,
  });

  const { data: claimHistory } = useQuery({
    queryKey: ['rewards-claimed', stakerAddress],
    queryFn: () =>
      stakerAddress
        ? getRewardClaimHistory(stakerAddress, activeContracts.rewardPolicyDeploymentBlock, 20)
        : { data: [] as any[] },
    enabled: !!stakerAddress,
  });

  const handleClaim = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }
    if (!stakerAddress || address.toLowerCase() !== stakerAddress) {
      setError('Connected wallet must be the staker for this operator');
      return;
    }
    setError(null);
    setIsProcessing(true);
    setShowTxModal(true);
    setTxStatus({ step: 'requesting' });

    try {
      if (chainId !== activeNetwork.id) {
        await switchChain({ chainId: activeNetwork.id });
      }

      const result = await claim();
      setTxStatus({ step: 'complete', hash: result.hash });
      queryClient.invalidateQueries({ queryKey: ['rewards-claimable', stakerAddress] });
      queryClient.invalidateQueries({ queryKey: ['rewards-claimed', stakerAddress] });
    } catch (err: any) {
      setTxStatus(prev => ({ ...prev, step: 'error' }));
      setError(err?.message || 'Failed to claim');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (value?: bigint) => {
    if (value === undefined) return '0';
    return formatUnits(value, tokenDecimals);
  };

  const renderHistory = () => {
    const entries =
      claimHistory?.data?.map((e, idx) => ({
        amount: e.amount,
        timestamp: e.block_timestamp,
        tx: e.tx_hash,
        key: `${e.tx_hash || 'tx'}-${idx}`,
      })) || [];

    if (entries.length === 0) {
      return (
        <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6, fontSize: '0.875rem' }}>
          No claims yet
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {entries.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--nillion-primary)' }}>
                Claimed {formatUnits(BigInt(item.amount || '0'), tokenDecimals)} {tokenSymbol}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                {formatTimeAgo(item.timestamp)}
              </div>
            </div>
            <a
              href={`${activeContracts.blockExplorer}/tx/${item.tx}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--nillion-primary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                opacity: 0.8,
              }}
            >
              View tx →
            </a>
          </div>
        ))}
      </div>
    );
  };

  const stakerMismatch = !!(
    stakerAddress &&
    address &&
    address.toLowerCase() !== stakerAddress
  );
  const hasClaimable = claimable !== undefined && claimable > 0n;
  const isConnectedStaker = !!address && !!stakerAddress && address.toLowerCase() === stakerAddress;
  const disableReason = !isConnected
    ? 'Connect the staker wallet to claim'
    : stakerMismatch
    ? 'Connect the staker wallet to claim'
    : accountingFrozen
    ? 'Accounting is frozen'
    : !hasClaimable
    ? 'No rewards to claim'
    : '';

  return (
    <div>
      <div className="staking-info-bar">
        <div className="staking-info-card">
          <div className="staking-info-label">Operator</div>
          <div className="staking-info-content">
            <code className="staking-info-address">
              {operatorAddress.slice(0, 6)}...{operatorAddress.slice(-4)}
            </code>
          </div>
        </div>
        <div className="staking-info-card">
          <div className="staking-info-label">Staker Claimable</div>
          <div
            className="staking-info-content"
            style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--nillion-primary)' }}
          >
            {formatAmount(claimable)} {tokenSymbol}
          </div>
        </div>
      </div>

      <div className="unstaking-info-box" style={{ marginTop: '0.75rem' }}>
        <div className="unstaking-info-line">
          Staker for this operator: {stakerAddress || 'resolving...'}
        </div>
        {stakerMismatch && (
          <div className="unstaking-info-line" style={{ color: '#ff6b6b' }}>
            Connect the staker wallet to claim rewards.
          </div>
        )}
      </div>

      {isConnected ? (
        <div className="unstaking-unbonding-box" style={{ marginTop: '1rem' }}>
          <Button
            variant="primary"
            size="medium"
            onClick={handleClaim}
            disabled={
              isProcessing ||
              !hasClaimable ||
              accountingFrozen ||
              !isConnectedStaker
            }
            style={{ width: '100%' }}
          >
            {isProcessing ? 'Claiming...' : 'Claim Rewards'}
          </Button>
          {disableReason && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.75 }}>
              {disableReason}
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <ConnectWallet size="large" />
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', opacity: 0.9 }}>
          Staker Rewards History
        </h3>
        {renderHistory()}
      </div>

      <Modal
        isOpen={showTxModal}
        onClose={() => {
          if (txStatus?.step === 'complete' || txStatus?.step === 'error') {
            setShowTxModal(false);
            setTxStatus(null);
            setError(null);
          }
        }}
        title={txStatus?.step === 'complete' ? '✓ Rewards Claimed' : 'Claiming Rewards'}
      >
        {error ? (
          <div>
            <div className="unstaking-error-box">
              <div className="unstaking-error-title">
                Transaction Failed
              </div>
              <div className="unstaking-error-message">{error}</div>
            </div>
            <div className="unstaking-modal-buttons">
              <Button
                variant="outline"
                size="medium"
                onClick={() => {
                  setShowTxModal(false);
                  setError(null);
                  setTxStatus(null);
                }}
                className="unstaking-modal-button"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="medium"
                onClick={() => {
                  setError(null);
                  setTxStatus(null);
                  setShowTxModal(false);
                  handleClaim();
                }}
                className="unstaking-modal-button"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : txStatus ? (
          <div>
            <TransactionTracker
              transactions={[
                {
                  label: 'Claim Rewards',
                  status:
                    txStatus.step === 'requesting'
                      ? 'submitted'
                      : txStatus.step === 'confirming'
                      ? 'confirming'
                      : 'confirmed',
                  hash: txStatus.hash,
                  description:
                    txStatus.step === 'requesting'
                      ? 'Waiting for wallet...'
                      : txStatus.step === 'confirming'
                      ? 'Confirming on-chain...'
                      : 'Rewards claimed successfully',
                },
              ]}
            />
            {txStatus.step === 'complete' && (
              <Button
                variant="primary"
                size="medium"
                onClick={() => {
                  setShowTxModal(false);
                  setTxStatus(null);
                }}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Done
              </Button>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
