import React from 'react';

import { Highlight } from '@/components/common/Highlight';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Card } from '@/components/ui/composites/Card';
import { Modal } from '@/components/ui/composites/Modal';
import type { Client } from '@/feature/client/types';

import { ClientCardMenu } from './ClientCardMenu';

interface ClientCardProps {
  client: Client;
  onClick?: (client: Client) => void;
  onEditClick?: (client: Client) => void;
  searchQuery?: string;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onClick,
  onEditClick,
  searchQuery = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] =
    React.useState(false);

  const handleCardClick = () => {
    onClick?.(client);
  };

  const handleCloseSession = () => {
    setIsMenuOpen(false);
    setIsCloseSessionModalOpen(true);
  };

  const handleConfirmCloseSession = () => {
    setIsCloseSessionModalOpen(false);
    //TODO : 상담 종결 테이블추가하고 로직 추가하기
  };

  const handleEditClient = () => {
    setIsMenuOpen(false);
    onEditClick?.(client);
  };

  const handleDeleteClient = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
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
            <ClientCardMenu
              isOpen={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              onCloseSession={handleCloseSession}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
            />
          </div>

          <div className="flex items-center gap-2">
            {/** TODO : 클라이언트에 연결된 세션 갯수 표시해주기 */}
            <Text className="text-sm text-fg">총 n개의 상담</Text>
            <Text className="text-sm font-medium text-fg-muted">|</Text>
            <Text className="text-sm font-medium text-fg-muted">
              {client.counsel_theme}
            </Text>
            <Text className="text-sm font-medium text-fg-muted">|</Text>
            <Text className="text-sm font-medium text-fg-muted">
              {client.counsel_number}회기
            </Text>
          </div>
        </Card.Body>
      </Card>

      <Modal
        open={isCloseSessionModalOpen}
        onOpenChange={setIsCloseSessionModalOpen}
        title="상담 종결"
      >
        <div className="space-y-4">
          <Text className="text-base font-bold text-fg">
            {client.name} 내담자의 상담을 종결하시겠습니까?
          </Text>
          <Text className="text-sm text-fg-muted">
            상담을 종결하면 더이상 내담자에게 상담 기록을 추가할 수 없어요.
          </Text>
          <div className="flex justify-center pt-2">
            <Button
              variant="solid"
              tone="primary"
              size="lg"
              onClick={handleConfirmCloseSession}
              className="w-full"
            >
              상담 종결
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
