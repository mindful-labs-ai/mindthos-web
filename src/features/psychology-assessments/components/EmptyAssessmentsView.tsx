import { cn } from '@/lib/cn';

interface EmptyAssessmentsViewProps {
  onRegister?: () => void;
  className?: string;
}

export const EmptyAssessmentsView = ({
  onRegister,
  className,
}: EmptyAssessmentsViewProps) => {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-6',
        className
      )}
    >
      <p className="text-lg font-emphasize text-grey-100">
        아직 등록된 심리검사 결과지가 없습니다.
      </p>
      <button
        type="button"
        onClick={onRegister}
        className="rounded-md border border-grey-80 px-[21px] py-1.5 text-m font-medium text-grey-80 transition-colors lg:hover:bg-grey-10"
      >
        심리검사 결과지 등록하기
      </button>
    </div>
  );
};
