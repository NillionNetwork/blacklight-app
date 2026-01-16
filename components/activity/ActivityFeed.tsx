'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getOperatorRegistration,
  getOperatorDeactivation,
  getRoundStartedByKeys,
  getOperatorVotes,
  formatTimeAgo,
} from '@/lib/indexer';
import {
  getVerdictLabel,
  getVerdictIcon,
  getVerdictColor,
  truncateHeartbeatKey,
} from '@/lib/utils/heartbeat';
import { Spinner } from '@/components/ui';
import { activeContracts } from '@/config';
import { toast } from 'sonner';

interface ActivityFeedProps {
  nodeAddress: string;
}

// Type for heartbeat verification lifecycle
type HeartbeatVerificationLifecycle = {
  heartbeatKey: string;
  round: number;
  assignment: {
    block_num: number;
    block_timestamp: string;
    tx_hash: string;
    members: string[];
  };
  vote?: {
    block_num: number;
    block_timestamp: string;
    tx_hash: string;
    verdict: number; // 1=Valid, 2=Invalid, 3=Error
    weight: string;
  };
};

export function ActivityFeed({ nodeAddress }: ActivityFeedProps) {
  // ============================================================================
  // OPTIMIZED HEARTBEAT VERIFICATION QUERY PATTERN
  // ============================================================================
  // OPTIMIZATION: Instead of fetching ALL rounds and filtering client-side,
  // we reverse the approach:
  //
  // 1. Fetch OperatorVoted events (SQL-filtered by operator) ✅ Efficient
  // 2. Extract unique heartbeatKeys from votes
  // 3. Fetch ONLY those specific RoundStarted events ✅ Much faster!
  //
  // Before: Fetch 100 rounds, filter to ~10 client-side
  // After:  Fetch ~10 votes, then fetch only those ~10 rounds
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

  // Step 2: Fetch operator's votes FIRST (SQL-filtered, efficient!)
  const {
    data: votesData,
    isLoading: isLoadingVotes,
    error: votesError,
    refetch: refetchVotes,
  } = useQuery({
    queryKey: ['operator-votes', nodeAddress, registrationBlockNum],
    queryFn: () => getOperatorVotes(nodeAddress, registrationBlockNum, 50),
    enabled: registrationBlockNum !== undefined,
  });

  // Step 3: Extract unique heartbeatKeys from votes
  const heartbeatKeysFromVotes = useMemo(() => {
    if (!votesData?.data) return [];
    const uniqueKeys = [...new Set(votesData.data.map(v => v.heartbeatKey))];
    return uniqueKeys.filter(key => key && key !== ''); // Remove empty keys
  }, [votesData]);

  // Step 4: Fetch ONLY the RoundStarted events for those heartbeatKeys (optimized!)
  const {
    data: roundsData,
    isLoading: isLoadingRounds,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: ['round-started-by-keys', heartbeatKeysFromVotes, registrationBlockNum],
    queryFn: () => getRoundStartedByKeys(heartbeatKeysFromVotes, registrationBlockNum),
    enabled: registrationBlockNum !== undefined && heartbeatKeysFromVotes.length > 0,
  });

  const isLoading =
    isLoadingRegistration ||
    isLoadingRounds ||
    isLoadingVotes;
  const error =
    registrationError ||
    roundsError ||
    votesError;

  // Manual refresh handler
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchRegistration(),
        refetchRounds(),
        refetchVotes(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ============================================================================
  // DATA PROCESSING: Validate and combine committee assignments with votes
  // ============================================================================
  // NOTE: All hooks must be called before any early returns (Rules of Hooks)

  // Validate rounds where this operator is in the committee
  // (This should match all rounds since we queried by operator's votes, but
  // we validate anyway for data integrity)
  const myCommitteeAssignments = useMemo(() => {
    if (!roundsData?.data || !nodeAddress) return [];

    return roundsData.data.filter(round => {
      // Validate: Check if nodeAddress is in the members[] array
      return round.members?.some(
        member => member.toLowerCase() === nodeAddress.toLowerCase()
      );
    });
  }, [roundsData, nodeAddress]);

  // Create a map of votes by heartbeatKey + round for quick lookup
  const voteMap = useMemo(() => {
    if (!votesData?.data) return new Map();

    const map = new Map<string, typeof votesData.data[0]>();
    votesData.data.forEach(vote => {
      const key = `${vote.heartbeatKey}-${vote.round}`;
      map.set(key, vote);
    });
    return map;
  }, [votesData]);

  // Combine committee assignments with votes
  const heartbeatLifecycles = useMemo(() => {
    // Filter out malformed assignments
    const validAssignments = myCommitteeAssignments.filter(assignment => {
      return assignment.heartbeatKey &&
             assignment.round !== undefined &&
             assignment.round >= 0 &&
             assignment.tx_hash;
    });

    const lifecycles: HeartbeatVerificationLifecycle[] = validAssignments
      .map(assignment => {
        const voteKey = `${assignment.heartbeatKey}-${assignment.round}`;
        const vote = voteMap.get(voteKey);

        return {
          heartbeatKey: assignment.heartbeatKey,
          round: assignment.round,
          assignment: {
            block_num: assignment.block_num,
            block_timestamp: assignment.block_timestamp,
            tx_hash: assignment.tx_hash,
            members: assignment.members,
          },
          vote: vote ? {
            block_num: vote.block_num,
            block_timestamp: vote.block_timestamp,
            tx_hash: vote.tx_hash,
            verdict: vote.verdict,
            weight: vote.weight,
          } : undefined,
        };
      });

    // Sort by assignment time (most recent first) and limit to 10
    return lifecycles
      .sort((a, b) => b.assignment.block_num - a.assignment.block_num)
      .slice(0, 10);
  }, [myCommitteeAssignments, voteMap]);

  // ============================================================================
  // EARLY RETURNS (after all hooks are called)
  // ============================================================================

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

  // No committee assignments yet
  if (heartbeatLifecycles.length === 0) {
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
            No committee assignments yet
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
            No Verification Activity Yet
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
            Once this node is selected for committee verification,
            <br />
            assignments will appear here.
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
          Latest 10 committee assignments
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
                Heartbeat
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
                Round
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
                Committee
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
                My Verdict
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
            {heartbeatLifecycles.map((heartbeat, index) => {
              const assignedTimeAgo = heartbeat.assignment.block_timestamp
                ? formatTimeAgo(heartbeat.assignment.block_timestamp)
                : `Block #${heartbeat.assignment.block_num}`;

              // Calculate verdict display
              let verdictText = '';
              let verdictIcon = '';
              let verdictColor = '';
              let bgColor = '';

              if (heartbeat.vote) {
                // Use utility functions for verdict display
                const verdict = heartbeat.vote.verdict;
                verdictText = getVerdictLabel(verdict);
                verdictIcon = getVerdictIcon(verdict);

                // Color mapping
                if (verdict === 1) { // Valid
                  verdictColor = 'rgba(76, 175, 80, 1)';
                  bgColor = 'rgba(76, 175, 80, 0.1)';
                } else if (verdict === 2 || verdict === 3) { // Invalid or Error (both display as Invalid)
                  verdictColor = 'rgba(244, 67, 54, 1)';
                  bgColor = 'rgba(244, 67, 54, 0.1)';
                } else {
                  verdictColor = 'rgba(158, 158, 158, 1)';
                  bgColor = 'rgba(158, 158, 158, 0.1)';
                }
              } else {
                // Still pending verdict
                verdictText = 'Pending';
                verdictIcon = '⏳';
                verdictColor = 'rgba(255, 152, 0, 1)';
                bgColor = 'rgba(255, 152, 0, 0.1)';
              }

              const isLastRow = index === heartbeatLifecycles.length - 1;

              return (
                <tr
                  key={`${heartbeat.heartbeatKey || 'unknown'}-${heartbeat.round}-${heartbeat.assignment.tx_hash}`}
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
                  {/* Heartbeat Key Column */}
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
                        title={heartbeat.heartbeatKey}
                      >
                        {truncateHeartbeatKey(heartbeat.heartbeatKey)}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(heartbeat.heartbeatKey);
                          toast.success('Heartbeat key copied to clipboard');
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
                        title="Copy heartbeat key"
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

                  {/* Round Column */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      #{heartbeat.round}
                    </span>
                  </td>

                  {/* Committee Size Column */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                      {heartbeat.assignment.members.length} members
                    </span>
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
                        href={`${activeContracts.blockExplorer}/tx/${heartbeat.assignment.tx_hash}`}
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
                        title="View committee assignment transaction"
                      >
                        Assignment ↗
                      </a>
                      {heartbeat.vote && (
                        <>
                          <span style={{ opacity: 0.5 }}>|</span>
                          <a
                            href={`${activeContracts.blockExplorer}/tx/${heartbeat.vote.tx_hash}`}
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
                            title="View vote transaction"
                          >
                            Vote ↗
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
