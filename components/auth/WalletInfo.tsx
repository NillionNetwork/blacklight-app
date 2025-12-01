'use client'

import { useDisconnect } from 'wagmi'
import { useAppKitAccount, useAppKitNetwork, useAppKit } from '@reown/appkit/react'
import { Button, Badge } from '@/components/ui'

export function WalletInfo() {
  const { address, isConnected } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()

  if (!isConnected || !address) {
    return null
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="wallet-info">
      <div className="wallet-info-content">
        <div className="wallet-info-address">
          <span className="wallet-info-label">Connected:</span>
          <code className="wallet-info-value">{formatAddress(address)}</code>
        </div>

        {caipNetwork && (
          <div className="wallet-info-network">
            <Badge variant={caipNetwork.testnet ? 'warning' : 'success'}>
              {caipNetwork.name}
            </Badge>
          </div>
        )}

        <div className="wallet-info-status">
          <Badge variant="success">Authenticated</Badge>
        </div>
      </div>

      <div className="wallet-info-actions">
        <Button
          variant="ghost"
          size="small"
          onClick={() => open({ view: 'Account' })}
        >
          Account
        </Button>
        <Button
          variant="outline"
          size="small"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      </div>
    </div>
  )
}
