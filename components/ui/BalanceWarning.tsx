'use client';

import { Button } from './Button';

export interface BalanceWarningProps {
  /**
   * Type of balance warning
   */
  type: 'eth' | 'token';
  /**
   * Token symbol (e.g., "NIL")
   */
  tokenSymbol?: string;
  /**
   * Optional callback when "Get Help" is clicked
   */
  onGetHelp?: () => void;
  /**
   * Optional help link URL
   */
  helpLink?: string;
  /**
   * Whether user already has an existing stake (for token type only)
   * When true, shows a gentler message without red styling
   */
  hasExistingStake?: boolean;
}

export function BalanceWarning({
  type,
  tokenSymbol = 'NIL',
  onGetHelp,
  helpLink,
  hasExistingStake = false,
}: BalanceWarningProps) {
  const isEth = type === 'eth';
  const isGentleMessage = !isEth && hasExistingStake;

  const handleGetHelp = () => {
    if (onGetHelp) {
      onGetHelp();
    } else if (helpLink) {
      window.open(helpLink, '_blank');
    }
  };

  return (
    <div
      style={{
        background: isGentleMessage
          ? 'rgba(138, 137, 255, 0.1)'
          : 'rgba(255, 100, 100, 0.1)',
        border: isGentleMessage
          ? '1px solid rgba(138, 137, 255, 0.3)'
          : '1px solid rgba(255, 100, 100, 0.3)',
        borderRadius: '0.5rem',
        padding: '0.875rem',
        marginBottom: '0.75rem',
        fontSize: '0.875rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
        }}
      >
        {!isGentleMessage && (
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
        )}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              color: isGentleMessage ? 'rgba(255, 255, 255, 0.9)' : '#ff6b6b',
              marginBottom: '0.25rem',
            }}
          >
            {isEth
              ? 'Insufficient ETH Balance'
              : isGentleMessage
              ? `Add ${tokenSymbol} Tokens`
              : `No ${tokenSymbol} Tokens`}
          </div>
          <div style={{ opacity: 0.9, marginBottom: '0.75rem' }}>
            {isEth
              ? 'You need ETH to pay for transaction fees. Please add ETH to your wallet before staking.'
              : isGentleMessage
              ? `To increase your staked amount, you need to add ${tokenSymbol} tokens to your wallet.`
              : `You need ${tokenSymbol} tokens to stake. Please add ${tokenSymbol} tokens to your wallet.`}
          </div>
          {(onGetHelp || helpLink) && (
            <Button
              variant="outline"
              size="small"
              onClick={handleGetHelp}
              style={{
                fontSize: '0.8125rem',
                padding: '0.375rem 0.75rem',
                height: 'auto',
              }}
            >
              Get Help
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
