'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useSwitchChain } from 'wagmi';
import { formatUnits } from 'viem';
import { ConnectWallet } from '@/components/auth';
import { Button, TransactionTracker, Modal, BalanceWarning } from '@/components/ui';
import { activeNetwork, activeContracts, helpLinks } from '@/config';
import { useStakingOperators, useStakeOf, useWalletBalances } from '@/lib/hooks';
import { toast } from 'sonner';

interface StakingFormProps {
  /**
   * Optional pre-filled node nodeAddress. If not provided, shows an input field.
   */
  nodeAddress?: string;
  /**
   * Optional callback when staking is successful
   */
  onSuccess?: (operatorAddress: string, amount: string) => void;
  /**
   * Optional callback when staking fails
   */
  onError?: (error: Error) => void;
  /**
   * Minimum stake amount (defaults to 1000)
   */
  minStake?: number;
  /**
   * Preset amounts to show as quick-select buttons
   */
  presetAmounts?: number[];
  /**
   * Whether to show continue button (for when there's already a stake)
   * This is for internal use - parent should handle rendering continue button
   */
  showContinueButton?: boolean;
  /**
   * Optional callback when stake data changes (for parent to know about current stake)
   */
  onStakeDataChange?: (data: {
    currentStake: number;
    operatorAddress: string;
  }) => void;
}

export function StakingForm({
  nodeAddress,
  onSuccess,
  onError,
  minStake = 1,
  presetAmounts = [1000, 5000, 10000],
  showContinueButton = false,
  onStakeDataChange,
}: StakingFormProps) {
  const { isConnected, address } = useAppKitAccount();
  const { chainId, caipNetwork } = useAppKitNetwork();
  const { switchChain } = useSwitchChain();
  const { stakeTo } = useStakingOperators();

  const [operatorAddress, setOperatorAddress] = useState(nodeAddress || '');

  // Fetch current stake for the operator
  const { stake } = useStakeOf(operatorAddress as `0x${string}`);
  const currentStake = stake ? parseFloat(formatUnits(stake, 18)) : 0;

  // Fetch balances using custom hook
  const {
    ethBalance: ethBalanceFormatted,
    tokenBalance: tokenBalanceFormatted,
    isLoading: isLoadingBalances,
    refetchAll: refetchBalances,
  } = useWalletBalances(address as `0x${string}`);

  // Notify parent about stake data changes
  useEffect(() => {
    onStakeDataChange?.({ currentStake, operatorAddress });
  }, [currentStake, operatorAddress, onStakeDataChange]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    approveHash?: string;
    stakeHash?: string;
    step?:
      | 'approving'
      | 'confirming_approve'
      | 'staking'
      | 'confirming_stake'
      | 'complete'
      | 'error';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);

  const isCorrectNetwork = chainId === activeNetwork.id;
  const tokenSymbol = activeContracts.nilTokenSymbol;

  const handlePreset = (amount: number) => {
    setStakeAmount(amount.toString());
  };

  const handleMax = () => {
    if (tokenBalanceFormatted > 0) {
      setStakeAmount(tokenBalanceFormatted.toString());
    }
  };

  const handleRecheckBalances = async () => {
    toast.info('Rechecking balances...');
    await refetchBalances();
    toast.success('Balances updated');
  };

  const handleStake = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!operatorAddress) {
      toast.error('Please enter an operator address');
      return;
    }

    // Basic address validation
    if (!operatorAddress.startsWith('0x') || operatorAddress.length !== 42) {
      toast.error('Invalid operator address format');
      return;
    }

    const amount = Number.parseFloat(stakeAmount);
    if (!stakeAmount || amount < minStake) {
      toast.error(
        `Minimum stake is ${minStake.toLocaleString()} ${tokenSymbol}`
      );
      return;
    }

    // Check if user has enough balance
    if (amount > tokenBalanceFormatted) {
      toast.error(
        `Insufficient ${tokenSymbol} balance. You have ${tokenBalanceFormatted.toLocaleString()} ${tokenSymbol}`
      );
      return;
    }

    // Check if user has ETH for gas
    if (ethBalanceFormatted === 0) {
      toast.error('You need ETH to pay for transaction fees');
      return;
    }

    try {
      setIsStaking(true);
      setTxStatus({ step: 'approving' });
      setError(null); // Clear any previous errors
      setShowTxModal(true); // Open the modal when staking starts

      // Switch to correct chain if needed
      if (chainId !== activeNetwork.id) {
        try {
          await switchChain({ chainId: activeNetwork.id });
        } catch (switchError: any) {
          throw new Error('Please switch to Blacklight Testnet to continue');
        }
      }

      // Execute approve + stake transactions with progress tracking
      const result = await stakeTo(
        operatorAddress as `0x${string}`,
        stakeAmount,
        (step, data) => {
          setTxStatus((prev) => ({
            ...prev,
            step,
            approveHash: data?.approveHash || prev?.approveHash,
            stakeHash: data?.stakeHash || prev?.stakeHash,
          }));
        }
      );

      if (result.success) {
        // Update with transaction hashes
        setTxStatus({
          approveHash: result.approveHash,
          stakeHash: result.stakeHash,
          step: 'complete',
        });

        // Log comprehensive transaction details
        console.log('=== ✓ STAKING COMPLETED SUCCESSFULLY ===');
        console.log('Operator:', operatorAddress);
        console.log('Amount:', `${amount.toLocaleString()} ${tokenSymbol}`);
        console.log('');
        console.log('Transaction 1: Token Approval');
        console.log('  Hash:', result.approveHash);
        console.log(
          '  Link:',
          `${activeContracts.blockExplorer}/tx/${result.approveHash}`
        );
        console.log('');
        console.log('Transaction 2: Stake');
        console.log('  Hash:', result.stakeHash);
        console.log(
          '  Link:',
          `${activeContracts.blockExplorer}/tx/${result.stakeHash}`
        );
        console.log('========================================');

        // Show success toast
        toast.success(
          `Staked ${amount.toLocaleString()} ${tokenSymbol} to ${operatorAddress.slice(
            0,
            6
          )}...${operatorAddress.slice(-4)}`,
          { duration: 5000 }
        );

        // Don't call onSuccess here - wait for user to click Continue
      }
    } catch (error: any) {
      console.error('=== STAKING ERROR ===');
      console.error('Error:', error);
      console.error('Message:', error?.message);
      console.error('====================');

      const errorMessage = error?.message || 'Failed to stake tokens';

      // Keep transaction hashes if we have them
      setTxStatus((prev) => ({ ...prev, step: 'error' }));
      setError(errorMessage);
      setShowTxModal(true); // Make sure modal is open to show error
      toast.error(errorMessage);

      // Call error callback
      onError?.(error);
    } finally {
      setIsStaking(false);
    }
  };

  // Not connected - show wallet connection prompt
  if (!isConnected) {
    return (
      <div>
        <label className="setup-label">Connect Wallet</label>
        <p className="setup-help-text" style={{ marginBottom: '1.5rem' }}>
          You need to connect your wallet to stake {tokenSymbol} tokens to an
          operator.
        </p>
        <ConnectWallet size="large" />
      </div>
    );
  }

  // Wrong network - show network switcher
  if (!isCorrectNetwork) {
    return (
      <div>
        <label className="setup-label">Wrong Network</label>
        <div
          style={{
            background: 'rgba(255, 100, 100, 0.1)',
            border: '1px solid rgba(255, 100, 100, 0.3)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ marginBottom: '0.5rem' }}>
            This app only supports <strong>Blacklight Testnet</strong>.
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Current network: {caipNetwork?.name || 'Unknown'}
          </p>
        </div>
        <Button
          variant="primary"
          size="large"
          onClick={() => switchChain({ chainId: activeNetwork.id })}
          className="setup-button-full"
        >
          Switch to {activeNetwork.name}
        </Button>
      </div>
    );
  }

  // Connected and on correct network - show staking form
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
          <div
            className="staking-info-content"
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--nillion-primary)',
            }}
          >
            {currentStake} {tokenSymbol}
          </div>
        </div>
      </div>

      {/* Balance Info & Warnings */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ flex: 1 }}>
            <span style={{ opacity: 0.7 }}>ETH Balance: </span>
            <span
              style={{
                fontWeight: 600,
                color: ethBalanceFormatted === 0 ? '#ff6b6b' : 'inherit',
              }}
            >
              {ethBalanceFormatted.toFixed(4)} ETH
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ opacity: 0.7 }}>{tokenSymbol} Balance: </span>
            <span
              style={{
                fontWeight: 600,
                color: tokenBalanceFormatted === 0 ? '#ff6b6b' : 'inherit',
              }}
            >
              {tokenBalanceFormatted.toLocaleString()} {tokenSymbol}
            </span>
          </div>
        </div>

        {/* Error messages for zero balances */}
        {!isLoadingBalances && ethBalanceFormatted === 0 && (
          <BalanceWarning
            type="eth"
            helpLink={helpLinks.nilavHelp}
          />
        )}

        {!isLoadingBalances && tokenBalanceFormatted === 0 && (
          <BalanceWarning
            type="token"
            tokenSymbol={tokenSymbol}
            helpLink={helpLinks.nilavHelp}
          />
        )}

        {/* Show recheck button when balances are zero */}
        {!isLoadingBalances &&
          (ethBalanceFormatted === 0 || tokenBalanceFormatted === 0) && (
            <Button
              variant="primary"
              size="large"
              onClick={handleRecheckBalances}
              style={{ width: '100%' }}
            >
              Recheck Balances
            </Button>
          )}
      </div>

      {/* Main Staking Form - Only show if both balances are > 0 */}
      {ethBalanceFormatted > 0 && tokenBalanceFormatted > 0 && (
        <>
      <div className="staking-form-container">
        {/* Node Address */}
        <label className="setup-label staking-label">
          {nodeAddress ? 'Node Address' : 'Node Address'}
        </label>
        {nodeAddress ? (
          <div className="staking-address-box">
            <code className="staking-address-code">{operatorAddress}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(operatorAddress);
                toast.success('Node address copied');
              }}
              title="Copy address"
              className="staking-address-copy-btn"
            >
              <svg
                width="14"
                height="14"
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
        ) : (
          <input
            type="text"
            value={operatorAddress}
            onChange={(e) => setOperatorAddress(e.target.value)}
            placeholder="0x..."
            className="setup-input"
            style={{ marginBottom: '1rem', fontSize: '0.875rem' }}
          />
        )}

        {/* Stake Amount */}
        <label className="setup-label staking-label">
          Amount to Stake
          <span className="staking-label-hint">
            (min {minStake.toLocaleString()})
          </span>
        </label>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="0"
          min={minStake}
          className="setup-input"
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        />

        {/* Preset Amounts */}
        <div className="staking-preset-buttons">
          {presetAmounts.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="small"
              onClick={() => handlePreset(amount)}
            >
              {amount.toLocaleString()}
            </Button>
          ))}
          <Button
            variant="outline"
            size="small"
            onClick={handleMax}
            className="staking-max-button"
          >
            Max
          </Button>
        </div>
      </div>

      {/* Stake Button */}
      <Button
        variant="primary"
        size="large"
        disabled={
          !operatorAddress ||
          !stakeAmount ||
          Number.parseFloat(stakeAmount) < minStake ||
          isStaking ||
          ethBalanceFormatted === 0 ||
          tokenBalanceFormatted === 0
        }
        onClick={handleStake}
        style={{ width: '100%' }}
      >
        {isStaking
          ? txStatus?.step === 'approving'
            ? 'Step 1/2: Approving Tokens...'
            : txStatus?.step === 'confirming_approve'
            ? 'Step 1/2: Confirming Approval...'
            : txStatus?.step === 'staking'
            ? 'Step 2/2: Staking Tokens...'
            : txStatus?.step === 'confirming_stake'
            ? 'Step 2/2: Confirming Stake...'
            : 'Processing...'
          : `Stake ${
              stakeAmount && Number.parseFloat(stakeAmount) >= minStake
                ? Number.parseFloat(stakeAmount).toLocaleString() +
                  ' ' +
                  tokenSymbol
                : 'Tokens'
            }`}
      </Button>

      {/* Transaction Progress Modal */}
      <Modal
        isOpen={showTxModal}
        onClose={() => {
          // Prevent closing - user must click button
        }}
        title={
          txStatus?.step === 'complete'
            ? '✓ Staking Complete'
            : 'Staking in Progress'
        }
        showCloseButton={false}
      >
        {error ? (
          <div>
            <div
              style={{
                background: 'rgba(255, 100, 100, 0.1)',
                border: '1px solid rgba(255, 100, 100, 0.3)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <div style={{ flexShrink: 0, fontSize: '1.5rem', lineHeight: 1 }}>
                ⚠️
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#ff6b6b',
                    marginBottom: '0.375rem',
                  }}
                >
                  Transaction Failed
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {error}
                </div>
                {(txStatus?.approveHash || txStatus?.stakeHash) && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={`${activeContracts.blockExplorer}/tx/${
                        txStatus.stakeHash || txStatus.approveHash
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--nillion-primary)',
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
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
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTxModal(false);
                  setError(null);
                }}
                style={{ flex: 1 }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setError(null);
                  setShowTxModal(false);
                  // Retry by triggering stake again
                  handleStake();
                }}
                style={{ flex: 1 }}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : txStatus ? (
          <div>
            {/* Transaction Info */}
            <div
              style={{
                background: 'rgba(138, 137, 255, 0.05)',
                border: '1px solid rgba(138, 137, 255, 0.15)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                You'll be asked to confirm <strong>2 transactions</strong>:
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ opacity: 0.6 }}>1.</span>
                  <span>Approve spending cap for {tokenSymbol} tokens</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ opacity: 0.6 }}>2.</span>
                  <span>Stake tokens to node</span>
                </div>
              </div>
            </div>

            <TransactionTracker
              transactions={[
                {
                  label: 'Token Approval',
                  hash: txStatus.approveHash,
                  status:
                    txStatus.step === 'approving'
                      ? 'submitted'
                      : txStatus.step === 'confirming_approve'
                      ? 'confirming'
                      : txStatus.approveHash
                      ? 'confirmed'
                      : 'pending',
                  description:
                    txStatus.step === 'approving'
                      ? 'Waiting for wallet...'
                      : txStatus.step === 'confirming_approve'
                      ? 'Confirming on-chain...'
                      : txStatus.approveHash
                      ? 'Confirmed'
                      : 'Pending',
                },
                {
                  label: 'Stake Tokens',
                  hash: txStatus.stakeHash,
                  status:
                    txStatus.step === 'staking'
                      ? 'submitted'
                      : txStatus.step === 'confirming_stake'
                      ? 'confirming'
                      : txStatus.step === 'complete'
                      ? 'confirmed'
                      : 'pending',
                  description:
                    txStatus.step === 'staking'
                      ? 'Waiting for wallet...'
                      : txStatus.step === 'confirming_stake'
                      ? 'Confirming on-chain...'
                      : txStatus.step === 'complete'
                      ? 'Confirmed'
                      : 'Waiting for approval...',
                },
              ]}
            />
            {txStatus.step === 'complete' && (
              <Button
                variant="primary"
                size="large"
                onClick={() => {
                  setShowTxModal(false);
                  // Reset form
                  setStakeAmount('');
                  setTxStatus(null);
                  // Call success callback when user clicks Continue
                  onSuccess?.(operatorAddress, stakeAmount);
                }}
                style={{ width: '100%', marginTop: '1.5rem' }}
              >
                Continue
              </Button>
            )}
          </div>
        ) : null}
      </Modal>
        </>
      )}
    </div>
  );
}
