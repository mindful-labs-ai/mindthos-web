import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

interface ChiefComplaintBarProps {
  keywords: string[];
  className?: string;
}

export const ChiefComplaintBar = ({
  keywords,
  className,
}: ChiefComplaintBarProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const visibleKeywords = keywords
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (visibleKeywords.length === 0) {
    return (
      <div
        className={cn('w-full border-t border-grey-40', className)}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn('w-full border-y border-grey-40 bg-grey-20', className)}>
      <div
        className={cn(
          'flex w-full items-center gap-4 py-3 text-sm',
          isMobileView ? 'px-4' : 'mx-auto max-w-[679px] px-6'
        )}
      >
        <span className="shrink-0 font-headline text-grey-80">상담 키워드</span>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          {visibleKeywords.map((keyword) => (
            <span
              key={keyword}
              className="whitespace-nowrap font-headline text-grey-100"
            >
              {keyword.startsWith('#') ? keyword : `#${keyword}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
