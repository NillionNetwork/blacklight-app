import { ReactNode } from 'react';
import { Button } from './Button';

export interface ErrorMessageProps {
  title?: string;
  message: string | ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * ErrorMessage component for displaying onchain errors and other error states
 *
 * Features:
 * - Optional title
 * - Error message (string or ReactNode for custom formatting)
 * - Optional retry button
 * - Optional dismiss button
 * - Red accent styling
 */
export function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  onDismiss,
  className = '',
}: ErrorMessageProps) {
  const finalClassName = ['error-message', className].filter(Boolean).join(' ');

  return (
    <div className={finalClassName} role="alert">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <h3 className="error-title">{title}</h3>
        <div className="error-text">{message}</div>
        {(onRetry || onDismiss) && (
          <div className="error-actions">
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
