import React from 'react';

import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { formatDuration } from '@/shared/utils/date';

interface SessionSideListItemProps {
  sessionId: string;
  clientName: string;
  sessionNumber: number;
  duration?: number;
  hasAudio: boolean;
  isActive?: boolean;
  onClick: (sessionId: string) => void;
}

export const SessionSideListItem: React.FC<SessionSideListItemProps> = ({
  sessionId,
  clientName,
  sessionNumber,
  duration,
  hasAudio,
  isActive = false,
  onClick,
}) => {
  const displayTitle =
    clientName === '고객 없음'
      ? `세션 ${sessionNumber}회기`
      : `${clientName} ${sessionNumber}회기`;

  return (
    <button
      onClick={() => onClick(sessionId)}
      className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${
        isActive
          ? 'bg-primary/10 border-l-2 border-primary'
          : 'hover:bg-surface-contrast'
      }`}
    >
      <div className="space-y-1">
        <Title as="h4" className="text-sm font-semibold text-fg">
          {displayTitle}
        </Title>
        <div className="flex items-center justify-between gap-2">
          <Text className="text-xs text-fg-muted">
            {duration ? formatDuration(duration) : '시간 정보 없음'}
          </Text>
          {hasAudio && (
            <Badge tone="neutral" variant="soft" size="sm">
              음성 파일
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
};
