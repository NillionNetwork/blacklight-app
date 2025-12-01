'use client';

import { useRouter } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui';

export default function Home() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="badge">
            <span>Nillion verifier node</span>
          </div>

          <h1 className="hero-title">Manage your verifier node</h1>

          <p className="hero-subtitle">
            Set up your nilAV node, contribute to the Blind Computer, and start
            earning rewards in minutes
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isConnected && (
              <Button
                variant="outline"
                size="medium"
                onClick={() => router.push('/nodes')}
              >
                My Nodes
              </Button>
            )}
            <Button
              variant="primary"
              size="medium"
              onClick={() => router.push('/setup')}
            >
              Set up nilAV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
