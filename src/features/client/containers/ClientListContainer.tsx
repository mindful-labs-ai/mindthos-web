import React from 'react';

import { getClientDetailRoute } from '@/app/router/constants';
import { dummyClient } from '@/features/session/constants/dummySessions';
import { useSessionList } from '@/features/session/hooks/useSessionList';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Title } from '@/shared/ui/atoms/Title';
import { useAuthStore } from '@/stores/authStore';
import { AddClientModal } from '@/widgets/client/AddClientModal';
import { ClientCard } from '@/widgets/client/ClientCard';

import { useClientGrouping } from '../hooks/useClientGrouping';
import { useClientList } from '../hooks/useClientList';
import { useClientSearch } from '../hooks/useClientSearch';
import type { Client } from '../types';

import { ClientListView } from './ClientListView';

export const ClientListContainer: React.FC = () => {
  const { navigateWithUtm } = useNavigateWithUtm();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const [searchQuery, setSearchQuery] = React.useState('');
  const { clients, isLoading, error } = useClientList();
  const userId = useAuthStore((state) => state.userId);
  const { data: sessionData, isLoading: isLoadingSessions } = useSessionList({
    userId: parseInt(userId || '0'),
    enabled: !!userId,
  });
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const sessionsFromQuery = sessionData?.sessions || [];

  const hasAnyRealData = sessionsFromQuery.length > 0 || clients.length > 0;
  const isDummyFlow =
    !isLoading && !isLoadingSessions && !error && !hasAnyRealData;
  const effectiveClients = isDummyFlow ? [dummyClient] : clients;

  const filteredClients = useClientSearch(effectiveClients, searchQuery);

  const activeClients = filteredClients.filter((c) => !c.counsel_done);
  const completedClients = filteredClients.filter((c) => c.counsel_done);

  const groupedActiveClients = useClientGrouping(activeClients);
  const groupedCompletedClients = useClientGrouping(completedClients);

  const handleClientClick = (client: Client) => {
    navigateWithUtm(getClientDetailRoute(client.id));
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
            isReadOnly={isDummyFlow}
            searchQuery={searchQuery}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );

  const clientList = (() => {
    if (error) {
      return (
        <div className="typo-sm mb-4 rounded-md bg-danger px-4 py-3 text-danger">
          {error}
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
