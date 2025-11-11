import React from 'react';

import { cn } from '@/lib/cn';

export interface VisuallyHiddenProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Content to hide visually but keep accessible to screen readers
   */
  children: React.ReactNode;
}

/**
 * VisuallyHidden component
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Useful for providing additional context to assistive technologies.
 *
 * @example
 * ```tsx
 * <button>
 *   <Icon />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 * ```
 */
export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  VisuallyHiddenProps
>(({ children, className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0',
        '[clip:rect(0,0,0,0)]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

VisuallyHidden.displayName = 'VisuallyHidden';
