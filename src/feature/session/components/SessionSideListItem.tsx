import React from 'react';

import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { formatDuration } from '@/shared/utils/date';

interface SessionSideListItemProps {
  sessionId: string;
  title: string;
  duration?: number;
  hasAudio: boolean;
  isActive?: boolean;
  /** 고급 축어록 여부 (stt_model === 'gemini-3') */
  isAdvancedTranscript?: boolean;
  onClick: (sessionId: string) => void;
}

export const SessionSideListItem: React.FC<SessionSideListItemProps> = ({
  sessionId,
  title,
  duration,
  hasAudio,
  isActive = false,
  isAdvancedTranscript = false,
  onClick,
}) => {
  return (
    <button
      onClick={() => onClick(sessionId)}
      className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
        isActive
          ? 'bg-surface-contrast hover:bg-surface-strong'
          : 'hover:bg-surface-contrast'
      }`}
    >
      <div className="">
        <Title
          as="h4"
          className="flex items-center justify-between text-sm font-semibold text-fg"
        >
          {title}
          {isAdvancedTranscript && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 5.25C13.9244 5.67356 13.7561 6.07515 13.5071 6.426L8.38367 13.321C8.22123 13.5309 8.0132 13.701 7.77531 13.8186C7.53742 13.9362 7.2759 13.9982 7.01053 13.9998C6.74517 14.0014 6.4829 13.9427 6.24359 13.828C6.00427 13.7134 5.79416 13.5458 5.62917 13.3379L0.480667 6.3C0.261963 5.9831 0.107574 5.62636 0.02625 5.25H3.68258L6.45517 12.4594C6.49736 12.5697 6.57203 12.6646 6.66931 12.7316C6.7666 12.7985 6.88191 12.8343 7 12.8343C7.11809 12.8343 7.2334 12.7985 7.33069 12.7316C7.42797 12.6646 7.50264 12.5697 7.54483 12.4594L10.3174 5.25H14ZM10.325 4.08333H13.9749C13.8862 3.68866 13.7159 3.3169 13.475 2.99192L11.9828 0.977084C11.7667 0.675067 11.4818 0.428897 11.1516 0.258976C10.8214 0.0890556 10.4554 0.000278038 10.0841 1.12792e-06H8.80075L10.325 4.08333ZM6.47967 1.12792e-06L4.92858 4.08333H9.07725L7.55708 1.12792e-06H6.47967ZM3.68083 4.08333L5.23133 1.12792e-06H3.87683C3.50862 -0.000361335 3.14558 0.0866408 2.81753 0.25386C2.48948 0.421079 2.20579 0.663744 1.98975 0.961918L0.547167 2.85308C0.271136 3.21477 0.0837343 3.63612 0 4.08333H3.68083ZM9.06733 5.25H4.93267L7 10.6248L9.06733 5.25Z"
                fill="#44CE4B"
              />
            </svg>
          )}
        </Title>
        <div className="flex items-center justify-between gap-2">
          <Text className="text-xs text-fg-muted">
            {duration ? formatDuration(duration) : '시간 정보 없음'}
          </Text>
          {hasAudio && (
            <Badge tone="neutral" variant="soft" size="sm">
              녹음 파일
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
};
