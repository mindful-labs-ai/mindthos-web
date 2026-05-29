import { useEffect, useMemo, useRef, useState } from 'react';

import { useClientGrouping } from '@/features/client/hooks/useClientGrouping';
import { useClientsList } from '@/features/client/hooks/useClientsList';
import type { Client } from '@/features/client/types';
import { cn } from '@/lib/cn';
import type { ClientsPageItem } from '@/shared/api/supabase/clientQueries';
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll';
import { ClientSidebarAddIcon, ClientSidebarToggleIcon } from '@/shared/icons';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';

import { ClientAvatar } from './ClientAvatar';

const SIDEBAR_WIDTH = 203;
const COLLAPSED_WIDTH = 72;

interface ClientSidebarProps {
  selectedClientId: string | null;
  onSelectClient: (client: Client) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const toClient = (item: ClientsPageItem, counselorId: string): Client => ({
  id: item.id,
  counselor_id: counselorId,
  name: item.name,
  phone_number: item.phone_number || '',
  email: item.email,
  counsel_theme: item.counsel_theme,
  counsel_number: Number(item.counsel_number) || 0,
  counsel_done: item.counsel_done ?? false,
  memo: item.memo,
  pin: item.pin ?? false,
  created_at: item.created_at,
  updated_at: item.created_at,
  session_count: item.session_count,
});

export const ClientSidebar = ({
  selectedClientId,
  onSelectClient,
  collapsed,
  onToggleCollapsed,
}: ClientSidebarProps) => {
  const userId = useAuthStore((state) => state.userId);
  const openModal = useModalStore((state) => state.openModal);

  const {
    items,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useClientsList({
    counselorId: parseInt(userId || '0'),
    sortOrder: 'asc',
    enabled: !!userId,
  });

  const clients = useMemo<Client[]>(
    () => items.map((item) => toClient(item, userId || '')),
    [items, userId]
  );

  const groups = useClientGrouping(clients);

  // 스크롤 컨테이너 root 바인딩 — ref.current는 첫 렌더에 null이므로 mount 후 state로 등록해
  // useInfiniteScroll이 IntersectionObserver를 재바인딩하도록 한다.
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollRoot, setScrollRoot] = useState<Element | null>(null);
  useEffect(() => {
    setScrollRoot(scrollContainerRef.current);
  }, []);

  const sentinelRef = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
    root: scrollRoot,
  });

  const handleAddClient = () => {
    openModal('addClient');
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-surface transition-all duration-normal'
      )}
      style={{ width: collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-4 pb-3 pt-5',
          collapsed && 'justify-center px-1'
        )}
      >
        {!collapsed && (
          <span className="text-m font-emphasize text-grey-100">
            클라이언트
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleAddClient}
            className="flex h-7 w-7 items-center justify-center rounded-md text-grey-70 transition-colors lg:hover:bg-nav-hover-bg lg:hover:text-grey-100"
            aria-label="클라이언트 추가"
          >
            <ClientSidebarAddIcon size={20} />
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex h-7 w-7 items-center justify-center rounded-md text-grey-70 transition-colors lg:hover:bg-nav-hover-bg lg:hover:text-grey-100"
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            <ClientSidebarToggleIcon size={20} />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className={cn('flex-1 overflow-y-auto pb-4', collapsed ? 'px-1' : 'px-2')}
      >
        {isError ? (
          !collapsed && (
            <p className="px-2 py-4 text-xs text-danger">
              내담자 목록을 불러오지 못했어요
            </p>
          )
        ) : isLoading ? (
          !collapsed && (
            <p className="px-2 py-4 text-xs text-grey-60">불러오는 중…</p>
          )
        ) : groups.length === 0 ? (
          !collapsed && (
            <p className="px-2 py-4 text-xs text-grey-60">
              등록된 내담자가 없어요
            </p>
          )
        ) : (
          <>
            {groups.map((group) => (
              <div key={group.key} className="mb-2">
                <div
                  className={cn(
                    'pb-1 pt-3 text-xs text-grey-60',
                    collapsed ? 'text-center' : 'px-2'
                  )}
                >
                  {group.key}
                </div>
                <ul
                  className={cn(
                    'flex flex-col gap-0.5',
                    collapsed && 'items-center gap-1'
                  )}
                >
                  {group.clients.map((client) => {
                    const isActive = client.id === selectedClientId;
                    return (
                      <li key={client.id}>
                        <button
                          type="button"
                          onClick={() => onSelectClient(client)}
                          aria-label={collapsed ? client.name : undefined}
                          className={cn(
                            'flex items-center transition-colors',
                            collapsed
                              ? 'justify-center rounded-xl p-1.5'
                              : 'w-full gap-2.5 rounded-lg px-2 py-2 text-left',
                            isActive ? 'bg-grey-20' : 'lg:hover:bg-nav-hover-bg'
                          )}
                        >
                          <ClientAvatar
                            paletteKey={client.id}
                            name={client.name}
                            size={40}
                          />
                          {!collapsed && (
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-emphasize text-grey-100">
                                {client.name}
                              </span>
                              <span className="truncate text-xs text-grey-60">
                                총 {client.session_count ?? 0}개 상담기록
                              </span>
                            </div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <div ref={sentinelRef} />
            {isFetchingNextPage && (
              <p className="px-2 py-2 text-center text-xs text-grey-60">
                불러오는 중…
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
