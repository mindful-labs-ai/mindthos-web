import React from 'react';

import type { Client } from '@/features/client/types';
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll';
import { FilterIcon } from '@/shared/icons';
import { Text } from '@/shared/ui/atoms/Text';
import { PopUp } from '@/shared/ui/composites/PopUp';
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
  /** 고급 축어록 여부 (stt_model === 'gemini-3') */
  isAdvancedTranscript?: boolean;
  /** 직접 입력 세션 여부 (audio_meta_data === null) */
  isHandwritten?: boolean;
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
  // 무한 스크롤 (선택적)
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => unknown;
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
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
}) => {
  // 사이드 패널 자체 스크롤 컨테이너에 IntersectionObserver root 바인딩
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollRoot, setScrollRoot] = React.useState<Element | null>(null);

  // 컨테이너 mount 후 root 등록 (state 업데이트로 useInfiniteScroll re-bind)
  React.useEffect(() => {
    setScrollRoot(scrollContainerRef.current);
  }, []);

  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: fetchNextPage ?? (() => undefined),
    disabled: !fetchNextPage,
    root: scrollRoot,
  });
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
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-bg">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-m font-emphasize text-grey-80">상담 기록</h2>
        <div className="inline-block">
          <PopUp
            trigger={
              <div className="cursor-pointer rounded-lg p-1 text-fg-muted lg:hover:bg-surface-contrast">
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
            className="p-4"
          />
        </div>
      </div>

      {/* 세션 리스트 — 사이드 패널 자체 스크롤 컨테이너. 하단에 sentinel 배치 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-2">
        {groupedSessions.length > 0 ? (
          <div className="space-y-6">
            {groupedSessions.map((group) => (
              <div key={group.date}>
                {/* 날짜 헤더 */}
                <Text className="typo-xs mb-2 px-2 text-left font-medium text-fg-muted">
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
                      isAdvancedTranscript={session.isAdvancedTranscript}
                      isHandwritten={session.isHandwritten}
                      onClick={onSessionClick}
                    />
                  ))}
                </div>
              </div>
            ))}
            {/* 무한 스크롤 sentinel — 컨테이너 root 기준으로 보이면 fetchNextPage 발동 */}
            <div ref={sentinelRef} className="h-px" />
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center">
            <Text className="typo-sm text-fg-muted">상담 기록이 없어요.</Text>
          </div>
        )}
      </div>
    </aside>
  );
};
