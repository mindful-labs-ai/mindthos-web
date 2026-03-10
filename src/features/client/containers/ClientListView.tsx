import React from 'react';

import { SearchIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { AddClientModal } from '@/widgets/client/AddClientModal';
import { ClientCard } from '@/widgets/client/ClientCard';

import type { Client } from '../types';

interface ClientGroup {
  key: string;
  clients: Client[];
}

export interface ClientListViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  error: string | null;
  isDummyFlow: boolean;
  groupedActiveClients: ClientGroup[];
  groupedCompletedClients: ClientGroup[];
  isAddModalOpen: boolean;
  selectedClient: Client | null;
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onClientClick: (client: Client) => void;
  onModalClose: (open: boolean) => void;
}

export const ClientListView: React.FC<ClientListViewProps> = ({
  searchQuery,
  onSearchChange,
  isLoading,
  error,
  isDummyFlow,
  groupedActiveClients,
  groupedCompletedClients,
  isAddModalOpen,
  selectedClient,
  onAddClient,
  onEditClient,
  onClientClick,
  onModalClose,
}) => {
  return (
    <>
      <div className="mx-auto w-full max-w-[1332px] px-16 py-[42px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Title as="h1" className="text-2xl font-bold">
            모든 클라이언트
          </Title>

          <div className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="검색하기"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              prefix={<SearchIcon size={18} />}
              className="w-80"
            />

            <Button
              variant="solid"
              tone="primary"
              size="md"
              onClick={onAddClient}
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
                          onClick={onClientClick}
                          onEditClick={onEditClient}
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
                            onClick={onClientClick}
                            onEditClick={onEditClient}
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
        onOpenChange={onModalClose}
        initialData={selectedClient}
      />
    </>
  );
};
