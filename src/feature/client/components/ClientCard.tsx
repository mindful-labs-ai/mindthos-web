import React from 'react';

import { MoreVertical } from 'lucide-react';

import { Highlight } from '@/components/common/Highlight';
import { Text } from '@/components/ui/atoms/Text';
import { Card } from '@/components/ui/composites/Card';
import type { Client } from '@/feature/client/types';

interface ClientCardProps {
  client: Client;
  onClick?: (client: Client) => void;
  onMenuClick?: (client: Client) => void;
  searchQuery?: string;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onClick,
  onMenuClick,
  searchQuery = '',
}) => {
  const handleCardClick = () => {
    onClick?.(client);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuClick?.(client);
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={handleCardClick}
    >
      <Card.Body className="space-y-3 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 text-left">
            <Text className="mb-1 text-lg font-bold">
              <Highlight text={client.name} query={searchQuery} />
            </Text>
            <Text className="text-sm text-fg">
              <Highlight text={client.phone_number} query={searchQuery} />
            </Text>
          </div>
          <button
            onClick={handleMenuClick}
            className="translate-x-3 rounded-lg p-1 text-fg-muted transition-colors hover:bg-surface-contrast"
            aria-label="메뉴"
          >
            <MoreVertical size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Text className="text-sm text-fg">
            {client.group_id ? '동반 상담' : '개인 상담'}
          </Text>
          <Text className="text-sm font-medium text-fg-muted">|</Text>
          <Text className="text-sm font-medium text-fg-muted">
            {client.counsel_number}회기
          </Text>
        </div>
      </Card.Body>
    </Card>
  );
};
