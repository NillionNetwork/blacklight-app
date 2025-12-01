export interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

/**
 * LoadingSkeleton component for loading states
 *
 * Features:
 * - Animated shimmer effect
 * - Customizable dimensions
 * - Matches dark theme aesthetic
 *
 * Usage:
 * - <LoadingSkeleton /> - Default size
 * - <LoadingSkeleton width="200px" height="24px" /> - Custom size
 * - <LoadingSkeleton className="custom-class" /> - With custom class
 */
export function LoadingSkeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '0.375rem',
  className = '',
}: LoadingSkeletonProps) {
  const finalClassName = ['loading-skeleton', className].filter(Boolean).join(' ');

  return (
    <div
      className={finalClassName}
      style={{ width, height, borderRadius }}
      aria-label="Loading..."
    />
  );
}
