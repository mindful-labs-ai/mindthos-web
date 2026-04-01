import React from 'react';

import { cn } from '@/lib/cn';

export interface VisuallyHiddenProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * VisuallyHidden - 시각적으로 숨기되 스크린 리더에는 표시
 * 접근성 개선을 위한 컴포넌트
 *
 * @example
 * <button><Icon /><VisuallyHidden>Close</VisuallyHidden></button>
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
