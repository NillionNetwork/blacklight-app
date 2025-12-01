'use client'

import { useAppKitAccount } from '@reown/appkit/react'
import { Card } from '@/components/ui'

export default function StakePage() {
  const { address } = useAppKitAccount()

  return (
    <div className="container" style={{ paddingTop: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>Stake Tokens</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Stake tokens to activate your verifier node
        </p>
      </div>

      <Card>
        <div style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Initial Stake</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Staking functionality coming in Phase 6...
          </p>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Authenticated as: {address}
          </p>
        </div>
      </Card>
    </div>
  )
}
