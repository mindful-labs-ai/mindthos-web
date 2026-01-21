import React from 'react';

import type { Client } from '@/feature/client/types';
import { trackEvent } from '@/lib/mixpanel';

import { ClientFilterMenu } from './ClientFilterMenu';
import { SortMenu } from './SortMenu';

interface FilterMenuProps {
  sortOrder: 'newest' | 'oldest';
  selectedClientIds: string[];
  clients: Client[];
  sessionCounts: Record<string, number>;
  onSortChange: (order: 'newest' | 'oldest') => void;
  onClientChange: (clientIds: string[]) => void;
  onReset: () => void;
  initialView?: 'main' | 'sort' | 'client'; // 초기 뷰 설정
}

type MenuView = 'main' | 'sort' | 'client';

export const FilterMenu: React.FC<FilterMenuProps> = ({
  sortOrder,
  selectedClientIds,
  clients,
  sessionCounts,
  onSortChange,
  onClientChange,
  onReset,
  initialView = 'main',
}) => {
  const [currentView, setCurrentView] = React.useState<MenuView>(initialView);

  const sortLabel = sortOrder === 'newest' ? '최신순' : '오래된순';

  // 선택된 고객 레이블 생성
  let clientLabel = '모든 클라이언트';
  if (selectedClientIds.length === 0) {
    clientLabel = '모든 클라이언트';
  } else if (selectedClientIds.length === 1) {
    const client = clients?.find((c) => c.id === selectedClientIds[0]);
    clientLabel = client ? client.name : '모든 클라이언트';
  } else {
    clientLabel = `${selectedClientIds.length}명 선택`;
  }

  // initialView가 'main'이 아닌 경우 뒤로가기 버튼을 숨김
  const showBackButton = initialView === 'main';

  // 서브메뉴로 이동
  if (currentView === 'sort') {
    return (
      <SortMenu
        sortOrder={sortOrder}
        onSortChange={(order) => {
          trackEvent('session_sort_change', { order });
          onSortChange(order);
        }}
        onBack={() => setCurrentView('main')}
        showBackButton={showBackButton}
      />
    );
  }

  if (currentView === 'client') {
    return (
      <ClientFilterMenu
        selectedClientIds={selectedClientIds}
        clients={clients}
        sessionCounts={sessionCounts}
        onClientChange={(clientIds) => {
          trackEvent('session_filter_client', {
            selected_count: clientIds.length,
          });
          onClientChange(clientIds);
        }}
        onBack={() => setCurrentView('main')}
        showBackButton={showBackButton}
      />
    );
  }

  // 메인 메뉴
  return (
    <div className="flex w-full flex-col gap-2">
      {/* 정렬 버튼 */}
      <button
        type="button"
        onClick={() => setCurrentView('sort')}
        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left hover:bg-surface-contrast"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-fg-muted">정렬</span>
          <span className="text-sm font-medium text-fg">{sortLabel}</span>
        </div>
        <svg
          className="h-4 w-4 text-fg-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* 고객 필터 버튼 */}
      <button
        type="button"
        onClick={() => setCurrentView('client')}
        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left hover:bg-surface-contrast"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-fg-muted">클라이언트</span>
          <span className="text-sm font-medium text-fg">{clientLabel}</span>
        </div>
        <svg
          className="h-4 w-4 text-fg-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 초기화 버튼 */}
      <button
        type="button"
        onClick={() => {
          trackEvent('session_filter_reset');
          onReset();
        }}
        className="w-full rounded-lg px-4 py-2 text-sm font-medium text-fg hover:bg-surface-contrast"
      >
        초기화
      </button>
    </div>
  );
};
