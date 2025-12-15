'use client'

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { Button } from '@/components/ui'
import { activeNetwork } from '@/config'
import { useEffect, useState } from 'react'
import { useSwitchChain } from 'wagmi'

interface ConnectWalletProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
}

export function ConnectWallet({ variant = 'primary', size = 'medium' }: ConnectWalletProps) {
  const { open } = useAppKit()
  const { isConnected } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { switchChain, isPending } = useSwitchChain()
  const [autoSwitched, setAutoSwitched] = useState(false)

  // Automatically switch network after connection
  useEffect(() => {
    if (isConnected && chainId && chainId !== activeNetwork.id && !autoSwitched && !isPending) {
      setAutoSwitched(true)
      switchChain({ chainId: activeNetwork.id })
    }
    // Reset autoSwitched when disconnected
    if (!isConnected) {
      setAutoSwitched(false)
    }
  }, [isConnected, chainId, switchChain, autoSwitched, isPending])

  const handleClick = () => {
    if (!isConnected) {
      // Open wallet connection modal
      open()
    } else if (chainId !== activeNetwork.id) {
      // Switch network if on wrong network
      switchChain({ chainId: activeNetwork.id })
    }
  }

  const getButtonText = () => {
    if (!isConnected) {
      return 'Connect Wallet'
    }
    if (isPending) {
      return 'Switching Network...'
    }
    if (chainId !== activeNetwork.id) {
      return 'Switch Network'
    }
    return 'Connected'
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      type="button"
      disabled={(isConnected && chainId === activeNetwork.id) || isPending}
    >
      {getButtonText()}
    </Button>
  )
}
