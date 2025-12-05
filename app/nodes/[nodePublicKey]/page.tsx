'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { formatUnits, formatEther } from 'viem';
import { useBalance } from 'wagmi';
import {
  useStakeOf,
  useOperatorInfo,
  useIsActiveOperator,
  useIsJailed,
} from '@/lib/hooks';
import { Card, Spinner, Button } from '@/components/ui';
import { StakingForm, UnstakingForm, UnbondingForm } from '@/components/staking';
import { FundNodeForm } from '@/components/transfer';
import { contracts, nilavTestnet } from '@/config';
import { toast } from 'sonner';

export default function NodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nodePublicKey = params.nodePublicKey as `0x${string}`;
  const tokenSymbol = contracts.nilavTestnet.nilTokenSymbol;

  const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'withdraw' | 'fund'>(
    'stake'
  );

  // Initialize tab from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'stake' || tabParam === 'unstake' || tabParam === 'withdraw' || tabParam === 'fund') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'stake' | 'unstake' | 'withdraw' | 'fund') => {
    setActiveTab(tab);
    router.push(`/nodes/${nodePublicKey}?tab=${tab}`, { scroll: false });
  };

  // Fetch node data from blockchain
  const { stake, isLoading: isLoadingStake } = useStakeOf(nodePublicKey);
  const { operatorInfo, isLoading: isLoadingInfo } =
    useOperatorInfo(nodePublicKey);
  const { isActive, isLoading: isLoadingActive } =
    useIsActiveOperator(nodePublicKey);
  const { isJailed, isLoading: isLoadingJailed } = useIsJailed(nodePublicKey);

  // Fetch node ETH balance
  const { data: nodeBalanceData, isLoading: isLoadingNodeBalance } = useBalance(
    {
      address: nodePublicKey,
      chainId: nilavTestnet.id,
    }
  );

  const isLoading =
    isLoadingStake ||
    isLoadingInfo ||
    isLoadingActive ||
    isLoadingJailed ||
    isLoadingNodeBalance;

  if (isLoading) {
    return (
      <div className="node-detail-loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="node-detail-container">
      {/* Header */}
      <div className="node-detail-header">
        <h1>Node Details</h1>
      </div>

      {/* Node Overview Dashboard */}
      <Card style={{ marginBottom: '2rem' }}>
        <div className="node-overview-dashboard">
          {/* Operator Address */}
          <div className="node-overview-stat">
            <div className="node-overview-stat-label">Operator Address</div>
            <div className="node-overview-address-container">
              <div className="node-overview-address-text">
                {nodePublicKey.slice(0, 10)}...{nodePublicKey.slice(-8)}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(nodePublicKey);
                  toast.success('Address copied to clipboard');
                }}
                className="node-overview-copy-btn"
                title="Copy address"
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
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="node-overview-stat">
            <div className="node-overview-stat-label">Status</div>
            <div className={`node-status-indicator ${isActive ? 'active' : 'inactive'}`}>
              <div className={`node-status-dot ${isActive ? 'active' : 'inactive'}`} />
              <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            {isJailed && (
              <div
                style={{
                  marginTop: '0.5rem',
                  color: '#ff9800',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                ⚠️ Jailed
              </div>
            )}
          </div>

          {/* Total Staked */}
          <div className="node-overview-stat">
            <div className="node-overview-stat-label">Total Staked</div>
            <div className="node-overview-stat-value">
              {stake ? formatUnits(stake, 18) : '0'} {tokenSymbol}
            </div>
          </div>

          {/* Node ETH Balance */}
          <div className="node-overview-stat">
            <div className="node-overview-stat-label">Node ETH Balance</div>
            <div className="node-overview-stat-value">
              {nodeBalanceData
                ? Number(formatEther(nodeBalanceData.value)).toFixed(4)
                : '0'}{' '}
              ETH
            </div>
          </div>
        </div>
      </Card>

      {/* Actions Section with Tabs */}
      <div className="node-actions-full-width">
        <div className="node-staking-tabs">
          <button
            className={`node-staking-tab ${
              activeTab === 'stake' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('stake')}
          >
            Stake
          </button>
          <button
            className={`node-staking-tab ${
              activeTab === 'unstake' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('unstake')}
          >
            Unstake
          </button>
          <button
            className={`node-staking-tab ${
              activeTab === 'withdraw' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('withdraw')}
          >
            Withdraw
          </button>
          <button
            className={`node-staking-tab ${
              activeTab === 'fund' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('fund')}
          >
            Fund Node
          </button>
        </div>

        {/* Tab Content */}
        <div className="node-staking-content">
          {activeTab === 'stake' && (
            <StakingForm
              nodePublicKey={nodePublicKey}
              onSuccess={() => {
                toast.success('Stake successful!');
              }}
              onError={(error) => {
                console.error('Staking error:', error);
              }}
            />
          )}

          {activeTab === 'unstake' && (
            <UnstakingForm
              operatorAddress={nodePublicKey}
              onUnstakeSuccess={() => {
                toast.success('Unstake request successful!');
              }}
              onError={(error) => {
                console.error('Unstaking error:', error);
              }}
            />
          )}

          {activeTab === 'withdraw' && (
            <UnbondingForm
              operatorAddress={nodePublicKey}
              onWithdrawSuccess={() => {
                toast.success('Withdrawal successful!');
              }}
              onError={(error) => {
                console.error('Withdraw error:', error);
              }}
            />
          )}

          {activeTab === 'fund' && (
            <FundNodeForm
              nodePublicKey={nodePublicKey}
              onSuccess={() => {
                toast.success('Funding successful!');
              }}
              onError={(error) => {
                console.error('Funding error:', error);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
