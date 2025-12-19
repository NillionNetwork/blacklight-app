'use client';

import Link from 'next/link';
import { Card } from '@/components/ui';

export default function Home() {
  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="badge">
            <span>nilAV Network</span>
          </div>

          <h1 className="hero-title">Decentralized Verification Network</h1>

          <p className="hero-subtitle">
            Run verification nodes and manage TEE workloads on the Nillion network
          </p>

          {/* Navigation Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginTop: '3rem',
              maxWidth: '900px',
            }}
          >
            {/* Node Dashboard Card */}
            <Link href="/nodes" style={{ textDecoration: 'none' }}>
              <Card className="landing-nav-card">
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.75rem',
                  }}
                >
                  Node Dashboard
                </h2>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '1rem',
                    lineHeight: '1.5',
                  }}
                >
                  Manage your nilAV verification nodes, view activity, and track rewards
                </p>
                <div style={{ color: '#8a89ff', fontSize: '0.875rem', fontWeight: '500' }}>
                  View Nodes →
                </div>
              </Card>
            </Link>

            {/* Setup Node Card */}
            <Link href="/setup" style={{ textDecoration: 'none' }}>
              <Card className="landing-nav-card">
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.75rem',
                  }}
                >
                  Set up Node
                </h2>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '1rem',
                    lineHeight: '1.5',
                  }}
                >
                  Configure and deploy a new nilAV verification node
                </p>
                <div style={{ color: '#8a89ff', fontSize: '0.875rem', fontWeight: '500' }}>
                  Start Setup →
                </div>
              </Card>
            </Link>

            {/* TEE Workload Card - Full Width on Single Row */}
            <Link href="/workloads" style={{ textDecoration: 'none', gridColumn: '1 / -1' }}>
              <Card
                className="landing-nav-card"
                style={{
                  background: 'rgba(138, 137, 255, 0.05)',
                  borderColor: 'rgba(138, 137, 255, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <h2
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    Developers: Submit TEE Workload
                  </h2>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      background: '#8a89ff',
                      color: 'white',
                      borderRadius: '0.25rem',
                      fontWeight: '600',
                    }}
                  >
                    NEW
                  </span>
                </div>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '1rem',
                    lineHeight: '1.5',
                  }}
                >
                  Register your TEE applications for decentralized verification. Supports Phala,
                  Nillion, Azure, AWS, Google Cloud, and Secret Network.
                </p>
                <div style={{ color: '#8a89ff', fontSize: '0.875rem', fontWeight: '500' }}>
                  Manage Workloads →
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
