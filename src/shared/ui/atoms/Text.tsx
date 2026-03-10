import React from 'react';

import { cn } from '@/lib/cn';

export type TextAs = 'p' | 'span' | 'div';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: TextAs;
  muted?: boolean;
  truncate?: boolean;
  children: React.ReactNode;
}

/**
 * Text - 범용 텍스트 컴포넌트
 * muted, truncate 옵션 지원
 *
 * @example
 * <Text muted>Muted text</Text>
 */
export const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      as: Component = 'p',
      className,
      muted = false,
      truncate = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn(
          className,
          muted ? 'text-fg-muted' : 'text-fg',
          truncate && 'overflow-hidden truncate'
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';
