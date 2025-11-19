import React from 'react';

import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { getClientDetailRoute } from '@/router/constants';

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
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );

  const filteredClients = useClientSearch(clients, searchQuery);
  const groupedClients = useClientGrouping(filteredClients);

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
      <div className="mx-auto w-full max-w-7xl px-12 py-6 lg:px-16 lg:py-10">
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
              prefix={<Search size={18} />}
              className="w-80"
            />

            <Button
              variant="solid"
              tone="primary"
              size="md"
              onClick={handleAddClient}
            >
              고객 추가하기
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 mb-4 rounded-[var(--radius-md)] px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Text className="text-lg text-fg-muted">로딩 중...</Text>
          </div>
        ) : groupedClients.length > 0 ? (
          <div className="space-y-8">
            {groupedClients.map((group) => (
              <div key={group.key}>
                <div className="mb-4 border-b border-border pb-2 text-left">
                  <Title as="h2" className="text-xl font-bold text-fg-muted">
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
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
              </div>
            ))}
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
