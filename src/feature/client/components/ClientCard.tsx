import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Highlight } from '@/components/common/Highlight';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Card } from '@/components/ui/composites/Card';
import { Modal } from '@/components/ui/composites/Modal';
import { useAuthStore } from '@/stores/authStore';

import { clientQueryKeys } from '../constants/queryKeys';
import { clientService } from '../services/clientService';
import type { Client } from '../types';

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
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] =
    React.useState(false);
  const [isRestartCounselingModalOpen, setIsRestartCounselingModalOpen] =
    React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCardClick = () => {
    onClick?.(client);
  };

  const handleCloseSession = () => {
    setIsMenuOpen(false);
    setIsCloseSessionModalOpen(true);
  };

  const handleConfirmCloseSession = async () => {
    setIsLoading(true);
    try {
      await clientService.updateClient({
        client_id: client.id,
        counsel_done: true,
      });

      // 클라이언트 목록 갱신
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: clientQueryKeys.list(userId),
        });
      }

      setIsCloseSessionModalOpen(false);
    } catch (error) {
      console.error('상담 종결 실패:', error);
      alert('상담 종결에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartCounseling = () => {
    setIsMenuOpen(false);
    setIsRestartCounselingModalOpen(true);
  };

  const handleConfirmRestartCounseling = async () => {
    setIsLoading(true);
    try {
      await clientService.updateClient({
        client_id: client.id,
        counsel_done: false,
      });

      // 클라이언트 목록 갱신
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: clientQueryKeys.list(userId),
        });
      }

      setIsRestartCounselingModalOpen(false);
    } catch (error) {
      console.error('상담 재시작 실패:', error);
      alert('상담 재시작에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClient = () => {
    setIsMenuOpen(false);
    onEditClick?.(client);
  };

  const handleDeleteClient = () => {
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteClient = async () => {
    setIsLoading(true);
    try {
      await clientService.deleteClient({
        client_id: client.id,
      });

      // 클라이언트 목록 갱신
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: clientQueryKeys.list(userId),
        });
      }

      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('클라이언트 삭제 실패:', error);
      alert('클라이언트 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${
          client.counsel_done ? 'opacity-50' : ''
        }`}
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
              isCounselDone={client.counsel_done}
              onCloseSession={handleCloseSession}
              onRestartCounseling={handleRestartCounseling}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
            />
          </div>

          <div className="flex items-center gap-2">
            <Text className="text-sm text-fg">
              총 {client.session_count ?? 0}개의 상담
            </Text>
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
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '처리 중...' : '상담 종결'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isRestartCounselingModalOpen}
        onOpenChange={setIsRestartCounselingModalOpen}
        title="상담 재시작"
      >
        <div className="space-y-4">
          <Text className="text-base font-bold text-fg">
            {client.name} 내담자의 상담을 재시작하시겠습니까?
          </Text>
          <Text className="text-sm text-fg-muted">
            상담을 재시작하면 다시 상담 기록을 추가할 수 있어요.
          </Text>
          <div className="flex justify-center pt-2">
            <Button
              variant="solid"
              tone="primary"
              size="lg"
              onClick={handleConfirmRestartCounseling}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '처리 중...' : '상담 재시작'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="클라이언트 삭제"
      >
        <div className="space-y-4">
          <Text className="text-base font-bold text-fg">
            {client.name} 클라이언트를 삭제하시겠습니까?
          </Text>
          <Text className="text-sm text-fg-muted">
            삭제하면 클라이언트 정보와 관련된 모든 데이터가 영구적으로
            삭제됩니다.
          </Text>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              tone="neutral"
              size="lg"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading}
              className="w-full"
            >
              취소
            </Button>
            <Button
              variant="solid"
              tone="danger"
              size="lg"
              onClick={handleConfirmDeleteClient}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
