'use client';

import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { formatUnits } from 'viem';
import { Button, Input, Modal } from '@/components/ui';
import { ConnectWallet } from '@/components/auth';
import { TransactionTracker } from '@/components/ui/TransactionTracker';
import { useStakingOperators, useStakeOf, useUnstakeDelay } from '@/lib/hooks/useStakingOperators';
import { contracts } from '@/config';
import { toast } from 'sonner';

interface UnstakingFormProps {
  /**
   * The operator address to unstake from
   */
  operatorAddress: `0x${string}`;
  /**
   * Optional callback when unstake request is successful
   */
  onUnstakeSuccess?: (operatorAddress: `0x${string}`, amount: string) => void;
  /**
   * Optional callback when an error occurs
   */
  onError?: (error: string) => void;
}

export function UnstakingForm({
  operatorAddress,
  onUnstakeSuccess,
  onError,
}: UnstakingFormProps) {
  const { address, isConnected } = useAppKitAccount();
  const { requestUnstake } = useStakingOperators();
  const { stake, isLoading: isLoadingStake } = useStakeOf(operatorAddress);
  const { delay: unstakeDelay } = useUnstakeDelay();

  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    step: 'requesting' | 'confirming' | 'complete' | 'error';
    hash?: string;
  } | null>(null);

  const tokenSymbol = contracts.nilavTestnet.nilTokenSymbol;

  const stakedAmount = stake ? formatUnits(stake, 18) : '0';
  const hasStake = stake && stake > 0n;

  const handleMaxClick = () => {
    setAmount(stakedAmount);
    setError(null);
  };

  const handleRequestUnstake = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      onError?.('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      onError?.('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(stakedAmount)) {
      setError(`Amount exceeds staked balance (${stakedAmount} ${tokenSymbol})`);
      onError?.(`Amount exceeds staked balance`);
      return;
    }

    setError(null);
    setIsProcessing(true);
    setShowTxModal(true);
    setTxStatus({ step: 'requesting' });

    try {
      await requestUnstake(operatorAddress, amount, (step, data) => {
        if (step === 'requesting') {
          setTxStatus({ step: 'requesting' });
        } else if (step === 'confirming' && data?.requestHash) {
          setTxStatus({ step: 'confirming', hash: data.requestHash });
        }
      });

      setTxStatus({ step: 'complete' });
      setAmount('');
      onUnstakeSuccess?.(operatorAddress, amount);
    } catch (err: any) {
      // Keep the transaction hash if we have it
      setTxStatus(prev => ({ ...prev, step: 'error', hash: prev?.hash }));
      setError(err.message || 'Failed to request unstake');
      onError?.(err.message || 'Failed to request unstake');
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
          You need to connect your wallet to unstake {tokenSymbol} tokens.
        </p>
        <ConnectWallet size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Info Bar: Wallet & Current Stake */}
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
        <div className="staking-info-card">
          <div className="staking-info-label">Current Stake</div>
          <div className="staking-info-content" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--nillion-primary)' }}>
            {isLoadingStake ? 'Loading...' : `${stakedAmount} ${tokenSymbol}`}
          </div>
        </div>
      </div>

      {/* Request Unstake Section */}
      <div className="staking-form-container">
        {hasStake && (
          <>
            <label htmlFor="unstake-amount" className="setup-label staking-label">
              Amount to Unstake
            </label>
            <div className="unstaking-input-container">
              <Input
                id="unstake-amount"
                type="number"
                placeholder={`0.00 ${tokenSymbol}`}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                disabled={isProcessing || !isConnected}
                style={{ paddingRight: '5rem' }}
              />
              <button
                onClick={handleMaxClick}
                disabled={isProcessing || !isConnected}
                className="unstaking-max-button"
              >
                MAX
              </button>
            </div>

            <div className="unstaking-info-box">
              <div className="unstaking-info-line">
                ℹ️ Unstaking initiates a {unstakeDelay ? `${Number(unstakeDelay) / 86400} day` : ''} unbonding
                period.
              </div>
              <div className="unstaking-info-line">
                You can withdraw tokens after the period ends.
              </div>
            </div>

            <Button
              variant="primary"
              size="medium"
              onClick={handleRequestUnstake}
              disabled={!isConnected || isProcessing || !amount || parseFloat(amount) <= 0}
              style={{ width: '100%' }}
            >
              {isProcessing ? 'Processing...' : 'Request Unstake'}
            </Button>
          </>
        )}

        {!hasStake && (
          <div className="unstaking-empty-state">
            No tokens staked to this operator
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={showTxModal}
        onClose={() => {
          if (txStatus?.step === 'complete' || error) {
            setShowTxModal(false);
            setTxStatus(null);
          }
        }}
        title={
          txStatus?.step === 'complete'
            ? '✓ Unstake Request Complete'
            : 'Requesting Unstake'
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
                    href={`${contracts.nilavTestnet.blockExplorer}/tx/${txStatus.hash}`}
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
                  handleRequestUnstake();
                }}
                className="unstaking-modal-button"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : txStatus ? (
          <div>
            <div className="unstaking-modal-info">
              Unstaking will initiate an unbonding period. You'll need to wait for this period to
              complete before withdrawing your tokens.
            </div>

            <TransactionTracker
              transactions={[
                {
                  label: 'Request Unstake',
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
                      : 'Unstake request confirmed',
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
