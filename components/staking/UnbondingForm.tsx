'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useSwitchChain } from 'wagmi';
import { formatUnits } from 'viem';
import { Button, Modal } from '@/components/ui';
import { ConnectWallet } from '@/components/auth';
import { TransactionTracker } from '@/components/ui/TransactionTracker';
import { useStakingOperators, useUnbondingInfo, useUnstakeDelay } from '@/lib/hooks/useStakingOperators';
import { activeContracts, activeNetwork } from '@/config';
import { toast } from 'sonner';

interface UnbondingFormProps {
  /**
   * The operator address to check unbonding for
   */
  operatorAddress: `0x${string}`;
  /**
   * Optional callback when withdrawal is successful
   */
  onWithdrawSuccess?: (operatorAddress: `0x${string}`) => void;
  /**
   * Optional callback when an error occurs
   */
  onError?: (error: string) => void;
}

export function UnbondingForm({
  operatorAddress,
  onWithdrawSuccess,
  onError,
}: UnbondingFormProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { switchChain } = useSwitchChain();
  const { withdrawUnstaked } = useStakingOperators();
  const { unbonding, isLoading: isLoadingUnbonding } = useUnbondingInfo(operatorAddress);
  const { delay: unstakeDelay, isLoading: isLoadingDelay } = useUnstakeDelay();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    step: 'requesting' | 'confirming' | 'complete' | 'error';
    hash?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const tokenSymbol = activeContracts.nilTokenSymbol;

  // Calculate time remaining for unbonding
  useEffect(() => {
    if (!unbonding || unbonding.amount === 0n) {
      setTimeRemaining(0);
      return;
    }

    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000);
      const releaseTime = Number(unbonding.releaseTime);
      const remaining = Math.max(0, releaseTime - now);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [unbonding]);

  const hasUnbonding = unbonding && unbonding.amount > 0n;
  const canWithdraw = hasUnbonding && timeRemaining === 0;

  // Format unstake delay for display
  const formatUnstakeDelay = (): string => {
    if (isLoadingDelay) return 'Loading...';
    if (!unstakeDelay) return 'an';

    const days = Number(unstakeDelay) / 86400;

    // Handle whole days
    if (days === Math.floor(days)) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }

    // Handle fractional days (show in hours if less than 1 day)
    if (days < 1) {
      const hours = Number(unstakeDelay) / 3600;
      return `${Math.floor(hours)} hour${hours !== 1 ? 's' : ''}`;
    }

    // Round to 1 decimal for partial days
    return `${days.toFixed(1)} days`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return 'Ready to withdraw';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      onError?.('Please connect your wallet');
      return;
    }

    if (!canWithdraw) {
      setError('Unbonding period has not elapsed');
      onError?.('Unbonding period has not elapsed');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setShowTxModal(true);
    setTxStatus({ step: 'requesting' });

    try {
      // Switch to correct chain if needed
      if (chainId !== activeNetwork.id) {
        try {
          await switchChain({ chainId: activeNetwork.id });
        } catch (switchError: any) {
          throw new Error('Please switch to Blacklight Testnet to continue');
        }
      }

      await withdrawUnstaked(operatorAddress, (step, data) => {
        if (step === 'withdrawing') {
          setTxStatus({ step: 'requesting' });
        } else if (step === 'confirming' && data?.withdrawHash) {
          setTxStatus({ step: 'confirming', hash: data.withdrawHash });
        }
      });

      setTxStatus({ step: 'complete' });
      onWithdrawSuccess?.(operatorAddress);
    } catch (err: any) {
      // Keep the transaction hash if we have it
      setTxStatus(prev => ({ ...prev, step: 'error', hash: prev?.hash }));
      setError(err.message || 'Failed to withdraw');
      onError?.(err.message || 'Failed to withdraw');
    } finally {
      setIsProcessing(false);
    }
  };

  // Not connected - show wallet connection prompt
  if (!isConnected) {
    return (
      <div>
        <label className="setup-label">Connect Wallet</label>
        <p className="setup-help-text" style={{ marginBottom: '1.5rem' }}>
          You need to connect your wallet to view and withdraw unbonding tokens.
        </p>
        <ConnectWallet size="large" />
      </div>
    );
  }

  // No unbonding tokens
  if (!hasUnbonding) {
    return (
      <div>
        {/* Info Bar: Wallet */}
        <div className="staking-info-bar">
          <div className="staking-info-card">
            <div className="staking-info-label">Connected</div>
            <div className="staking-info-content">
              <code className="staking-info-address">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address || '');
                  toast.success('Wallet address copied');
                }}
                title="Copy address"
                className="staking-copy-btn"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="unstaking-empty-state">
          No unbonding tokens for this operator
        </div>

        <div className="unstaking-info-box" style={{ marginTop: '1rem' }}>
          <div className="unstaking-info-line">
            ℹ️ When you unstake tokens, they enter a {formatUnstakeDelay()} unbonding period.
          </div>
          <div className="unstaking-info-line">
            Tokens can be withdrawn here once the unbonding period completes.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Info Bar: Wallet */}
      <div className="staking-info-bar">
        <div className="staking-info-card">
          <div className="staking-info-label">Connected</div>
          <div className="staking-info-content">
            <code className="staking-info-address">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(address || '');
                toast.success('Wallet address copied');
              }}
              title="Copy address"
              className="staking-copy-btn"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Unbonding Section */}
      <div className="unstaking-unbonding-box">
        <h3 className="unstaking-unbonding-title">
          Unbonding Tokens
        </h3>
        <div className="unstaking-unbonding-row">
          <span className="unstaking-unbonding-label">Amount: </span>
          <span className="unstaking-unbonding-value">
            {formatUnits(unbonding.amount, activeContracts.nilTokenDecimals)} {tokenSymbol}
          </span>
        </div>
        <div className="unstaking-unbonding-row">
          <span className="unstaking-unbonding-label">Time Remaining: </span>
          <span className={`unstaking-unbonding-value ${canWithdraw ? 'unstaking-unbonding-value-ready' : ''}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        {canWithdraw && (
          <div className="unstaking-unbonding-row" style={{ marginTop: '0.5rem' }}>
            <span className="unstaking-unbonding-label">Status: </span>
            <span className="unstaking-unbonding-value unstaking-unbonding-value-ready">
              ✓ Ready to withdraw
            </span>
          </div>
        )}
        <Button
          variant="primary"
          size="medium"
          onClick={handleWithdraw}
          disabled={!canWithdraw || isProcessing}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {canWithdraw ? 'Withdraw Tokens' : 'Waiting for Unbonding Period'}
        </Button>
      </div>

      <div className="unstaking-info-box" style={{ marginTop: '1rem' }}>
        <div className="unstaking-info-line">
          ℹ️ Unstaked tokens have a {formatUnstakeDelay()} unbonding period for network security.
        </div>
        <div className="unstaking-info-line">
          You can withdraw your tokens once the countdown reaches zero.
        </div>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={showTxModal}
        onClose={() => {
          // Prevent closing during active transaction (requesting/confirming)
          // Only allow closing when complete or error state
          if (txStatus?.step === 'complete' || txStatus?.step === 'error' || error) {
            // Don't auto-close - user must click button
            return;
          }
        }}
        title={
          txStatus?.step === 'complete'
            ? '✓ Withdrawal Complete'
            : 'Withdrawing Tokens'
        }
      >
        {error ? (
          <div>
            <div className="unstaking-error-box">
              <div className="unstaking-error-title">
                Transaction Failed
              </div>
              <div className="unstaking-error-message">{error}</div>
              {txStatus?.hash && (
                <div style={{ marginTop: '1rem' }}>
                  <a
                    href={`${activeContracts.blockExplorer}/tx/${txStatus.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--nillion-primary)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    View on Explorer →
                  </a>
                </div>
              )}
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
                  handleWithdraw();
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
                  label: 'Withdraw Tokens',
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
                      : 'Tokens withdrawn successfully',
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
