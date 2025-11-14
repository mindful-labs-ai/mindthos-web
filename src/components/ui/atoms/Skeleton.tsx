import React from 'react';

import { cn } from '@/lib/cn';

export type SkeletonVariant = 'text' | 'circle' | 'rectangle';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Skeleton - 로딩 플레이스홀더
 * pulse 애니메이션 지원
 * text/circle/rectangle 변형 제공
 *
 * @example
 * <Skeleton variant="text" width="200px" />
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
