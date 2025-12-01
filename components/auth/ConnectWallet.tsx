'use client'

import { useAppKit } from '@reown/appkit/react'
import { Button } from '@/components/ui'

interface ConnectWalletProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
}

export function ConnectWallet({ variant = 'primary', size = 'medium' }: ConnectWalletProps) {
  const { open } = useAppKit()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => open()}
      type="button"
    >
      Connect Wallet
    </Button>
  )
}
