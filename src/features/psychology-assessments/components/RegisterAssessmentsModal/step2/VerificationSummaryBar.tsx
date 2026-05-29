import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

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
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

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
          <span className="rounded-md bg-yellow-20 px-3 py-2 text-sm font-medium text-yellow-80">
            누락 {missingCount}
          </span>
        )}
      </div>

      {/* progress bar(막대)는 모바일에서 숨김, N/M 카운트는 항상 노출 */}
      <div className="flex flex-1 items-center justify-end gap-3">
        {!isMobileView && (
          <div className="relative h-1.5 w-32 overflow-hidden bg-grey-30">
            <div
              className="h-full bg-green-80 transition-[width] duration-fast"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
        <span className="text-sm font-sub text-grey-70">
          {verifiedCount}/{totalCount}
        </span>
      </div>
    </div>
  );
};
