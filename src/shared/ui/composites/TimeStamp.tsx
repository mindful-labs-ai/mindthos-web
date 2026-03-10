import React from 'react';

import { cn } from '@/lib/cn';

export interface TimeStampProps {
  value: Date | string | number;
  format?: string;
  relative?: boolean;
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
 * TimeStamp - 타임스탬프 표시 컴포넌트
 * 절대/상대 시간 형식 지원
 * time 요소로 접근성 준수
 *
 * @example
 * <TimeStamp value={new Date()} relative />
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
