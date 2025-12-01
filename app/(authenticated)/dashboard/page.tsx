'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Spinner, Button } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import type { Node, NodeMetrics, NodeActivity } from '@/lib/types/node';
import { toast } from 'sonner';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { address } = useAppKitAccount();
  const nodePublicKey = searchParams.get('node');

  const [node, setNode] = useState<Node | null>(null);
  const [metrics, setMetrics] = useState<NodeMetrics | null>(null);
  const [activity, setActivity] = useState<NodeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNodeData() {
      if (!nodePublicKey) {
        setError('No node specified');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get all nodes to find the one matching this public key
        if (!address) {
          throw new Error('Wallet not connected');
        }

        const nodes = await apiClient.getNodes(address);
        const foundNode = nodes.find((n) => n.publicKey === nodePublicKey);

        if (!foundNode) {
          throw new Error('Node not found');
        }

        setNode(foundNode);

        // Load metrics and activity
        const [metricsData, activityData] = await Promise.all([
          apiClient.getNodeMetrics(foundNode.id),
          apiClient.getNodeActivity(foundNode.id, 50),
        ]);

        setMetrics(metricsData);
        setActivity(activityData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadNodeData();
  }, [nodePublicKey, address]);

  const handleStakeChange = (action: 'increase' | 'decrease') => {
    // TODO: Implement staking logic when contracts are ready
    toast.info(
      `${action === 'increase' ? 'Increase' : 'Decrease'} stake - Coming soon!`
    );
  };

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

  if (error || !node) {
    return (
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <h1>Error Loading Node</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {error || 'Node not found'}
        </p>
        <a
          href="/nodes"
          style={{
            color: 'var(--nillion-primary)',
            marginTop: '1rem',
            display: 'inline-block',
          }}
        >
          ← Back to All Nodes
        </a>
      </div>
    );
  }

  const isOwner = node.walletAddress.toLowerCase() === address?.toLowerCase();

  return (
    <div
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Node Dashboard</h1>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background:
                    node.status === 'active'
                      ? '#00ff00'
                      : node.status === 'error'
                      ? '#ff0000'
                      : '#999',
                }}
              />
              <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {node.status.toUpperCase()}
              </span>
            </div>
          </div>
          {isOwner && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                variant="outline"
                onClick={() => handleStakeChange('increase')}
              >
                + Increase Stake
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleStakeChange('decrease')}
              >
                - Decrease Stake
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Node Info Card */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Public Key
            </small>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                wordBreak: 'break-all',
              }}
            >
              {node.publicKey}
            </div>
          </div>
          {node.platform && (
            <div>
              <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Platform
              </small>
              <div>{node.platform}</div>
            </div>
          )}
          <div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Registered
            </small>
            <div>{new Date(node.registeredAt).toLocaleString()}</div>
          </div>
          {node.lastSeen && (
            <div>
              <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Last Seen
              </small>
              <div>{new Date(node.lastSeen).toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Performance Metrics</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Uptime
              </small>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {metrics.uptime}%
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Total Requests
              </small>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {metrics.totalRequests.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Success Rate
              </small>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {metrics.successRate}%
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Total Earnings
              </small>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {metrics.earnings.total} NIL
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Avg Response Time
              </small>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {metrics.performance.avgResponseTime}ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {activity.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Activity Log</h2>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}
          >
            {activity.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                        background:
                          log.type === 'error'
                            ? 'rgba(255, 0, 0, 0.2)'
                            : log.type === 'status_change'
                            ? 'rgba(0, 255, 0, 0.2)'
                            : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {log.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div>{log.message}</div>
                  </div>
                  <small
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(log.timestamp).toLocaleString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
