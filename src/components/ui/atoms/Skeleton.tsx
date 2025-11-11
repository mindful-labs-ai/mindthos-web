import React from 'react';

import { cn } from '@/lib/cn';

export type SkeletonVariant = 'text' | 'circle' | 'rectangle';

export interface SkeletonProps {
  /**
   * Variant type
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /**
   * Width (CSS value or 'full')
   */
  width?: string | number;
  /**
   * Height (CSS value)
   */
  height?: string | number;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Skeleton component
 *
 * Loading placeholder with pulse animation.
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width="200px" />
 * <Skeleton variant="circle" width={40} height={40} />
 * <Skeleton variant="rectangle" width="100%" height={200} />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className,
}) => {
  const getDefaultStyles = () => {
    switch (variant) {
      case 'circle':
        return {
          width: width || 40,
          height: height || width || 40,
          borderRadius: '50%',
        };
      case 'rectangle':
        return {
          width: width || '100%',
          height: height || 100,
          borderRadius: 'var(--radius-md)',
        };
      case 'text':
      default:
        return {
          width: width || '100%',
          height: height || '1em',
          borderRadius: 'var(--radius-sm)',
        };
    }
  };

  const defaultStyles = getDefaultStyles();

  return (
    <div
      className={cn('animate-pulse bg-surface-contrast', className)}
      style={{
        width:
          typeof defaultStyles.width === 'number'
            ? `${defaultStyles.width}px`
            : defaultStyles.width,
        height:
          typeof defaultStyles.height === 'number'
            ? `${defaultStyles.height}px`
            : defaultStyles.height,
        borderRadius: defaultStyles.borderRadius,
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

Skeleton.displayName = 'Skeleton';
