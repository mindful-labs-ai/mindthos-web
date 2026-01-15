import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { PopUp } from '@/components/ui/composites/PopUp';
import type { Client } from '@/feature/client/types';
import { FilterIcon } from '@/shared/icons';
import { formatDate } from '@/shared/utils/date';

import { FilterMenu } from './FilterMenu';
import { SessionSideListItem } from './SessionSideListItem';

interface SessionItem {
  sessionId: string;
  title: string;
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
  // 필터 관련 props
  sortOrder: 'newest' | 'oldest';
  selectedClientId: string[];
  clients: Client[];
  sessionCounts: Record<string, number>;
  onSortChange: (order: 'newest' | 'oldest') => void;
  onClientChange: (clientIds: string[]) => void;
  onFilterReset: () => void;
}

export const SessionSideList: React.FC<SessionSideListProps> = ({
  sessions,
  activeSessionId,
  onSessionClick,
  sortOrder,
  selectedClientId,
  clients,
  sessionCounts,
  onSortChange,
  onClientChange,
  onFilterReset,
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

    // 날짜 그룹 정렬 (sortOrder에 따라)
    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        sessions: items,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [sessions, sortOrder]);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-bg">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <Title as="h2" className="text-sm font-medium text-fg">
          상담 기록
        </Title>
        <div className="inline-block">
          <PopUp
            trigger={
              <div className="cursor-pointer rounded-lg p-1 text-fg-muted hover:bg-surface-contrast">
                <FilterIcon size={18} />
              </div>
            }
            content={
              <FilterMenu
                sortOrder={sortOrder}
                selectedClientIds={selectedClientId}
                clients={clients}
                sessionCounts={sessionCounts}
                onSortChange={onSortChange}
                onClientChange={onClientChange}
                onReset={onFilterReset}
              />
            }
            placement="bottom-right"
            className="!p-4"
          />
        </div>
      </div>

      {/* 세션 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {groupedSessions.length > 0 ? (
          <div className="space-y-6">
            {groupedSessions.map((group) => (
              <div key={group.date}>
                {/* 날짜 헤더 */}
                <Text className="mb-2 px-2 text-left text-xs font-medium text-fg-muted">
                  {group.date}
                </Text>

                {/* 세션 아이템들 */}
                <div className="space-y-2">
                  {group.sessions.map((session) => (
                    <SessionSideListItem
                      key={session.sessionId}
                      sessionId={session.sessionId}
                      title={session.title}
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
