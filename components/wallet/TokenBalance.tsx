'use client';

import { useReadContract, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { contracts, nilavTestnet } from '@/config';

// ERC-20 ABI for balanceOf
const erc20ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

interface TokenBalanceProps {
  address?: `0x${string}`;
  variant?: 'badge' | 'inline' | 'compact';
  showLabel?: boolean;
  tokenType?: 'ETH' | 'TEST';
}

export function TokenBalance({
  address,
  variant = 'badge',
  showLabel = true,
  tokenType = 'TEST',
}: TokenBalanceProps) {
  // Read native ETH balance
  const { data: ethBalance, isLoading: isLoadingEth } = useBalance({
    address: address,
    chainId: nilavTestnet.id,
  });

  // Read TEST token balance
  const { data: testBalance, isLoading: isLoadingTest } = useReadContract({
    address: contracts.nilavTestnet.testToken as `0x${string}`,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: nilavTestnet.id,
  });

  const balance = tokenType === 'ETH' ? ethBalance?.value : (testBalance as bigint | undefined);
  const isLoading = tokenType === 'ETH' ? isLoadingEth : isLoadingTest;
  const tokenSymbol = tokenType;

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return '0';
    const formatted = formatUnits(bal, 18);
    const num = parseFloat(formatted);
    if (num === 0) return '0';
    if (num < 0.01) return '<0.01';

    // Check if number has decimals
    const hasDecimals = num % 1 !== 0;

    // Use comma formatting - show decimals only if they exist
    return num.toLocaleString('en-US', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  if (!address) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ opacity: 0.6, fontSize: '0.875rem' }}>
        Loading...
      </div>
    );
  }

  const labelText = tokenType === 'ETH' ? 'ETH Balance' : 'TEST Balance';

  // Badge variant (purple box with label and value)
  if (variant === 'badge') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 1rem',
          background: 'rgba(138, 137, 255, 0.1)',
          border: '1px solid rgba(138, 137, 255, 0.3)',
          borderRadius: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          {showLabel && (
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{labelText}</div>
          )}
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--nillion-primary)',
            }}
          >
            {formatBalance(balance)} {tokenSymbol}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (simple text)
  if (variant === 'inline') {
    return (
      <span>
        {showLabel && <span style={{ opacity: 0.6 }}>Balance: </span>}
        <span style={{ fontWeight: 600, color: 'var(--nillion-primary)' }}>
          {formatBalance(balance)} {tokenSymbol}
        </span>
      </span>
    );
  }

  // Compact variant (just the number)
  if (variant === 'compact') {
    return (
      <span style={{ fontWeight: 600, color: 'var(--nillion-primary)' }}>
        {formatBalance(balance)} {tokenSymbol}
      </span>
    );
  }

  return null;
}
