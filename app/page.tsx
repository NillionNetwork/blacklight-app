'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

export default function Home() {
  const router = useRouter();

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="badge">
            <span>Nillion verifier node</span>
          </div>

          <h1 className="hero-title">Manage your verifier node</h1>

          <p className="hero-subtitle">
            Set up your nilUV node, contribute to the Blind Computer, and start
            earning rewards in minutes
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="medium"
              onClick={() => router.push('/nodes')}
            >
              Node Dashboard
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={() => router.push('/setup')}
            >
              Set up Node
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
