import React from 'react';

import { cn } from '@/lib/cn';

export type CardAs = 'section' | 'article' | 'div';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Semantic element
   * @default 'div'
   */
  as?: CardAs;
}

export type CardSubComponentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Card component
 *
 * Container component with optional header, body, and footer slots.
 * Baseline style only; customize via className.
 *
 * **A11y**: Optional aria-labelledby if header has an id.
 *
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header>Title</Card.Header>
 *   <Card.Body>Content</Card.Body>
 *   <Card.Footer>Actions</Card.Footer>
 * </Card>
 * ```
 */
const CardRoot = React.forwardRef<HTMLElement, CardProps>(
  ({ as: Component = 'div', className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          'rounded-[var(--radius-lg)] border-2 border-border bg-surface',
          'shadow-sm',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardRoot.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, CardSubComponentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('border-b border-border px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'Card.Header';

const CardBody = React.forwardRef<HTMLDivElement, CardSubComponentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('px-6 py-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'Card.Body';

const CardFooter = React.forwardRef<HTMLDivElement, CardSubComponentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-contrast/50 border-t border-border px-6 py-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'Card.Footer';

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
