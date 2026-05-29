import { cn } from '@/lib/cn';

type StatusTone = 'success' | 'warning' | 'danger' | 'muted';

interface StatusCircleProps {
  tone: StatusTone;
  size?: number;
  className?: string;
  /** 'check' | '!' */
  symbol?: 'check' | 'exclaim';
}

const TONE_BG: Record<StatusTone, string> = {
  success: 'bg-green-80',
  warning: 'bg-yellow-80',
  danger: 'bg-red-80',
  muted: 'bg-grey-80',
};

/**
 * 원형 상태 뱃지 (체크/느낌표).
 * 색상은 success(녹) / warning(주황) / danger(빨) / muted(회색).
 */
export const StatusCircle = ({
  tone,
  size = 24,
  className,
  symbol = 'check',
}: StatusCircleProps) => {
  const inner = symbol === 'check' ? '✓' : '!';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-emphasize text-white',
        TONE_BG[tone],
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.7, lineHeight: 1 }}
      aria-hidden
    >
      {inner}
    </span>
  );
};
