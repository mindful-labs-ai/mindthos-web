import { cn } from '@/lib/cn';

interface FieldSeparatorProps {
  className?: string;
}

/** 카드 내부 가로 분리선 — 1px border-b 단일 라인 (좌우 패딩은 카드에서 부여) */
export const FieldSeparator = ({ className }: FieldSeparatorProps) => (
  <div className={cn('h-px w-full border-b border-grey-40', className)} />
);
