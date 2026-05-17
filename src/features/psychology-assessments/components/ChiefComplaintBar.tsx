import { cn } from '@/lib/cn';

interface ChiefComplaintBarProps {
  complaint: string | null;
  className?: string;
}

export const ChiefComplaintBar = ({
  complaint,
  className,
}: ChiefComplaintBarProps) => {
  return (
    <div className={cn('w-full bg-grey-20', className)}>
      <div className="mx-auto flex w-full max-w-[679px] items-center gap-4 px-6 py-4 text-sm">
        <span className="font-headline text-grey-80">주호소</span>
        <span className="font-medium text-grey-100">
          {complaint?.trim() ? complaint : '주호소 정보 없음'}
        </span>
      </div>
    </div>
  );
};
