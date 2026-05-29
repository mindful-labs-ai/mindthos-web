import { cn } from '@/lib/cn';
import { PlusIcon } from '@/shared/icons';

interface AddAssessmentButtonProps {
  onClick?: () => void;
  className?: string;
}

export const AddAssessmentButton = ({
  onClick,
  className,
}: AddAssessmentButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-center rounded-lg border border-grey-40 py-5 text-grey-60 transition-colors lg:hover:bg-grey-10',
        className
      )}
      aria-label="결과지 추가"
    >
      <PlusIcon size={20} />
    </button>
  );
};
