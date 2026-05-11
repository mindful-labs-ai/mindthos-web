import React from 'react';

import { getClientDetailRoute } from '@/app/router/constants';
import { useClientsList } from '@/features/client/hooks/useClientsList';
import { dummyClient } from '@/features/session/constants/dummySessions';
import type { ClientsPageItem } from '@/shared/api/supabase/clientQueries';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useDevice } from '@/shared/hooks/useDevice';
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Title } from '@/shared/ui/atoms/Title';
import { useAuthStore } from '@/stores/authStore';
import { useClientListScrollStore } from '@/stores/clientListScrollStore';
import { AddClientModal } from '@/widgets/client/AddClientModal';
import { ClientCard } from '@/widgets/client/ClientCard';

import { useClientGrouping } from '../hooks/useClientGrouping';
import { useClientSearch } from '../hooks/useClientSearch';
import type { Client } from '../types';

import { ClientListView } from './ClientListView';

export const ClientListContainer: React.FC = () => {
  const { navigateWithUtm } = useNavigateWithUtm();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const [searchQuery, setSearchQuery] = React.useState('');
  // 서버 검색은 디바운스 — 매 keystroke마다 RPC 호출 방지
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const userId = useAuthStore((state) => state.userId);

  const {
    items: clientPageItems,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useClientsList({
    counselorId: parseInt(userId || '0'),
    search: debouncedSearch || null,
    sortOrder: 'desc',
    enabled: !!userId,
  });

  const sentinelRef = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );

  // 스크롤 대상 ID는 데스크탑/모바일 양쪽에서 동일한 전역 스토어로 일원화.
  // - 데스크탑: 페이지 내부 AddClientModal 의 onClientCreated → requestScrollToClient
  // - 모바일/태블릿: MobileHeader "+" → 글로벌 AddClientModal → requestScrollToClient
  const pendingScrollClientId = useClientListScrollStore(
    (state) => state.pendingClientId
  );
  const clearPendingScroll = useClientListScrollStore(
    (state) => state.clearPendingScroll
  );

  const isDummyFlow = !isLoading && !isError && clientPageItems.length === 0;

  // ClientsPageItem → Client 변환 (session_count는 RPC가 직접 반환)
  const toClient = (item: ClientsPageItem): Client => ({
    id: item.id,
    counselor_id: userId || '',
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

  const realClients: Client[] = clientPageItems.map(toClient);
  const effectiveClients = isDummyFlow ? [dummyClient] : realClients;

  const filteredClients = useClientSearch(effectiveClients, searchQuery);

  const activeClients = filteredClients.filter((c) => !c.counsel_done);
  const completedClients = filteredClients.filter((c) => c.counsel_done);

  const groupedActiveClients = useClientGrouping(activeClients);
  const groupedCompletedClients = useClientGrouping(completedClients);

  const handleClientClick = (client: Client) => {
    navigateWithUtm(getClientDetailRoute(client.id));
  };

  const handleAnalyzeClick = (client: Client) => {
    navigateWithUtm(`${getClientDetailRoute(client.id)}?tab=analyze`);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsAddModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsAddModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsAddModalOpen(open);
    if (!open) {
      setSelectedClient(null);
    }
  };

  const handleClientCreated = (clientId: string) => {
    useClientListScrollStore.getState().requestScrollToClient(clientId);
  };

  // 생성된 내담자 카드가 DOM에 들어오면 해당 위치로 스크롤.
  // 스토어의 pendingScrollClientId 가 set 되면, clientPageItems(쿼리 결과) 갱신마다 재시도.
  React.useEffect(() => {
    if (!pendingScrollClientId) return;
    const el = document.querySelector<HTMLElement>(
      `[data-client-id="${pendingScrollClientId}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearPendingScroll();
    }
  }, [pendingScrollClientId, clientPageItems, clearPendingScroll]);

  // 안전망: 일정 시간 내 카드가 끝내 나타나지 않으면 스토어 해제
  React.useEffect(() => {
    if (!pendingScrollClientId) return;
    const timeout = window.setTimeout(() => {
      clearPendingScroll();
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [pendingScrollClientId, clearPendingScroll]);

  const renderClientGroup = (
    group: { key: string; clients: Client[] },
    titleAs: 'h2' | 'h3',
    titleClassName: string
  ) => (
    <div key={group.key}>
      <div className="mb-4 border-b border-border pb-2 text-left">
        <Title as={titleAs} className={titleClassName}>
          {group.key}
        </Title>
      </div>

      <div className="space-y-3">
        {group.clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onClick={handleClientClick}
            onEditClick={handleEditClient}
            onAnalyzeClick={handleAnalyzeClick}
            isReadOnly={isDummyFlow}
            searchQuery={searchQuery}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );

  const clientList = (() => {
    if (isError) {
      return (
        <div className="typo-sm mb-4 rounded-md px-4 py-3 text-center text-danger">
          내담자 목록을 불러오지 못했어요.
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-l font-emphasize text-grey-60">로딩 중...</p>
        </div>
      );
    }

    if (groupedActiveClients.length > 0 || groupedCompletedClients.length > 0) {
      return (
        <div className="space-y-12">
          {groupedActiveClients.length > 0 && (
            <div className="space-y-8">
              {groupedActiveClients.map((group) =>
                renderClientGroup(
                  group,
                  'h2',
                  'typo-xl font-headline text-fg-muted'
                )
              )}
            </div>
          )}

          {groupedCompletedClients.length > 0 && (
            <div>
              <div className="mb-6 text-left">
                <Title as="h2" className="typo-xl font-headline text-fg-muted">
                  종결된 내담자
                </Title>
              </div>

              <div className="space-y-8">
                {groupedCompletedClients.map((group) =>
                  renderClientGroup(
                    group,
                    'h3',
                    'typo-l font-headline text-fg-muted'
                  )
                )}
              </div>
            </div>
          )}
          <div ref={sentinelRef} />
        </div>
      );
    }

    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-l font-medium text-grey-60">검색 결과 없음</p>
      </div>
    );
  })();

  const addClientModal = (
    <AddClientModal
      open={isAddModalOpen}
      onOpenChange={handleModalClose}
      initialData={selectedClient}
      onClientCreated={handleClientCreated}
    />
  );

  return (
    <ClientListView
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onAddClient={handleAddClient}
      clientList={clientList}
      addClientModal={addClientModal}
      isMobileView={isMobileView}
    />
  );
};
