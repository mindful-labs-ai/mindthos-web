import { cn } from '@/lib/cn';

interface ChatSuggestionChipProps {
  label: string;
  recommended?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ChatSuggestionChip = ({
  label,
  recommended,
  onClick,
  className,
}: ChatSuggestionChipProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={onClick}
        className="rounded-md border border-grey-30 px-3 py-2 text-m text-grey-70 transition-colors lg:hover:bg-grey-10"
      >
        {label}
      </button>
      {recommended && (
        <span className="rounded-md bg-green-20 px-2 py-1 text-xs font-emphasize text-primary">
          추천
        </span>
      )}
    </div>
  );
};
