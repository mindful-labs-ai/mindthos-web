import React from 'react';

import { Badge } from '@/components/ui/atoms/Badge';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import type { Client } from '@/feature/client/types';
import { SearchIcon, UserIcon, XIcon } from '@/shared/icons';

interface ClientSelectorProps {
  clients: Client[];
  selectedClient: Client | null;
  onSelect: (client: Client | null) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClient,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 최근 추가된 고객 (최근 3명)
  const recentClients = [...clients]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 3);

  const handleSelectClient = (client: Client) => {
    onSelect(client);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = () => {
    onSelect(null);
  };

  return (
    <div className="space-y-2">
      {!selectedClient ? (
        <Button
          variant="outline"
          size="md"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-center gap-2"
        >
          <UserIcon size={16} />
          <Text>고객 선택 안함</Text>
        </Button>
      ) : (
        <div className="bg-primary/5 flex items-center gap-2 rounded-lg border border-primary p-3">
          <UserIcon size={16} className="text-primary" />
          <Text className="flex-1 font-medium">{selectedClient.name}</Text>
          <button
            onClick={handleClearSelection}
            className="rounded p-1 hover:bg-surface"
          >
            <XIcon size={16} className="text-muted" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full max-w-sm space-y-4 rounded-lg border border-surface-strong bg-surface p-4 shadow-lg">
          {/* 검색 */}
          <div className="relative">
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-strong"
            />
            <input
              type="text"
              placeholder="고객 검색하기"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-surface-strong bg-surface-contrast py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 최근 추가된 고객 */}
          {searchQuery === '' && recentClients.length > 0 && (
            <div className="space-y-2">
              <Text className="text-muted">최근 추가된 고객</Text>
              <div className="flex flex-shrink-0 gap-4">
                {recentClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className=""
                  >
                    <Badge
                      tone="neutral"
                      variant="soft"
                      className="bg-primary-200 hover:bg-primary-300"
                    >
                      {client.name}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 모든 고객 */}
          <div className="space-y-2">
            {searchQuery === '' && (
              <Text className="text-muted">모든 고객</Text>
            )}
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-surface-contrast"
                  >
                    <Text>{client.name}</Text>
                    <Text className="font-medium text-primary">선택</Text>
                  </button>
                ))
              ) : (
                <Text className="py-4 text-center text-fg-muted">
                  검색 결과가 없습니다
                </Text>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
