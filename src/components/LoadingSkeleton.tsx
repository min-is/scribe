import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

/**
 * Loading skeleton component for better UX during data loading
 */
export function LoadingSkeleton({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const skeletonClass = `${baseClasses} ${variantClasses[variant]} ${className}`;

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : '40px'),
    height: height || (variant === 'circular' ? '40px' : undefined),
  };

  if (lines > 1 && variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={skeletonClass}
            style={{
              ...style,
              width: index === lines - 1 ? '80%' : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={skeletonClass} style={style} />;
}

/**
 * Card skeleton for loading card layouts
 */
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4 bg-white dark:bg-gray-800">
      <div className="flex items-center space-x-4">
        <LoadingSkeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton width="60%" />
          <LoadingSkeleton width="40%" />
        </div>
      </div>
      <LoadingSkeleton lines={3} />
    </div>
  );
}

/**
 * Table skeleton for loading table data
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex space-x-4 pb-2 border-b">
        <LoadingSkeleton width="30%" />
        <LoadingSkeleton width="40%" />
        <LoadingSkeleton width="30%" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4 py-2">
          <LoadingSkeleton width="30%" />
          <LoadingSkeleton width="40%" />
          <LoadingSkeleton width="30%" />
        </div>
      ))}
    </div>
  );
}

/**
 * List skeleton for loading list items
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <LoadingSkeleton variant="circular" width={32} height={32} />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton width="70%" />
            <LoadingSkeleton width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
