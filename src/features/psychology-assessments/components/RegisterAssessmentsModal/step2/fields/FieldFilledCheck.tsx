import { cn } from '@/lib/cn';
import { CheckIcon } from '@/shared/icons';

interface FieldFilledCheckProps {
  filled: boolean;
  className?: string;
}

/** input 우측 체크 표시 — 값이 있으면 녹색 원 + 체크, 없으면 invisible (자리 차지) */
export const FieldFilledCheck = ({
  filled,
  className,
}: FieldFilledCheckProps) => (
  <span
    className={cn(
      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-opacity',
      filled ? 'bg-green-80 text-white opacity-100' : 'opacity-0',
      className
    )}
    aria-hidden
  >
    <CheckIcon size={14} strokeWidth={3} />
  </span>
);
