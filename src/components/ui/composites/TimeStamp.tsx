import React from 'react';

import { cn } from '@/lib/cn';

export interface TimeStampProps {
  /**
   * Date value (Date, string, or number)
   */
  value: Date | string | number;
  /**
   * Format string (simple implementation)
   * @default undefined (shows ISO string)
   */
  format?: string;
  /**
   * Show relative time (e.g., "2 hours ago")
   */
  relative?: boolean;
  /**
   * Additional className
   */
  className?: string;
}

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffDay < 30)
    return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;
  if (diffDay < 365)
    return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) > 1 ? 's' : ''} ago`;
};

/**
 * TimeStamp component
 *
 * Displays a timestamp with optional relative formatting.
 *
 * **A11y**: Uses `<time>` element with dateTime attribute.
 *
 * @example
 * ```tsx
 * <TimeStamp value={new Date()} relative />
 * <TimeStamp value="2024-01-15T10:30:00Z" />
 * <TimeStamp value={Date.now()} relative />
 * ```
 */
export const TimeStamp: React.FC<TimeStampProps> = ({
  value,
  format,
  relative = false,
  className,
}) => {
  const date = React.useMemo(() => {
    if (value instanceof Date) return value;
    return new Date(value);
  }, [value]);

  const displayText = React.useMemo(() => {
    if (relative) {
      return getRelativeTime(date);
    }
    if (format) {
      // Simple format implementation (you could use a library like date-fns)
      return date.toLocaleString();
    }
    return date.toISOString();
  }, [date, format, relative]);

  return (
    <time
      dateTime={date.toISOString()}
      className={cn('text-sm text-fg-muted', className)}
    >
      {displayText}
    </time>
  );
};

TimeStamp.displayName = 'TimeStamp';
