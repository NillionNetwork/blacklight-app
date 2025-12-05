'use client';

import Link from 'next/link';
import { useAppKitAccount } from '@reown/appkit/react';
import { formatUnits } from 'viem';
import { useUserStakedOperators } from '@/lib/hooks';
import { Spinner } from '@/components/ui';
import { contracts } from '@/config';

export default function NodesPage() {
  const { address } = useAppKitAccount();
  const {
    operators,
    isLoading: loading,
    error,
  } = useUserStakedOperators(address as `0x${string}` | undefined);
  const tokenSymbol = contracts.nilavTestnet.nilTokenSymbol;

  // Sort operators: active first, then by stake amount
  const sortedOperators = operators
    ? [...operators].sort((a, b) => {
        // Active nodes first
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        // Then by stake amount (descending)
        return Number(b.stake - a.stake);
      })
    : [];

  if (loading) {
    return (
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 5rem)',
        }}
      >
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <h1>Error Loading Nodes</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{error}</p>
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 5rem)',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          No Nodes Yet
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
          You haven't staked to any verifier nodes yet.
        </p>
        <a href="/setup" style={{ color: 'var(--nillion-primary)' }}>
          Set up your first node →
        </a>
      </div>
    );
  }

  return (
    <div
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>My Nodes</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
          {sortedOperators.length} {sortedOperators.length === 1 ? 'node' : 'nodes'}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {sortedOperators.map((op) => (
          <Link
            key={op.operator}
            href={`/nodes/${op.operator}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(138, 137, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(138, 137, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Operator Address - Top */}
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginBottom: '0.375rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                  }}
                >
                  Operator
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    wordBreak: 'break-all',
                  }}
                >
                  {op.operator}
                </div>
              </div>

              {/* Stake Amount and Status */}
              <div style={{ marginTop: 'auto' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '0.375rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                  }}
                >
                  Your Stake
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: 'var(--nillion-primary)',
                      lineHeight: 1,
                    }}
                  >
                    {formatUnits(op.stake, 18)} <span style={{ fontSize: '1rem', opacity: 0.8 }}>{tokenSymbol}</span>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      background: op.isActive
                        ? 'rgba(74, 222, 128, 0.1)'
                        : 'rgba(156, 163, 175, 0.1)',
                      border: `1px solid ${
                        op.isActive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(156, 163, 175, 0.3)'
                      }`,
                      color: op.isActive ? '#4ade80' : '#9ca3af',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: op.isActive ? '#4ade80' : '#9ca3af',
                        boxShadow: op.isActive ? '0 0 6px rgba(74, 222, 128, 0.5)' : 'none',
                      }}
                    />
                    {op.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
