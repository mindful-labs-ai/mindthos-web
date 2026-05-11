import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { Client } from '@/features/client/types';
import { trackEvent } from '@/lib/mixpanel';
import { clientService } from '@/shared/api/supabase/clientQueries';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { clientQueryKeys } from '@/shared/constants/queryKeys';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { Highlight } from '@/widgets/common/Highlight';

import { ClientCardMenu } from './ClientCardMenu';

interface ClientCardProps {
  client: Client;
  onClick?: (client: Client) => void;
  onEditClick?: (client: Client) => void;
  onAnalyzeClick?: (client: Client) => void;
  isReadOnly?: boolean;
  searchQuery?: string;
  isMobile?: boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onClick,
  onEditClick,
  onAnalyzeClick,
  isReadOnly = false,
  searchQuery = '',
  isMobile = false,
}) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] =
    React.useState(false);
  const [isRestartCounselingModalOpen, setIsRestartCounselingModalOpen] =
    React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // 다회기 분석 가능 여부 체크 (세션 2개 이상)
  const canAnalyze = (client.session_count ?? 0) >= 2;

  const handleCardClick = () => {
    trackEvent(MixpanelEvent.ClientDetailView, { client_id: client.id });
    onClick?.(client);
  };

  const showReadOnlyToast = () => {
    toast({
      title: '읽기 전용',
      description: '실제 상담 기록에서 이 기능을 쓸 수 있어요.',
      duration: 2500,
    });
  };

  const handleCloseSession = () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setIsMenuOpen(false);
    trackEvent(MixpanelEvent.ClientSessionCloseConfirmView, {
      client_id: client.id,
    });
    setIsCloseSessionModalOpen(true);
  };

  const handleConfirmCloseSession = async () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setIsLoading(true);
    try {
      await clientService.updateClient({
        client_id: client.id,
        counsel_done: true,
      });

      trackEvent(MixpanelEvent.ClientSessionClose, { client_id: client.id });

      // 내담자 목록 갱신
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: clientQueryKeys.list(userId),
        });
      }

      setIsCloseSessionModalOpen(false);
    } catch (error) {
      console.error('상담 종결 실패:', error);
      toast({
        title: '실패',
        description: '상담을 종결하지 못했어요.',
        duration: 2500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartCounseling = () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setIsMenuOpen(false);
    trackEvent(MixpanelEvent.ClientSessionRestartConfirmView, {
      client_id: client.id,
    });
    setIsRestartCounselingModalOpen(true);
  };

  const handleConfirmRestartCounseling = async () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setIsLoading(true);
    try {
      await clientService.updateClient({
        client_id: client.id,
        counsel_done: false,
      });

      trackEvent(MixpanelEvent.ClientSessionRestart, { client_id: client.id });

      // 내담자 목록 갱신
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: clientQueryKeys.list(userId),
        });
      }

      setIsRestartCounselingModalOpen(false);
    } catch (error) {
      console.error('상담 재시작 실패:', error);
      toast({
        title: '실패',
        description: '상담을 다시 시작하지 못했어요.',
        duration: 2500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClient = () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setIsMenuOpen(false);
    onEditClick?.(client);
  };

  const handleDeleteClient = () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setIsMenuOpen(false);
    trackEvent(MixpanelEvent.ClientDeleteConfirmView, {
      client_id: client.id,
    });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteClient = async () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setIsLoading(true);
    try {
      await clientService.deleteClient({
        client_id: client.id,
      });

      trackEvent(MixpanelEvent.ClientDelete, { client_id: client.id });

      // 내담자 목록 갱신
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: clientQueryKeys.list(userId),
        });
      }

      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('내담자 삭제 실패:', error);
      toast({
        title: '실패',
        description: '내담자를 삭제하지 못했어요.',
        duration: 2500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        data-client-id={client.id}
        className={`lg:hover:border-grey-50 cursor-pointer rounded-xl border border-grey-40 bg-white p-5 transition-all md:p-6 ${
          client.counsel_done ? 'opacity-50' : ''
        }`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 text-left">
            <p className="mb-1 text-l font-headline text-grey-100">
              <Highlight text={client.name} query={searchQuery} />
            </p>
            <p className="text-sm text-grey-80">
              <Highlight text={client.phone_number} query={searchQuery} />
            </p>
          </div>
          <ClientCardMenu
            isOpen={isMenuOpen}
            onOpenChange={(open) => {
              if (isReadOnly && open) {
                showReadOnlyToast();
                return;
              }
              setIsMenuOpen(open);
            }}
            isCounselDone={client.counsel_done}
            onCloseSession={handleCloseSession}
            onRestartCounseling={handleRestartCounseling}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-grey-60">
              총 {client.session_count ?? 0}개의 상담 기록
            </span>
            <span className="text-sm text-grey-40">|</span>
            <span className="text-sm text-grey-60">
              {client.counsel_theme || '상담 주제 없음'}
            </span>
            <span className="text-sm text-grey-40">|</span>
            <span className="text-sm text-grey-60">
              {client.counsel_number
                ? `${client.counsel_number}회기`
                : '회기 정보 없음'}
            </span>
          </div>
          {!isMobile && canAnalyze && (
            <Badge
              tone="primary"
              variant="outline"
              size="md"
              className="cursor-pointer transition-colors lg:hover:bg-green-10"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onAnalyzeClick?.(client);
              }}
            >
              다회기 분석 가능
            </Badge>
          )}
        </div>
      </div>

      <Modal
        open={isCloseSessionModalOpen}
        onOpenChange={setIsCloseSessionModalOpen}
        title="상담 종결"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <Text className="typo-m font-headline text-fg">
            {client.name} 내담자의 상담을 종결하시겠어요?
          </Text>
          <Text className="typo-sm text-fg-muted">
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
        className="max-w-sm"
      >
        <div className="space-y-4">
          <Text className="typo-m font-headline text-fg">
            {client.name} 내담자의 상담을 재시작하시겠습니까?
          </Text>
          <Text className="typo-sm text-fg-muted">
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
        title="내담자 삭제"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <Text className="typo-m font-headline text-fg">
            {client.name} 내담자를 삭제하시겠습니까?
          </Text>
          <Text className="typo-sm text-fg-muted">
            삭제하면 내담자 정보와 관련된 모든 데이터가 영구적으로 삭제돼요.
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
