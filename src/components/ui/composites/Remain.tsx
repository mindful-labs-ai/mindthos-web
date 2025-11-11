import React from 'react';

import { cn } from '@/lib/cn';

export type RemainFormat = 'full' | 'short' | 'minimal';
export type RemainTone = 'neutral' | 'warn' | 'danger';

export interface RemainProps {
  /**
   * Target end time (Date, string, or number)
   */
  endTime: Date | string | number;
  /**
   * Display format
   * @default 'full'
   */
  format?: RemainFormat;
  /**
   * Tone variant (changes based on urgency)
   * @default 'neutral'
   */
  tone?: RemainTone;
  /**
   * Auto-update interval in milliseconds
   * @default 1000
   */
  updateInterval?: number;
  /**
   * Callback when countdown ends
   */
  onEnd?: () => void;
  /**
   * Show icon
   */
  icon?: React.ReactNode;
  /**
   * Additional className
   */
  className?: string;
}

const toneStyles: Record<RemainTone, string> = {
  neutral: 'text-fg',
  warn: 'text-warn',
  danger: 'text-danger',
};

const ClockIcon = () => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const formatTime = (milliseconds: number, format: RemainFormat): string => {
  if (milliseconds <= 0) return 'Ended';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const s = seconds % 60;
  const m = minutes % 60;
  const h = hours % 24;

  if (format === 'minimal') {
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${h}h`;
    if (minutes > 0) return `${m}m`;
    return `${s}s`;
  }

  if (format === 'short') {
    if (days > 0) return `${days}d ${h}h`;
    if (hours > 0) return `${h}h ${m}m`;
    if (minutes > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // full format
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (h > 0) parts.push(`${h} hour${h > 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} minute${m > 1 ? 's' : ''}`);
  if (s > 0 && days === 0) parts.push(`${s} second${s > 1 ? 's' : ''}`);

  return parts.length > 0 ? parts.join(', ') : '0 seconds';
};

const getAutoTone = (milliseconds: number): RemainTone => {
  const minutes = Math.floor(milliseconds / 1000 / 60);
  if (minutes <= 5) return 'danger';
  if (minutes <= 30) return 'warn';
  return 'neutral';
};

/**
 * Remain component
 *
 * Countdown timer showing remaining time until a target date/time.
 * Automatically updates and supports multiple display formats.
 *
 * **A11y**: Uses `<time>` element with dateTime attribute, aria-live for updates.
 *
 * @example
 * ```tsx
 * <Remain endTime={new Date(Date.now() + 60000)} />
 * <Remain
 *   endTime="2024-12-31T23:59:59Z"
 *   format="short"
 *   onEnd={() => console.log('Countdown ended!')}
 * />
 * ```
 */
export const Remain: React.FC<RemainProps> = ({
  endTime,
  format = 'full',
  tone,
  updateInterval = 1000,
  onEnd,
  icon,
  className,
}) => {
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [hasEnded, setHasEnded] = React.useState(false);
  const onEndRef = React.useRef(onEnd);

  React.useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const endDate = React.useMemo(() => {
    if (endTime instanceof Date) return endTime;
    return new Date(endTime);
  }, [endTime]);

  React.useEffect(() => {
    const updateTimeLeft = () => {
      const now = Date.now();
      const end = endDate.getTime();
      const remaining = end - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        if (!hasEnded) {
          setHasEnded(true);
          onEndRef.current?.();
        }
      } else {
        setTimeLeft(remaining);
        setHasEnded(false);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, updateInterval);

    return () => clearInterval(interval);
  }, [endDate, updateInterval, hasEnded]);

  const displayText = React.useMemo(
    () => formatTime(timeLeft, format),
    [timeLeft, format]
  );

  const effectiveTone = tone || getAutoTone(timeLeft);
  const showIcon = icon !== undefined ? icon : <ClockIcon />;

  return (
    <time
      dateTime={endDate.toISOString()}
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium',
        toneStyles[effectiveTone],
        className
      )}
    >
      {showIcon && <span className="flex-shrink-0">{showIcon}</span>}
      <span>{displayText}</span>
    </time>
  );
};

Remain.displayName = 'Remain';
