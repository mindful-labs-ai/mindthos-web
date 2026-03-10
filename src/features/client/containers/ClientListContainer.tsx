import React from 'react';

import { getClientDetailRoute } from '@/app/router/constants';
import { dummyClient } from '@/features/session/constants/dummySessions';
import { useSessionList } from '@/features/session/hooks/useSessionList';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useAuthStore } from '@/stores/authStore';

import { useClientGrouping } from '../hooks/useClientGrouping';
import { useClientList } from '../hooks/useClientList';
import { useClientSearch } from '../hooks/useClientSearch';
import type { Client } from '../types';

import { ClientListView } from './ClientListView';

export const ClientListContainer: React.FC = () => {
  const { navigateWithUtm } = useNavigateWithUtm();
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

  return (
    <ClientListView
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={isLoading}
      error={error}
      isDummyFlow={isDummyFlow}
      groupedActiveClients={groupedActiveClients}
      groupedCompletedClients={groupedCompletedClients}
      isAddModalOpen={isAddModalOpen}
      selectedClient={selectedClient}
      onAddClient={handleAddClient}
      onEditClient={handleEditClient}
      onClientClick={handleClientClick}
      onModalClose={handleModalClose}
    />
  );
};
