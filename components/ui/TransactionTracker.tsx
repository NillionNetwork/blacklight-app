'use client';

import { activeContracts } from '@/config';

interface Transaction {
  /**
   * The transaction hash (when submitted)
   */
  hash?: string;
  /**
   * Label for this transaction step
   */
  label: string;
  /**
   * Current status of this transaction
   */
  status: 'pending' | 'submitted' | 'confirming' | 'confirmed';
  /**
   * Optional description shown below the label
   */
  description?: string;
}

interface TransactionTrackerProps {
  /**
   * Array of transactions to track
   */
  transactions: Transaction[];
  /**
   * Optional title for the tracker
   */
  title?: string;
  /**
   * Base URL for the block explorer (defaults to Nilav testnet)
   */
  explorerBaseUrl?: string;
}

export function TransactionTracker({
  transactions,
  title,
  explorerBaseUrl = activeContracts.blockExplorer,
}: TransactionTrackerProps) {
  // Determine overall completion state
  const allConfirmed = transactions.every((tx) => tx.status === 'confirmed');
  const anyActive = transactions.some(
    (tx) => tx.status === 'submitted' || tx.status === 'confirming'
  );

  return (
    <div
      style={{
        background: 'rgba(138, 137, 255, 0.05)',
        border: '1px solid rgba(138, 137, 255, 0.2)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
      }}
    >
      <h4
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          marginBottom: '0.75rem',
          color: 'var(--nillion-primary-lighter)',
        }}
      >
        {title || (allConfirmed ? '✓ Complete' : anyActive ? 'Processing...' : 'Transaction Progress')}
      </h4>

      {transactions.map((tx, index) => (
        <div key={index}>
          {/* Transaction Step */}
          <div style={{ marginBottom: index < transactions.length - 1 ? '0.5rem' : '0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem',
              }}
            >
              {/* Status Circle */}
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background:
                    tx.status === 'submitted' || tx.status === 'confirming'
                      ? 'var(--nillion-primary)'
                      : tx.status === 'confirmed'
                      ? 'rgba(100, 255, 100, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)',
                  border:
                    tx.status === 'submitted' || tx.status === 'confirming'
                      ? '2px solid var(--nillion-primary-lighter)'
                      : tx.status === 'confirmed'
                      ? '2px solid #4ade80'
                      : '2px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  flexShrink: 0,
                }}
              >
                {tx.status === 'submitted' || tx.status === 'confirming' ? (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                ) : tx.status === 'confirmed' ? (
                  '✓'
                ) : (
                  index + 1
                )}
              </div>

              {/* Transaction Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.0625rem' }}>
                  {tx.label}
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                  {tx.description ||
                    (tx.status === 'submitted'
                      ? 'Waiting for wallet...'
                      : tx.status === 'confirming'
                      ? 'Confirming on-chain...'
                      : tx.status === 'confirmed'
                      ? 'Confirmed'
                      : 'Pending...')}
                </div>
              </div>
            </div>

            {/* Transaction Hash */}
            {tx.hash && (
              <div
                style={{
                  marginLeft: '1.75rem',
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <code
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.25rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                    fontSize: '0.625rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tx.hash}
                </code>
                <a
                  href={`${explorerBaseUrl}/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--nillion-primary)',
                    textDecoration: 'none',
                    fontSize: '0.65rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  View →
                </a>
              </div>
            )}
          </div>

          {/* Connector Line */}
          {index < transactions.length - 1 && (
            <div
              style={{
                width: '2px',
                height: '0.5rem',
                background:
                  transactions[index + 1].status !== 'pending'
                    ? 'rgba(138, 137, 255, 0.4)'
                    : 'rgba(255, 255, 255, 0.1)',
                marginLeft: '9px',
                marginBottom: '0.25rem',
              }}
            />
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
