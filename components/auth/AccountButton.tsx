'use client';

import { useAppKit } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui';

interface AccountButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export function AccountButton({
  variant = 'outline',
  size = 'small',
}: AccountButtonProps) {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  if (!isConnected || !address) {
    return null;
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => open({ view: 'Account' })}
      type="button"
    >
      {formatAddress(address)}
    </Button>
  );
}
