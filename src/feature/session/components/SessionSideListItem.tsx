import React from 'react';

import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { formatDuration } from '@/shared/utils/date';

interface SessionSideListItemProps {
  sessionId: string;
  title: string;
  clientName: string;
  sessionNumber: number;
  duration?: number;
  hasAudio: boolean;
  isActive?: boolean;
  onClick: (sessionId: string) => void;
}

export const SessionSideListItem: React.FC<SessionSideListItemProps> = ({
  sessionId,
  title,
  clientName,
  sessionNumber,
  duration,
  hasAudio,
  isActive = false,
  onClick,
}) => {
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
          {title}
        </Title>
        <Text className="text-xs text-fg-muted">
          {clientName} · {sessionNumber}회기
        </Text>
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
