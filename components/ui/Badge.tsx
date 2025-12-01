import { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Badge component for status indicators and labels
 *
 * Features:
 * - Uses Nillion .nillion-badge class as base
 * - Multiple variants for different states
 * - Compact, pill-shaped design
 *
 * Variants:
 * - default: Primary Nillion purple
 * - success: Green for success states
 * - warning: Yellow/orange for warnings
 * - error: Red for errors
 * - info: Blue/grey for informational
 */
export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}: BadgeProps) {
  const variantClass = variant !== 'default' ? `badge-${variant}` : '';
  const finalClassName = ['nillion-badge', variantClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={finalClassName} {...props}>
      {children}
    </span>
  );
}
