import { cn } from '@/lib/cn';

interface VerificationSummaryBarProps {
  verifiedCount: number;
  missingCount: number;
  totalCount: number;
  className?: string;
}

export const VerificationSummaryBar = ({
  verifiedCount,
  missingCount,
  totalCount,
  className,
}: VerificationSummaryBarProps) => {
  const percent = totalCount === 0 ? 0 : (verifiedCount / totalCount) * 100;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-2xl border border-grey-40 bg-white px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-green-20 px-3 py-2 text-sm font-medium text-green-80">
          완성 {verifiedCount}
        </span>
        {missingCount > 0 && (
          <span className="bg-yellow-20 text-yellow-80 rounded-md px-3 py-2 text-sm font-medium">
            누락 {missingCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative h-1.5 w-32 overflow-hidden bg-grey-30">
          <div
            className="h-full bg-green-80 transition-[width] duration-fast"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-sm font-sub text-grey-70">
          {verifiedCount}/{totalCount}
        </span>
      </div>
    </div>
  );
};
