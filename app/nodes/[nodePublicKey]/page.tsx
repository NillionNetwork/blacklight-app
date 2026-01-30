'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { formatUnits, formatEther } from 'viem';
import { useBalance } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import {
  useStakeOf,
  useOperatorInfo,
  useIsActiveOperator,
  useIsJailed,
} from '@/lib/hooks';
import {
  getOperatorRegistration,
  getOperatorDeactivation,
  formatTimeAgo,
} from '@/lib/indexer';
import { Card, Spinner, Button } from '@/components/ui';
import {
  StakingForm,
  UnstakingForm,
  UnbondingForm,
  RewardsTab,
} from '@/components/staking';
import { FundNodeForm } from '@/components/transfer';
import { ActivityFeed } from '@/components/activity';
import { activeContracts, activeNetwork } from '@/config';
import { toast } from 'sonner';

export default function NodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nodeAddress = params.nodePublicKey as `0x${string}`;
  const tokenSymbol = activeContracts.nilTokenSymbol;

  const [activeTab, setActiveTab] = useState<
    'activity' | 'stake' | 'unstake' | 'withdraw' | 'withdraw-eth' | 'rewards' | 'fund'
  >('activity');

  // Initialize tab from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam === 'activity' ||
      tabParam === 'stake' ||
      tabParam === 'unstake' ||
      tabParam === 'withdraw' ||
      tabParam === 'withdraw-eth' ||
      tabParam === 'rewards' ||
      tabParam === 'fund'
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (
    tab: 'activity' | 'stake' | 'unstake' | 'withdraw' | 'withdraw-eth' | 'rewards' | 'fund'
  ) => {
    setActiveTab(tab);
    router.push(`/nodes/${nodeAddress}?tab=${tab}`, { scroll: false });
  };

  // Fetch node data from blockchain
  const { stake, isLoading: isLoadingStake } = useStakeOf(nodeAddress);
  const { operatorInfo, isLoading: isLoadingInfo } =
    useOperatorInfo(nodeAddress);
  const { isActive, isLoading: isLoadingActive } =
    useIsActiveOperator(nodeAddress);
  const { isJailed, isLoading: isLoadingJailed } = useIsJailed(nodeAddress);

  // Fetch node ETH balance
  const { data: nodeBalanceData, isLoading: isLoadingNodeBalance } = useBalance(
    {
      address: nodeAddress,
      chainId: activeNetwork.id,
    }
  );

  // Fetch registration and deactivation events
  const { data: registrationData, isLoading: isLoadingRegistration } = useQuery({
    queryKey: ['operator-registration', nodeAddress],
    queryFn: () => getOperatorRegistration(nodeAddress),
  });

  const registrationBlockNum = registrationData?.data?.[0]?.block_num;

  const { data: deactivationData, isLoading: isLoadingDeactivation } = useQuery({
    queryKey: ['operator-deactivation', nodeAddress, registrationBlockNum],
    queryFn: () => getOperatorDeactivation(nodeAddress, registrationBlockNum),
    enabled: registrationBlockNum !== undefined,
  });

  const isLoading =
    isLoadingStake ||
    isLoadingInfo ||
    isLoadingActive ||
    isLoadingJailed ||
    isLoadingNodeBalance ||
    isLoadingRegistration ||
    isLoadingDeactivation;

  // Show loading while fetching or if nodeAddress is invalid
  if (isLoading || !nodeAddress) {
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
        <h1>Blacklight Node Details</h1>
      </div>

      {/* Node Overview Dashboard */}
      <Card style={{ marginBottom: '2rem' }}>
        <div className="node-overview-dashboard">
          {/* Operator Address */}
          <div className="node-overview-stat">
            <div className="node-overview-stat-label">Operator Address</div>
            <div className="node-overview-address-container">
              <div className="node-overview-address-text">
                {nodeAddress?.slice(0, 10)}...{nodeAddress?.slice(-8)}
              </div>
              <button
                onClick={() => {
                  if (nodeAddress) {
                    navigator.clipboard.writeText(nodeAddress);
                    toast.success('Address copied to clipboard');
                  }
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
            <div
              className={`node-status-indicator ${
                isActive ? 'active' : 'inactive'
              }`}
            >
              <div
                className={`node-status-dot ${
                  isActive ? 'active' : 'inactive'
                }`}
              />
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

            {/* Registration/Deactivation Events - Compact */}
            {deactivationData?.data?.[0] && (
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  opacity: 0.8,
                }}
              >
                Deactivated {formatTimeAgo(deactivationData.data[0].block_timestamp)}{' '}
                <a
                  href={`${activeContracts.blockExplorer}/tx/${deactivationData.data[0].tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--nillion-primary)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  (tx ↗)
                </a>
              </div>
            )}
            {registrationData?.data?.[0] && (
              <div
                style={{
                  marginTop: deactivationData?.data?.[0] ? '0.25rem' : '0.5rem',
                  fontSize: '0.75rem',
                  opacity: 0.8,
                }}
              >
                Registered {formatTimeAgo(registrationData.data[0].block_timestamp)}{' '}
                <a
                  href={`${activeContracts.blockExplorer}/tx/${registrationData.data[0].tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--nillion-primary)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  (tx ↗)
                </a>
              </div>
            )}
          </div>

          {/* Total Staked */}
          <div className="node-overview-stat">
            <div className="node-overview-stat-label">Total Staked</div>
            <div className="node-overview-stat-value">
              {stake ? formatUnits(stake, activeContracts.nilTokenDecimals) : '0'} {tokenSymbol}
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
              activeTab === 'activity' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('activity')}
          >
            Verification Activity
          </button>
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
            Withdraw Stake
          </button>
          <button
            className={`node-staking-tab ${
              activeTab === 'fund' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('fund')}
          >
            Fund Node (ETH)
          </button>
          <button
            className={`node-staking-tab ${
              activeTab === 'withdraw-eth' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('withdraw-eth')}
          >
            Withdraw ETH
          </button>
          <button
            className={`node-staking-tab ${
              activeTab === 'rewards' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('rewards')}
          >
            Rewards
          </button>
        </div>

        {/* Tab Content */}
        <div className="node-staking-content">
          {activeTab === 'activity' && <ActivityFeed nodeAddress={nodeAddress} />}

          {activeTab === 'stake' && (
            <StakingForm
              nodeAddress={nodeAddress}
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
              operatorAddress={nodeAddress}
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
              operatorAddress={nodeAddress}
              onWithdrawSuccess={() => {
                toast.success('Withdrawal successful!');
              }}
              onError={(error) => {
                console.error('Withdraw error:', error);
              }}
            />
          )}

          {activeTab === 'withdraw-eth' && (
            <div className="node-staking-content-inner">
              <p>
                To withdraw ETH from your Blacklight node, you'll need to use the
                wallet that was created when the node was first run. We recommend
                importing that wallet's into a browser wallet (e.g. MetaMask) and
                sending the funds to any address you choose, such as your original
                staking wallet.
              </p>
            </div>
          )}

          {activeTab === 'rewards' && (
            <RewardsTab operatorAddress={nodeAddress} />
          )}

          {activeTab === 'fund' && (
            <FundNodeForm
              nodeAddress={nodeAddress}
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
