import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { FilterIcon } from '@/shared/icons';
import { formatDate } from '@/shared/utils/date';

import { SessionSideListItem } from './SessionSideListItem';

interface SessionItem {
  sessionId: string;
  clientName: string;
  sessionNumber: number;
  duration?: number;
  hasAudio: boolean;
  createdAt: string;
}

interface SessionSideListProps {
  sessions: SessionItem[];
  activeSessionId?: string;
  onSessionClick: (sessionId: string) => void;
}

export const SessionSideList: React.FC<SessionSideListProps> = ({
  sessions,
  activeSessionId,
  onSessionClick,
}) => {
  // 날짜별로 그룹화
  const groupedSessions = React.useMemo(() => {
    const groups: Record<string, SessionItem[]> = {};

    sessions.forEach((session) => {
      const dateKey = formatDate(session.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
    });

    // 날짜 내림차순 정렬
    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        sessions: items,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-bg">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Title as="h2" className="text-base font-bold text-fg">
          상담 기록
        </Title>
        <button
          type="button"
          className="rounded-lg p-1 text-fg-muted hover:bg-surface-contrast"
          aria-label="필터"
        >
          <FilterIcon fill="currentColor" size={18} />
        </button>
      </div>

      {/* 세션 리스트 */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {groupedSessions.length > 0 ? (
          <div className="space-y-6">
            {groupedSessions.map((group) => (
              <div key={group.date}>
                {/* 날짜 헤더 */}
                <Text className="mb-2 px-2 text-left text-xs font-medium text-fg-muted">
                  {group.date}
                </Text>

                {/* 세션 아이템들 */}
                <div className="space-y-1">
                  {group.sessions.map((session) => (
                    <SessionSideListItem
                      key={session.sessionId}
                      sessionId={session.sessionId}
                      clientName={session.clientName}
                      sessionNumber={session.sessionNumber}
                      duration={session.duration}
                      hasAudio={session.hasAudio}
                      isActive={session.sessionId === activeSessionId}
                      onClick={onSessionClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center">
            <Text className="text-sm text-fg-muted">상담 기록이 없습니다.</Text>
          </div>
        )}
      </div>
    </aside>
  );
};
