import { cn } from '@/lib/cn';
import { CheckIcon } from '@/shared/icons';

interface Step3CompleteViewProps {
  className?: string;
}

export const Step3CompleteView = ({ className }: Step3CompleteViewProps) => {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center gap-6 py-16',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-20 text-green-80">
        <CheckIcon size={28} strokeWidth={2.5} />
      </div>

      <div className="flex flex-col items-center text-center">
        <p className="text-l font-emphasize text-grey-100">
          심리검사 결과지가 등록되었습니다.
        </p>
        <p className="text-l font-emphasize text-grey-100">
          이어서 결과지 분석을 진행해주세요.
        </p>
      </div>
    </div>
  );
};
