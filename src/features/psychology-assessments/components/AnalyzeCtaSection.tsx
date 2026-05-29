import { cn } from '@/lib/cn';
import { CreditIcon } from '@/shared/icons';

interface AnalyzeCtaSectionProps {
  helperText?: string;
  creditCost: number;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const AnalyzeCtaSection = ({
  helperText = '심리검사 결과지가 등록되었습니다.\n이어서 분석을 진행해주세요.',
  creditCost,
  disabled,
  onClick,
  className,
}: AnalyzeCtaSectionProps) => {
  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      <p className="whitespace-pre-line text-center text-m font-medium text-grey-70">
        {helperText}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-md border border-green-80 bg-green-20 px-3.5 py-1.5 text-m font-medium text-green-80 transition-opacity disabled:opacity-50 lg:hover:opacity-75"
      >
        <span>결과지 분석하기</span>
        <span className="inline-flex items-center gap-0.5">
          <span>{creditCost}</span>
          <CreditIcon size={14} color="currentColor" />
        </span>
      </button>
    </div>
  );
};
