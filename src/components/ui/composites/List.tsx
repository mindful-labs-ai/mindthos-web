import React from 'react';

import { cn } from '@/lib/cn';

export interface ListProps {
  items: React.ReactNode[];
  ordered?: boolean;
  className?: string;
}

/**
 * List component
 *
 * Simple list component with minimal styling.
 *
 * @example
 * ```tsx
 * <List items={['Item 1', 'Item 2', 'Item 3']} />
 * <List ordered items={['First', 'Second', 'Third']} />
 * ```
 */
export const List: React.FC<ListProps> = ({
  items,
  ordered = false,
  className,
}) => {
  const Component = ordered ? 'ol' : 'ul';

  return (
    <Component
      className={cn(
        'space-y-2',
        ordered ? 'list-inside list-decimal' : 'list-inside list-disc',
        'text-fg',
        className
      )}
    >
      {items.map((item, index) => (
        <li key={index} className="text-sm">
          {item}
        </li>
      ))}
    </Component>
  );
};

List.displayName = 'List';
