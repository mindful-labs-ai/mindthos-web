import React from 'react';

import { cn } from '@/lib/cn';

export interface FootPrintItem {
  icon?: React.ReactNode;
  label: string;
  value?: string;
}

export interface FootPrintProps {
  /**
   * Meta items
   */
  items: FootPrintItem[];
  /**
   * Additional className
   */
  className?: string;
}

/**
 * FootPrint component
 *
 * Small meta line for displaying created/time/author info.
 * Pure presentational component.
 *
 * @example
 * ```tsx
 * <FootPrint
 *   items={[
 *     { icon: <UserIcon />, label: 'Author', value: 'John Doe' },
 *     { icon: <ClockIcon />, label: 'Created', value: '2 hours ago' },
 *   ]}
 * />
 * ```
 */
export const FootPrint: React.FC<FootPrintProps> = ({ items, className }) => {
  return (
    <div
      className={cn('flex items-center gap-4 text-xs text-fg-muted', className)}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          <span>
            {item.label}
            {item.value && (
              <span className="ml-1 font-medium text-fg">{item.value}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

FootPrint.displayName = 'FootPrint';
