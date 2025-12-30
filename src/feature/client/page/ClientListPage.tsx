import React from 'react';

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { dummyClient } from '@/feature/session/constants/dummySessions';
import { useSessionList } from '@/feature/session/hooks/useSessionList';
import { getClientDetailRoute } from '@/router/constants';
import { SearchIcon } from '@/shared/icons';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

import { AddClientModal } from '../components/AddClientModal';
import { ClientCard } from '../components/ClientCard';
import { useClientGrouping } from '../hooks/useClientGrouping';
import { useClientList } from '../hooks/useClientList';
import { useClientSearch } from '../hooks/useClientSearch';
import type { Client } from '../types';

export const ClientListPage: React.FC = () => {
  const navigate = useNavigate();
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

  // 더미 데이터는 세션과 클라이언트가 모두 비어있을 때 표시하거나, 튜토리얼이 활성 상태일 때 표시
  const isTutorialActive = useQuestStore((state) => state.isTutorialActive);
  const hasAnyRealData = sessionsFromQuery.length > 0 || clients.length > 0;
  const isDummyFlow =
    ((!isLoading && !isLoadingSessions && !error) || isTutorialActive) &&
    (!hasAnyRealData || isTutorialActive);
  const effectiveClients = isDummyFlow ? [dummyClient] : clients;

  const filteredClients = useClientSearch(effectiveClients, searchQuery);

  // counsel_done으로 활성/종결 클라이언트 분리
  const activeClients = filteredClients.filter((c) => !c.counsel_done);
  const completedClients = filteredClients.filter((c) => c.counsel_done);

  const groupedActiveClients = useClientGrouping(activeClients);
  const groupedCompletedClients = useClientGrouping(completedClients);

  const handleClientClick = (client: Client) => {
    navigate(getClientDetailRoute(client.id));
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
    <>
      <div className="mx-auto w-full px-16 py-[42px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Title as="h1" className="text-2xl font-bold">
            모든 클라이언트
          </Title>

          <div className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="검색하기"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchIcon size={18} />}
              className="w-80"
            />

            <Button
              variant="solid"
              tone="primary"
              size="md"
              onClick={handleAddClient}
            >
              클라이언트 추가하기
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-[var(--radius-md)] bg-danger px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Text className="text-lg text-fg-muted">로딩 중...</Text>
          </div>
        ) : groupedActiveClients.length > 0 ||
          groupedCompletedClients.length > 0 ? (
          <div className="space-y-12">
            {/* 활성 클라이언트 섹션 */}
            {groupedActiveClients.length > 0 && (
              <div className="space-y-8">
                {groupedActiveClients.map((group) => (
                  <div key={group.key}>
                    <div className="mb-4 border-b border-border pb-2 text-left">
                      <Title
                        as="h2"
                        className="text-xl font-bold text-fg-muted"
                      >
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
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 종결된 내담자 섹션 */}
            {groupedCompletedClients.length > 0 && (
              <div>
                <div className="mb-6 text-left">
                  <Title as="h2" className="text-xl font-bold text-fg-muted">
                    종결된 내담자
                  </Title>
                </div>

                <div className="space-y-8">
                  {groupedCompletedClients.map((group) => (
                    <div key={group.key}>
                      <div className="mb-4 border-b border-border pb-2 text-left">
                        <Title
                          as="h3"
                          className="text-lg font-bold text-fg-muted"
                        >
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
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center">
            <Text className="text-lg text-fg-muted">검색 결과 없음</Text>
          </div>
        )}
      </div>

      <AddClientModal
        open={isAddModalOpen}
        onOpenChange={handleModalClose}
        initialData={selectedClient}
      />
    </>
  );
};
