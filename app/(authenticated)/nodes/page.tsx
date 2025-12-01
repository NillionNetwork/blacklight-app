'use client';

import Link from 'next/link';
import { useNodes } from '@/lib/hooks';
import { Spinner } from '@/components/ui';

export default function NodesPage() {
  const { nodes, loading, error } = useNodes();

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

  if (nodes.length === 0) {
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
          You haven't registered any verifier nodes yet.
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
      <h1 style={{ marginBottom: '2rem' }}>My Nodes</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {nodes.map((node) => (
          <Link
            key={node.id}
            href={`/dashboard?node=${encodeURIComponent(node.publicKey)}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'var(--nillion-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background:
                      node.status === 'active'
                        ? '#00ff00'
                        : node.status === 'error'
                        ? '#ff0000'
                        : '#999',
                  }}
                />
                <strong>{node.status.toUpperCase()}</strong>
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
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
                  {node.publicKey.slice(0, 20)}...
                </div>
              </div>

              <div>
                <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Registered
                </small>
                <div>{new Date(node.registeredAt).toLocaleDateString()}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
