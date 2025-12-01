export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Spinner component for loading states
 *
 * Sizes:
 * - small: 1rem (16px)
 * - medium: 2rem (32px) - default
 * - large: 3rem (48px)
 */
export function Spinner({ size = 'medium', className = '' }: SpinnerProps) {
  const sizeClass = `spinner-${size}`;
  const finalClassName = ['spinner', sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={finalClassName} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
}
