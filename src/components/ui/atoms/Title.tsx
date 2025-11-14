import React from 'react';

import { cn } from '@/lib/cn';

export type TitleAs = 'h1' | 'h2' | 'h3' | 'h4';

export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: TitleAs;
  children: React.ReactNode;
}

const headingStyles: Record<TitleAs, string> = {
  h1: 'text-3xl font-bold tracking-tight',
  h2: 'text-2xl font-semibold tracking-tight',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-medium',
};

/**
 * Title - 시맨틱 헤딩 컴포넌트
 * 일관된 타이포그래피 제공
 *
 * @example
 * <Title as="h1">Page Title</Title>
 */
export const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(
  ({ as: Component = 'h2', className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('text-fg', headingStyles[Component], className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Title.displayName = 'Title';
