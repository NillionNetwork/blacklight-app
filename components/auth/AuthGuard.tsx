'use client'

import { useAppKitAccount } from '@reown/appkit/react'
import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectWallet } from './ConnectWallet'

interface AuthGuardProps {
  children: ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/' }: AuthGuardProps) {
  const { isConnected } = useAppKitAccount()
  const router = useRouter()

  useEffect(() => {
    // If not authenticated, redirect
    if (!isConnected) {
      router.push(redirectTo)
    }
  }, [isConnected, router, redirectTo])

  // If not connected to wallet, show connect prompt
  if (!isConnected) {
    return (
      <div className="auth-guard-prompt">
        <div className="auth-guard-content">
          <h2>Wallet Connection Required</h2>
          <p>Please connect your wallet to access this page.</p>
          <ConnectWallet />
        </div>
      </div>
    )
  }

  // User is authenticated, render protected content
  return <>{children}</>
}
