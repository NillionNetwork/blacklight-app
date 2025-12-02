'use client';

import { useAppKit } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useDisconnect } from 'wagmi';
import { Button } from '@/components/ui';
import { TokenBalance } from '@/components/wallet';

interface AccountButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export function AccountButton({
  variant = 'outline',
  size = 'small',
}: AccountButtonProps) {
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  if (!isConnected || !address) {
    return null;
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <TokenBalance
        address={address as `0x${string}`}
        variant="badge"
        tokenType="ETH"
      />
      <TokenBalance
        address={address as `0x${string}`}
        variant="badge"
        tokenType="TEST"
      />
      <Button
        variant={variant}
        size={size}
        onClick={() => open({ view: 'Account' })}
        type="button"
      >
        {formatAddress(address)}
      </Button>
      <Button
        variant="ghost"
        size={size}
        onClick={() => disconnect()}
        type="button"
        style={{
          padding: '0.5rem',
          minWidth: 'auto',
        }}
      >
        Disconnect
      </Button>
    </div>
  );
}
