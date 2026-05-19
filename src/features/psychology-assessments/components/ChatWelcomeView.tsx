import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

import { ChatSuggestionChip } from './ChatSuggestionChip';

export interface ChatSuggestion {
  id: string;
  label: string;
  recommended?: boolean;
}

interface ChatWelcomeViewProps {
  greeting?: string;
  suggestions: ChatSuggestion[];
  onSuggestionClick?: (id: string) => void;
  className?: string;
}

export const ChatWelcomeView = ({
  greeting = '안녕하세요, 마음토스 심리검사 해석 에이전트입니다. 무엇을 도와드릴까요?',
  suggestions,
  onSuggestionClick,
  className,
}: ChatWelcomeViewProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col',
        isMobileView ? 'gap-4' : 'gap-6',
        className
      )}
    >
      <p
        className={cn(
          'font-medium text-grey-100',
          isMobileView ? 'text-sm leading-relaxed' : 'text-m'
        )}
      >
        {greeting}
      </p>

      <div
        className={cn(
          'flex flex-col gap-2',
          isMobileView ? 'items-stretch' : 'items-start'
        )}
      >
        {suggestions.map((sg) => (
          <ChatSuggestionChip
            key={sg.id}
            label={sg.label}
            recommended={sg.recommended}
            onClick={() => onSuggestionClick?.(sg.id)}
          />
        ))}
      </div>

      <div>
        <img
          src="/tutorial/mindthos_agent_icon.png"
          alt="마음토스"
          className={cn(isMobileView ? 'h-9 w-auto' : 'h-12 w-auto')}
          draggable={false}
        />
      </div>
    </div>
  );
};
