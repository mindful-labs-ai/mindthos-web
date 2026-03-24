import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// 칩 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center truncate rounded-md border border-grey-40 bg-grey-10 px-1.5 py-0.5 text-sm font-sub text-grey-100',
        className
      )}
    >
      {children}
    </span>
  );
}
