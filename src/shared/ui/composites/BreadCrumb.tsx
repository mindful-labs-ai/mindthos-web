import React from 'react';

import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

export interface BreadCrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadCrumbProps {
  items: BreadCrumbItem[];
  separator?: React.ReactNode;
  onItemClick?: (item: BreadCrumbItem, index: number) => void;
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
 * BreadCrumb - 계층형 네비게이션 표시
 * 현재 페이지 위치를 시각적으로 표현
 *
 * @example
 * <BreadCrumb items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />
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
      <ol className="flex items-center gap-2 text-m font-medium">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  onClick={(e) => handleClick(e, item, index)}
                  className={cn(
                    'transition-default flex items-center gap-1.5',
                    'cursor-pointer text-grey-60 hover:text-grey-80',
                    'focus-default rounded-sm'
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
                    'transition-default flex items-center gap-1.5',
                    'font-medium text-grey-80'
                  )}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">{item.icon}</span>
                  )}
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="text-grey-60" aria-hidden="true">
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
