import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

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
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        // 모바일은 전체 폭 사용 + 줄바꿈 허용
        isMobileView && 'w-full',
        className
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'rounded-md border border-grey-30 px-3 py-2 text-m text-grey-70 transition-colors lg:hover:bg-grey-10',
          isMobileView
            ? 'flex-1 whitespace-normal text-left'
            : 'whitespace-nowrap'
        )}
      >
        {label}
      </button>
      {recommended && (
        <span className="flex-shrink-0 rounded-md bg-green-20 px-2 py-1 text-xs font-emphasize text-primary">
          추천
        </span>
      )}
    </div>
  );
};
