'use client';

import { activeContracts } from '@/config';

/**
 * Props for a single activity event in the timeline
 */
export interface ActivityEventProps {
  /** Event icon (emoji or component) */
  icon: string | React.ReactNode;
  /** Event title/type (e.g., "Node Registered", "Tokens Staked") */
  title: string;
  /** Event description/details */
  description: string;
  /** Formatted time string (use formatTimeAgo() from lib/indexer) */
  timeAgo: string;
  /** Transaction hash for block explorer link */
  txHash: string;
  /** Optional additional metadata to display */
  metadata?: Array<{
    label: string;
    value: string;
  }>;
  /** Optional custom styling */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Compact single-line layout */
  compact?: boolean;
}

/**
 * Reusable activity event card for timeline displays
 *
 * @example
 * <ActivityEvent
 *   icon="🎉"
 *   title="Node Registered"
 *   description="Operator registered on Nilav network"
 *   timeAgo="2 hours ago"
 *   txHash="0xfc35d..."
 * />
 */
export function ActivityEvent({
  icon,
  title,
  description,
  timeAgo,
  txHash,
  metadata,
  variant = 'default',
  compact = false,
}: ActivityEventProps) {
  // Variant-specific colors
  const variantStyles = {
    default: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      hoverBorderColor: 'rgba(138, 137, 255, 0.3)',
    },
    success: {
      borderColor: 'rgba(76, 175, 80, 0.2)',
      hoverBorderColor: 'rgba(76, 175, 80, 0.4)',
    },
    warning: {
      borderColor: 'rgba(255, 152, 0, 0.2)',
      hoverBorderColor: 'rgba(255, 152, 0, 0.4)',
    },
    error: {
      borderColor: 'rgba(244, 67, 54, 0.2)',
      hoverBorderColor: 'rgba(244, 67, 54, 0.4)',
    },
  };

  const colors = variantStyles[variant];

  // Compact single-line layout
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.625rem 0.75rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${colors.borderColor}`,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = colors.hoverBorderColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          e.currentTarget.style.borderColor = colors.borderColor;
        }}
      >
        {/* Icon */}
        <span style={{ fontSize: '1.125rem', lineHeight: 1, flexShrink: 0 }}>
          {icon}
        </span>

        {/* Title + Description */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</span>
          <span style={{ opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {description}
          </span>
        </div>

        {/* Time */}
        <span style={{ opacity: 0.6, whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
          {timeAgo}
        </span>

        {/* Metadata */}
        {metadata && metadata.length > 0 && (
          <>
            {metadata.map((item, index) => (
              <span key={index} style={{ opacity: 0.6, whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                {item.value}
              </span>
            ))}
          </>
        )}

        {/* Transaction link */}
        <a
          href={`${activeContracts.blockExplorer}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--nillion-primary)',
            textDecoration: 'none',
            fontSize: '0.8125rem',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          tx ↗
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1.25rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${colors.borderColor}`,
        borderRadius: '0.75rem',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.borderColor = colors.hoverBorderColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
        e.currentTarget.style.borderColor = colors.borderColor;
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '1.5rem',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
            gap: '1rem',
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.9375rem',
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: '0.8125rem',
              opacity: 0.6,
              whiteSpace: 'nowrap',
            }}
          >
            {timeAgo}
          </span>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '0.875rem',
            opacity: 0.8,
            marginBottom: metadata && metadata.length > 0 ? '0.75rem' : '0.5rem',
          }}
        >
          {description}
        </div>

        {/* Optional Metadata */}
        {metadata && metadata.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              fontSize: '0.8125rem',
              opacity: 0.7,
              marginBottom: '0.75rem',
            }}
          >
            {metadata.map((item, index) => (
              <div key={index}>
                <span style={{ opacity: 0.6 }}>{item.label}: </span>
                <span style={{ fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Meta */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            fontSize: '0.75rem',
            opacity: 0.5,
          }}
        >
          <a
            href={`${activeContracts.blockExplorer}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--nillion-primary)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            View Transaction →
          </a>
        </div>
      </div>
    </div>
  );
}
