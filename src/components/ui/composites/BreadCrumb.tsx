import React from 'react';

import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

export interface BreadCrumbItem {
  /**
   * Display label
   */
  label: string;
  /**
   * Link href (if item is a link)
   */
  href?: string;
  /**
   * Icon element
   */
  icon?: React.ReactNode;
}

export interface BreadCrumbProps {
  /**
   * Breadcrumb items
   */
  items: BreadCrumbItem[];
  /**
   * Custom separator
   * @default '/'
   */
  separator?: React.ReactNode;
  /**
   * Click handler for items
   */
  onItemClick?: (item: BreadCrumbItem, index: number) => void;
  /**
   * Additional className
   */
  className?: string;
}

const ChevronRightIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

/**
 * BreadCrumb component
 *
 * Navigation breadcrumbs for hierarchical navigation.
 *
 * **A11y**: nav with aria-label, ol list structure, aria-current for last item.
 * **Keyboard**: Standard link navigation.
 *
 * @example
 * ```tsx
 * <BreadCrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Item' }
 *   ]}
 * />
 * ```
 */
export const BreadCrumb: React.FC<BreadCrumbProps> = ({
  items,
  separator = <ChevronRightIcon />,
  onItemClick,
  className,
}) => {
  const handleClick = (
    e: React.MouseEvent,
    item: BreadCrumbItem,
    index: number
  ) => {
    if (onItemClick) {
      e.preventDefault();
      onItemClick(item, index);
    }
  };

  return (
    <nav aria-label="Breadcrumb" className={cn('', className)}>
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  onClick={(e) => handleClick(e, item, index)}
                  className={cn(
                    'flex items-center gap-1.5 transition-colors duration-200',
                    'text-fg-muted hover:text-fg cursor-pointer'
                  )}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">{item.icon}</span>
                  )}
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 transition-colors duration-200',
                    'font-medium text-fg'
                  )}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">{item.icon}</span>
                  )}
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="text-fg-muted" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

BreadCrumb.displayName = 'BreadCrumb';
