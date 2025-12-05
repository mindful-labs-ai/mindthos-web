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
  onClick: (sessionId: string) => void;
}

export const SessionSideListItem: React.FC<SessionSideListItemProps> = ({
  sessionId,
  title,
  duration,
  hasAudio,
  isActive = false,
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
        <Title as="h4" className="text-sm font-semibold text-fg">
          {title}
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
