import { cn } from '@/lib/cn';
import { ResetCycleIcon } from '@/shared/icons';

interface PopoverResetButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const PopoverResetButton = ({
  label = '결과지 초기화',
  onClick,
  disabled,
  className,
}: PopoverResetButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-md border border-grey-40 py-2 text-m font-medium text-grey-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50 lg:hover:bg-grey-10',
        className
      )}
    >
      <ResetCycleIcon size={20} />
      {label}
    </button>
  );
};
