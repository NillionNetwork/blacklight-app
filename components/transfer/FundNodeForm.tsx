'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import {
  useSwitchChain,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useBalance,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ConnectWallet } from '@/components/auth';
import { Button, TransactionTracker, Modal } from '@/components/ui';
import { nilavTestnet, contracts } from '@/config';
import { toast } from 'sonner';

interface FundNodeFormProps {
  /**
   * Optional pre-filled node address. If not provided, shows an input field.
   */
  nodeAddress?: string;
  /**
   * Optional callback when funding is successful
   */
  onSuccess?: (nodeAddress: string, amount: string) => void;
  /**
   * Optional callback when funding fails
   */
  onError?: (error: Error) => void;
  /**
   * Minimum fund amount in ETH (defaults to 0.001)
   */
  minAmount?: number;
  /**
   * Preset amounts to show as quick-select buttons (in ETH)
   */
  presetAmounts?: number[];
  /**
   * Optional callback when balance data changes (for parent to know about node balance)
   */
  onBalanceDataChange?: (data: {
    nodeBalance: number;
    nodeAddress: string;
  }) => void;
}

export function FundNodeForm({
  nodeAddress: nodeAddressProp,
  onSuccess,
  onError,
  minAmount = 0.001,
  presetAmounts = [0.005, 0.01],
  onBalanceDataChange,
}: FundNodeFormProps) {
  const { isConnected, address } = useAppKitAccount();
  const { chainId, caipNetwork } = useAppKitNetwork();
  const { switchChain } = useSwitchChain();
  const {
    sendTransaction,
    data: txHash,
    isPending,
    error: sendError,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Fetch ETH balance for connected wallet
  const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: nilavTestnet.id,
  });

  const [nodeAddress, setNodeAddress] = useState(nodeAddressProp || '');

  // Fetch ETH balance for node address (only when valid address is entered)
  const isValidNodeAddress =
    nodeAddress.startsWith('0x') && nodeAddress.length === 42;
  const { data: nodeBalanceData, isLoading: isLoadingNodeBalance } = useBalance(
    {
      address: isValidNodeAddress ? (nodeAddress as `0x${string}`) : undefined,
      chainId: nilavTestnet.id,
    }
  );

  // Notify parent about balance data changes
  const nodeBalance = nodeBalanceData
    ? parseFloat(formatEther(nodeBalanceData.value))
    : 0;
  useEffect(() => {
    onBalanceDataChange?.({ nodeBalance, nodeAddress });
  }, [nodeBalance, nodeAddress, onBalanceDataChange]);

  const [fundAmount, setFundAmount] = useState('');
  const [txStatus, setTxStatus] = useState<{
    hash?: string;
    step?: 'submitting' | 'confirming' | 'complete' | 'error';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);

  const isCorrectNetwork = chainId === nilavTestnet.id;

  const handlePreset = (amount: number) => {
    setFundAmount(amount.toString());
  };

  const handleMax = () => {
    if (!balanceData) {
      toast.error('Unable to fetch balance');
      return;
    }

    // Leave ~0.001 ETH for gas (rough estimate)
    const gasReserve = parseEther('0.001');
    const maxAmount =
      balanceData.value > gasReserve ? balanceData.value - gasReserve : 0n;

    if (maxAmount <= 0n) {
      toast.error('Insufficient balance for transfer');
      return;
    }

    setFundAmount(formatEther(maxAmount));
  };

  const handleFund = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!nodeAddress) {
      toast.error('Please enter a node address');
      return;
    }

    // Basic address validation
    if (!nodeAddress.startsWith('0x') || nodeAddress.length !== 42) {
      toast.error('Invalid node address format');
      return;
    }

    const amount = Number.parseFloat(fundAmount);
    if (!fundAmount || amount < minAmount) {
      toast.error(`Minimum amount is ${minAmount} ETH`);
      return;
    }

    // Check if user has enough balance
    if (balanceData) {
      const amountWei = parseEther(fundAmount);
      const gasReserve = parseEther('0.001'); // Reserve for gas
      const requiredBalance = amountWei + gasReserve;

      if (balanceData.value < requiredBalance) {
        toast.error('Insufficient balance (including gas reserve)');
        return;
      }
    }

    try {
      setTxStatus({ step: 'submitting' });
      setError(null);
      setShowTxModal(true);

      // Send ETH transaction
      sendTransaction(
        {
          to: nodeAddress as `0x${string}`,
          value: parseEther(fundAmount),
        },
        {
          onSuccess: (hash) => {
            setTxStatus({ hash, step: 'confirming' });
            console.log('=== ETH TRANSFER SUBMITTED ===');
            console.log('Transaction Hash:', hash);
            console.log('Node Address:', nodeAddress);
            console.log('Amount:', `${amount} ETH`);
            console.log('============================');
          },
          onError: (err) => {
            console.error('=== TRANSFER ERROR ===');
            console.error('Error:', err);
            console.error('Message:', err?.message);
            console.error('=====================');

            const errorMessage = err?.message || 'Failed to send transaction';
            setError(errorMessage);
            toast.error(errorMessage);
            onError?.(err as Error);
          },
        }
      );
    } catch (err: any) {
      console.error('=== FUNDING ERROR ===');
      console.error('Error:', err);
      console.error('====================');

      const errorMessage = err?.message || 'Failed to fund node';
      // Keep transaction hash if we have it
      setTxStatus((prev) => ({ ...prev, step: 'error' }));
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(err);
    }
  };

  // Watch for confirmation
  useEffect(() => {
    if (isConfirmed && txStatus?.step === 'confirming') {
      setTxStatus((prev) => ({ ...prev, step: 'complete' }));

      const amount = Number.parseFloat(fundAmount);
      console.log('=== ✓ ETH TRANSFER CONFIRMED ===');
      console.log('Node Address:', nodeAddress);
      console.log('Amount:', `${amount} ETH`);
      console.log('Transaction Hash:', txHash);
      console.log(
        'Explorer Link:',
        `${contracts.nilavTestnet.blockExplorer}/tx/${txHash}`
      );
      console.log('===============================');

      toast.success(
        `Sent ${amount} ETH to ${nodeAddress.slice(0, 6)}...${nodeAddress.slice(
          -4
        )}`,
        { duration: 5000 }
      );

      // Don't call onSuccess here - wait for user to click Continue
    }
  }, [isConfirmed, txStatus?.step, fundAmount, nodeAddress, txHash]);

  // Not connected - show wallet connection prompt
  if (!isConnected) {
    return (
      <div>
        <label className="setup-label">Connect Wallet</label>
        <p className="setup-help-text" style={{ marginBottom: '1.5rem' }}>
          You need to connect your wallet to fund a node with ETH.
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
            This app only supports <strong>Nilav Testnet</strong>.
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Current network: {caipNetwork?.name || 'Unknown'}
          </p>
        </div>
        <Button
          variant="primary"
          size="large"
          onClick={() => switchChain({ chainId: nilavTestnet.id })}
          className="setup-button-full"
        >
          Switch to Nilav Testnet
        </Button>
      </div>
    );
  }

  // Check if user has insufficient balance
  const smallestPresetAmount = Math.min(...presetAmounts);
  const hasInsufficientBalance =
    balanceData &&
    !isLoadingBalance &&
    balanceData.value <= parseEther(smallestPresetAmount.toString());

  // Connected and on correct network - show funding form
  return (
    <div>
      {/* Info Bar: Wallet & Node Balance */}
      <div className="staking-info-bar">
        <div className="staking-info-card">
          <div className="staking-info-label">Connected Wallet</div>
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
          <div
            style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}
          >
            Balance:{' '}
            {isLoadingBalance ? (
              <span>Loading...</span>
            ) : balanceData ? (
              <span
                style={{ color: 'var(--nillion-primary)', fontWeight: 600 }}
              >
                {Number(formatEther(balanceData.value)).toFixed(4)} ETH
              </span>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
        <div className="staking-info-card">
          <div className="staking-info-label">Node Balance</div>
          <div
            className="staking-info-content"
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--nillion-primary)',
            }}
          >
            {isLoadingNodeBalance
              ? 'Loading...'
              : nodeBalanceData
              ? `${Number(formatEther(nodeBalanceData.value)).toFixed(4)} ETH`
              : '0.0000 ETH'}
          </div>
        </div>
      </div>

      {/* Main Funding Form */}
      <div className="staking-form-container">
        {nodeAddress ? (
          <div
            className="staking-address-box"
            style={{ marginBottom: '1.5rem' }}
          >
            <code className="staking-address-code">{nodeAddress}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(nodeAddress);
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
            value={nodeAddress}
            onChange={(e) => setNodeAddress(e.target.value)}
            placeholder="0x..."
            className="setup-input"
            style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}
          />
        )}

        {/* Fund Amount */}
        <label htmlFor="fund-amount" className="setup-label staking-label">
          Amount to Send
          <span className="staking-label-hint">(min {minAmount} ETH)</span>
        </label>
        <input
          id="fund-amount"
          type="number"
          value={fundAmount}
          onChange={(e) => setFundAmount(e.target.value)}
          placeholder={`0.00 ETH`}
          min={minAmount}
          step="0.001"
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
              {amount} ETH
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

        {/* Insufficient Balance Warning */}
        {hasInsufficientBalance && (
          <div className="fund-node-warning">
            <div className="fund-node-warning-icon">⚠️</div>
            <div className="fund-node-warning-content">
              <div className="fund-node-warning-title">Not Enough ETH</div>
              <div className="fund-node-warning-text">
                You need at least {smallestPresetAmount} ETH (plus gas) to fund
                a node. Your current balance is{' '}
                {balanceData
                  ? Number(formatEther(balanceData.value)).toFixed(4)
                  : '0'}{' '}
                ETH.
              </div>
            </div>
          </div>
        )}

        {/* Fund Button */}
        <Button
          variant="primary"
          size="large"
          disabled={
            !nodeAddress ||
            !fundAmount ||
            Number.parseFloat(fundAmount) < minAmount ||
            isPending ||
            isConfirming
          }
          onClick={handleFund}
          style={{
            width: '100%',
            marginTop: '1.5rem',
            marginBottom: txStatus ? '1.5rem' : '0',
          }}
        >
          {isPending
            ? 'Waiting for Wallet...'
            : isConfirming
            ? 'Confirming Transaction...'
            : `Send ${
                fundAmount && Number.parseFloat(fundAmount) >= minAmount
                  ? Number.parseFloat(fundAmount) + ' ETH'
                  : 'ETH'
              }`}
        </Button>
      </div>

      {/* Transaction Progress Modal */}
      <Modal
        isOpen={showTxModal}
        onClose={() => {
          // Prevent closing - user must click button
        }}
        title={
          txStatus?.step === 'complete' ? '✓ Transfer Complete' : 'Sending ETH'
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
                {txStatus?.hash && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={`${contracts.nilavTestnet.blockExplorer}/tx/${txStatus.hash}`}
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
                  handleFund();
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
              Sending ETH to the node address.
            </div>

            <TransactionTracker
              transactions={[
                {
                  label: 'Send ETH',
                  hash: txStatus.hash,
                  status:
                    txStatus.step === 'submitting'
                      ? 'submitted'
                      : txStatus.step === 'confirming'
                      ? 'confirming'
                      : txStatus.step === 'complete'
                      ? 'confirmed'
                      : 'pending',
                  description:
                    txStatus.step === 'submitting'
                      ? 'Waiting for wallet...'
                      : txStatus.step === 'confirming'
                      ? 'Confirming on-chain...'
                      : txStatus.step === 'complete'
                      ? 'Confirmed'
                      : 'Pending',
                },
              ]}
            />
            {txStatus.step === 'complete' && (
              <Button
                variant="primary"
                size="large"
                onClick={() => {
                  setShowTxModal(false);
                  setFundAmount('');
                  setTxStatus(null);
                  // Call success callback when user clicks Continue
                  onSuccess?.(nodeAddress, fundAmount);
                }}
                style={{ width: '100%', marginTop: '1.5rem' }}
              >
                Continue
              </Button>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
