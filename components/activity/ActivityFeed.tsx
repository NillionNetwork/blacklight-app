'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getOperatorRegistration,
  getOperatorDeactivation,
  getHTXAssignments,
  getHTXResponses,
  formatTimeAgo,
} from '@/lib/indexer';
import { Spinner } from '@/components/ui';
import { getEventConfig, formatEventDescription } from './eventConfig';
import { activeContracts } from '@/config';
import { toast } from 'sonner';

interface ActivityFeedProps {
  nodeAddress: string;
}

// Union type for all event types we display
type TimelineEvent =
  | {
      type: 'operator_registered' | 'operator_deactivated';
      block_num: number;
      block_timestamp: string;
      tx_hash: string;
      operator: string;
    }
  | {
      type: 'htx_assigned';
      block_num: number;
      block_timestamp: string;
      tx_hash: string;
      htxId: string;
      node: string;
    }
  | {
      type: 'htx_responded';
      block_num: number;
      block_timestamp: string;
      tx_hash: string;
      htxId: string;
      node: string;
      result: boolean;
    };

export function ActivityFeed({ nodeAddress }: ActivityFeedProps) {
  // ============================================================================
  // DEPENDENT QUERY PATTERN
  // ============================================================================
  // We use a two-step approach for optimal performance:
  // 1. Fetch registration event → get the block number when operator registered
  // 2. Use that block as the starting point for all other event queries
  //
  // Why? An operator can't have events before they registered! This:
  // - Improves performance (only scans relevant blocks)
  // - Reduces API costs (fewer blocks to query)
  // - Makes logical sense (no events before registration)
  //
  // This pattern applies per operator address. When navigating to a different
  // /nodes/[nodeAddress] page, we fetch that operator's registration and events.
  // ============================================================================

  // Step 1: Fetch registration event first (this gives us the starting block)
  const {
    data: registrationData,
    isLoading: isLoadingRegistration,
    error: registrationError,
    refetch: refetchRegistration,
  } = useQuery({
    queryKey: ['operator-registration', nodeAddress],
    queryFn: () => getOperatorRegistration(nodeAddress),
  });

  // Get the registration block number (starting point for all other events)
  const registrationBlockNum = registrationData?.data?.[0]?.block_num;

  // Step 2: Fetch other events ONLY after registration is found
  // This ensures we only query events that happened after this operator registered
  const {
    data: deactivationData,
    isLoading: isLoadingDeactivation,
    error: deactivationError,
    refetch: refetchDeactivation,
  } = useQuery({
    queryKey: ['operator-deactivation', nodeAddress, registrationBlockNum],
    queryFn: () => getOperatorDeactivation(nodeAddress, registrationBlockNum),
    // Only run this query if we have a registration block number
    enabled: registrationBlockNum !== undefined,
  });

  // Step 3: Fetch HTX events (these show the actual verification work)
  // Limit to 25 events for performance
  const {
    data: htxAssignmentsData,
    isLoading: isLoadingHTXAssignments,
    error: htxAssignmentsError,
    refetch: refetchHTXAssignments,
  } = useQuery({
    queryKey: ['htx-assignments', nodeAddress, registrationBlockNum],
    queryFn: () => getHTXAssignments(nodeAddress, registrationBlockNum, 10),
    enabled: registrationBlockNum !== undefined,
  });

  const {
    data: htxResponsesData,
    isLoading: isLoadingHTXResponses,
    error: htxResponsesError,
    refetch: refetchHTXResponses,
  } = useQuery({
    queryKey: ['htx-responses', nodeAddress, registrationBlockNum],
    queryFn: () => getHTXResponses(nodeAddress, registrationBlockNum, 10),
    enabled: registrationBlockNum !== undefined,
  });

  const isLoading =
    isLoadingRegistration ||
    isLoadingDeactivation ||
    isLoadingHTXAssignments ||
    isLoadingHTXResponses;
  const error =
    registrationError ||
    deactivationError ||
    htxAssignmentsError ||
    htxResponsesError;

  // Manual refresh handler
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchRegistration(),
        refetchDeactivation(),
        refetchHTXAssignments(),
        refetchHTXResponses(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Spinner size="large" />
        <p style={{ marginTop: '1rem', opacity: 0.7 }}>Loading activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#ff6b6b',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
          Failed to load activity
        </div>
        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  // Group HTX events by htxId to show lifecycle
  type HTXLifecycle = {
    htxId: string;
    assignment: {
      block_num: number;
      block_timestamp: string;
      tx_hash: string;
    };
    response?: {
      block_num: number;
      block_timestamp: string;
      tx_hash: string;
      result: boolean;
    };
  };

  const htxMap = new Map<string, HTXLifecycle>();

  // Process assignments
  if (htxAssignmentsData?.data) {
    htxAssignmentsData.data.forEach((event) => {
      htxMap.set(event.htxId, {
        htxId: event.htxId,
        assignment: {
          block_num: event.block_num,
          block_timestamp: event.block_timestamp,
          tx_hash: event.tx_hash,
        },
      });
    });
  }

  // Process responses
  if (htxResponsesData?.data) {
    htxResponsesData.data.forEach((event) => {
      const existing = htxMap.get(event.htxId);
      if (existing) {
        existing.response = {
          block_num: event.block_num,
          block_timestamp: event.block_timestamp,
          tx_hash: event.tx_hash,
          result: event.result,
        };
      } else {
        // Response without assignment (shouldn't happen, but handle it)
        htxMap.set(event.htxId, {
          htxId: event.htxId,
          assignment: {
            block_num: event.block_num,
            block_timestamp: event.block_timestamp,
            tx_hash: event.tx_hash,
          },
          response: {
            block_num: event.block_num,
            block_timestamp: event.block_timestamp,
            tx_hash: event.tx_hash,
            result: event.result,
          },
        });
      }
    });
  }

  // Convert map to array and sort by assignment time (most recent first)
  const htxLifecycles = Array.from(htxMap.values()).sort(
    (a, b) => b.assignment.block_num - a.assignment.block_num
  );

  // No HTX activity yet
  if (htxLifecycles.length === 0) {
    return (
      <div>
        {/* Header with refresh button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            No HTX events yet
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: '0.5rem 1rem',
              background: isRefreshing
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            <span
              style={{
                transform: isRefreshing ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.3s',
              }}
            >
              🔄
            </span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <div
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            No HTX Activity Yet
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
            Once this node is assigned HTX verification tasks,
            <br />
            they will appear here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with refresh button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          Latest {htxLifecycles.length} HTXs since registration
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            padding: '0.5rem 1rem',
            background: isRefreshing
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            color: 'white',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          <span
            style={{
              transform: isRefreshing ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.3s',
            }}
          >
            🔄
          </span>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Activity Table */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <th
                style={{
                  padding: '0.875rem 1rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  opacity: 0.7,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                HTX ID
              </th>
              <th
                style={{
                  padding: '0.875rem 1rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  opacity: 0.7,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Verdict
              </th>
              <th
                style={{
                  padding: '0.875rem 1rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  opacity: 0.7,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Assigned
              </th>
              <th
                style={{
                  padding: '0.875rem 1rem',
                  textAlign: 'right',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  opacity: 0.7,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Transactions
              </th>
            </tr>
          </thead>
          <tbody>
            {htxLifecycles.map((htx, index) => {
              const assignedTimeAgo = htx.assignment.block_timestamp
                ? formatTimeAgo(htx.assignment.block_timestamp)
                : `Block #${htx.assignment.block_num}`;

              // Calculate verdict
              let verdictText = '';
              let verdictIcon = '';
              let verdictColor = '';
              let bgColor = '';

              if (htx.response) {
                if (htx.response.result) {
                  verdictText = 'Valid';
                  verdictIcon = '✓';
                  verdictColor = 'rgba(76, 175, 80, 1)';
                  bgColor = 'rgba(76, 175, 80, 0.1)';
                } else {
                  verdictText = 'Invalid';
                  verdictIcon = '✗';
                  verdictColor = 'rgba(244, 67, 54, 1)';
                  bgColor = 'rgba(244, 67, 54, 0.1)';
                }
              } else {
                // Still pending verdict
                verdictText = 'Pending';
                verdictIcon = '⏳';
                verdictColor = 'rgba(255, 152, 0, 1)';
                bgColor = 'rgba(255, 152, 0, 0.1)';
              }

              const isLastRow = index === htxLifecycles.length - 1;

              return (
                <tr
                  key={htx.htxId}
                  style={{
                    borderBottom: isLastRow
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = bgColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* HTX ID Column */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <code
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          opacity: 0.8,
                          whiteSpace: 'nowrap',
                        }}
                        title={htx.htxId}
                      >
                        {htx.htxId.slice(0, 10)}...{htx.htxId.slice(-6)}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(htx.htxId);
                          toast.success('HTX ID copied to clipboard');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--nillion-primary)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: 0.6,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.6';
                        }}
                        title="Copy HTX ID"
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
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  {/* Verdict Column */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '1rem', color: verdictColor }}>
                        {verdictIcon}
                      </span>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          color: verdictColor,
                          fontWeight: 500,
                        }}
                      >
                        {verdictText}
                      </span>
                    </div>
                  </td>

                  {/* Assigned Column */}
                  <td
                    style={{
                      padding: '0.875rem 1rem',
                      opacity: 0.7,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {assignedTimeAgo}
                  </td>

                  {/* Transactions Column */}
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                      }}
                    >
                      <a
                        href={`${activeContracts.blockExplorer}/tx/${htx.assignment.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--nillion-primary)',
                          textDecoration: 'none',
                          fontSize: '0.8125rem',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                        title="View assignment transaction"
                      >
                        Assignment ↗
                      </a>
                      {htx.response && (
                        <>
                          <span style={{ opacity: 0.5 }}>|</span>
                          <a
                            href={`${activeContracts.blockExplorer}/tx/${htx.response.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--nillion-primary)',
                              textDecoration: 'none',
                              fontSize: '0.8125rem',
                              whiteSpace: 'nowrap',
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration =
                                'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                            title="View response transaction"
                          >
                            Response ↗
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
