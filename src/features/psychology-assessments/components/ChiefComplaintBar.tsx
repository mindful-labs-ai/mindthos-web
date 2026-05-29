import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

interface ChiefComplaintBarProps {
  complaint: string | null;
  className?: string;
}

export const ChiefComplaintBar = ({
  complaint,
  className,
}: ChiefComplaintBarProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  return (
    <div className={cn('w-full bg-grey-20', className)}>
      <div
        className={cn(
          'flex w-full items-center gap-4 py-3 text-sm',
          isMobileView ? 'px-4' : 'mx-auto max-w-[679px] px-6'
        )}
      >
        <span className="font-headline text-grey-80">주호소</span>
        <span className="font-medium text-grey-100">
          {complaint?.trim() ? complaint : '주호소 정보 없음'}
        </span>
      </div>
    </div>
  );
};
