import React from 'react';

import { cn } from '@/lib/cn';

export type TextAs = 'p' | 'span' | 'div';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Semantic element to render as
   * @default 'p'
   */
  as?: TextAs;
  /**
   * Muted text style
   */
  muted?: boolean;
  /**
   * Truncate text with ellipsis
   */
  truncate?: boolean;
  /**
   * Content
   */
  children: React.ReactNode;
}

/**
 * Text component
 *
 * General purpose text component with utility variants.
 *
 * **A11y**: Semantic element selection.
 *
 * @example
 * ```tsx
 * <Text>Regular paragraph text</Text>
 * <Text as="span" muted>Muted inline text</Text>
 * <Text truncate className="max-w-xs">Very long text that will be truncated...</Text>
 * ```
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
          'text-sm',
          muted ? 'text-fg-muted' : 'text-fg',
          truncate && 'overflow-hidden truncate',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';
