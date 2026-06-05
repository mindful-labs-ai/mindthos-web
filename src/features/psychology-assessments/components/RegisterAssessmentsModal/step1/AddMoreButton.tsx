import { cn } from '@/lib/cn';

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
        'h-[82px] w-full rounded-lg border-2 border-surface-strong text-center text-5xl font-thin text-fg-muted transition-colors lg:hover:bg-surface',
        className
      )}
      aria-label="파일 추가"
    >
      +
    </button>
  );
};
