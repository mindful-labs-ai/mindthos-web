import { cn } from '@/lib/cn';
import { PlusIcon } from '@/shared/icons';

interface AddMoreButtonProps {
  onClick?: () => void;
  className?: string;
}

export const AddMoreButton = ({ onClick, className }: AddMoreButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-center rounded-xl border border-grey-60 bg-transparent py-6 text-grey-60 transition-colors lg:hover:border-grey-40 lg:hover:bg-grey-10',
        className
      )}
      aria-label="파일 추가"
    >
      <PlusIcon size={24} />
    </button>
  );
};
