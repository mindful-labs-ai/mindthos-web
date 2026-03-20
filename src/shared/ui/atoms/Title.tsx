import React from 'react';

import { cn } from '@/lib/cn';

export type TitleAs = 'h1' | 'h2' | 'h3' | 'h4';

export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: TitleAs;
  children: React.ReactNode;
}

const headingStyles: Record<TitleAs, string> = {
  h1: 'typo-2xl-extrabold tracking-tight',
  h2: 'typo-xl-headline tracking-tight',
  h3: 'typo-l-headline',
  h4: 'typo-m',
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
