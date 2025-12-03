import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { Modal } from '@/components/ui/composites/Modal';
import { PopUp } from '@/components/ui/composites/PopUp';
import { ClientSelector } from '@/feature/client/components/ClientSelector';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { MoreVerticalIcon, Trash2Icon, UserCircle2Icon } from '@/shared/icons';
import { formatKoreanDateTime } from '@/shared/utils/date';
import { useAuthStore } from '@/stores/authStore';

import {
  assignClientToSession,
  deleteSession,
} from '../services/sessionService';
import type { SessionRecord } from '../types';

interface SessionRecordCardProps {
  record: SessionRecord;
  onClick?: (record: SessionRecord) => void;
  onChangeClient?: (record: SessionRecord) => void;
  onDelete?: (record: SessionRecord) => void;
  isActive?: boolean;
}

export const SessionRecordCard: React.FC<SessionRecordCardProps> = ({
  record,
  onClick,
  onChangeClient,
  onDelete,
  isActive = false,
}) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isClientSelectorPopupOpen, setIsClientSelectorPopupOpen] =
    React.useState(false);
  const [isClientSelectorFromMenuOpen, setIsClientSelectorFromMenuOpen] =
    React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const { clients } = useClientList();

  const hasClient = record.client_id && record.client_name !== '고객 없음';

  // title이 있으면 그대로 사용, 없으면 기존 방식대로 fallback
  const displayTitle = record.title || (hasClient
    ? `${record.client_name} ${record.session_number}회기`
    : `세션 ${record.session_number}회기`);

  const getStatusBadge = () => {
    if (!record.processing_status || record.processing_status === 'succeeded')
      return null;

    const statusConfig = {
      pending: { label: '대기 중', tone: 'neutral' as const },
      transcribing: { label: '전사 중', tone: 'primary' as const },
      generating_note: { label: '노트 생성 중', tone: 'primary' as const },
      failed: { label: '실패', tone: 'error' as const },
    };

    const config = statusConfig[record.processing_status];

    return (
      <Badge tone={config.tone} variant="soft" size="sm">
        {config.label}
      </Badge>
    );
  };

  const isClickable =
    !record.processing_status || record.processing_status === 'succeeded';

  const handleCardClick = (e: React.MouseEvent) => {
    // PopUp 영역 클릭 시 카드 클릭 이벤트 무시
    if ((e.target as HTMLElement).closest('[data-popup-wrapper]')) {
      return;
    }
    // succeeded 상태일 때만 클릭 가능
    if (isClickable) {
      onClick?.(record);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      await deleteSession(record.session_id);

      // 세션 목록 갱신
      await queryClient.invalidateQueries({
        queryKey: ['sessions', Number(userId)],
      });

      setIsDeleteModalOpen(false);
      onDelete?.(record);
    } catch (error) {
      console.error('세션 삭제 실패:', error);
      alert('세션 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientSelect = async (client: any) => {
    if (client) {
      setIsLoading(true);
      try {
        await assignClientToSession(record.session_id, client.id);

        // 세션 목록 갱신
        await queryClient.invalidateQueries({
          queryKey: ['sessions', Number(userId)],
        });

        onChangeClient?.(record);
      } catch (error) {
        console.error('클라이언트 할당 실패:', error);
        alert('클라이언트 할당에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    // 모든 PopUp 닫기
    setIsClientSelectorFromMenuOpen(false);
    setIsClientSelectorPopupOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <>
      <Card
        className={`transition-all ${
          isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
        } ${
          isActive
            ? 'border-l-4 border-primary bg-surface shadow-md'
            : 'hover:shadow-lg'
        }`}
        onClick={handleCardClick}
      >
        <Card.Body className="space-y-3 p-6">
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Title as="h3" className="truncate text-left text-lg font-bold">
                {displayTitle}
              </Title>
              {getStatusBadge()}
            </div>
            <div className="flex-shrink-0" data-popup-wrapper>
              <PopUp
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                placement="bottom-left"
                trigger={
                  <button
                    type="button"
                    className="rounded-lg p-1 text-fg-muted hover:bg-surface-contrast"
                    aria-label="더보기 메뉴"
                  >
                    <MoreVerticalIcon size={20} />
                  </button>
                }
                content={
                  <div
                    className="space-y-1"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <ClientSelector
                      variant="dropdown"
                      trigger={
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface-contrast"
                        >
                          <UserCircle2Icon
                            size={18}
                            className="text-fg-muted"
                          />
                          <Text className="text-fg">내담자 변경</Text>
                        </button>
                      }
                      open={isClientSelectorFromMenuOpen}
                      onOpenChange={setIsClientSelectorFromMenuOpen}
                      placement="bottom-left"
                      clients={clients}
                      onSelect={handleClientSelect}
                    />
                    <button
                      onClick={handleDelete}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface-contrast"
                    >
                      <Trash2Icon size={18} className="text-fg-muted" />
                      <Text className="text-fg">상담 기록 삭제</Text>
                    </button>
                  </div>
                }
              />
            </div>
          </div>

          {/* 진행 중일 때 프로그레스 바 표시 */}
          {record.processing_status &&
            record.processing_status !== 'succeeded' &&
            record.processing_status !== 'failed' &&
            record.progress_percentage !== undefined && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Text className="text-xs text-fg-muted">
                    {record.current_step || '처리 중...'}
                  </Text>
                  <Text className="text-xs font-medium text-primary-700">
                    {record.progress_percentage}%
                  </Text>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300 ease-out"
                    style={{ width: `${record.progress_percentage}%` }}
                  />
                </div>
              </div>
            )}

          <Text className="line-clamp-2 overflow-hidden text-left text-sm text-fg">
            {record.content}
          </Text>

          <div className="flex items-center justify-between gap-3">
            <Text className="text-xs text-fg-muted">
              {formatKoreanDateTime(record.created_at)}
            </Text>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2" data-popup-wrapper>
              <ClientSelector
                variant="dropdown"
                trigger={
                  !hasClient ? (
                    <Badge
                      tone="error"
                      variant="soft"
                      size="md"
                      className="hover:bg-danger/20 cursor-pointer border border-danger transition-all"
                    >
                      고객 미정
                    </Badge>
                  ) : (
                    <div style={{ display: 'none' }} />
                  )
                }
                open={isClientSelectorPopupOpen}
                onOpenChange={setIsClientSelectorPopupOpen}
                placement="bottom-left"
                clients={clients}
                onSelect={handleClientSelect}
              />
            </div>
            <div className="flex gap-2">
              {record.note_types.map((type, index) => (
                <Badge key={index} tone="neutral" variant="solid" size="md">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>

      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="세션 삭제"
      >
        <div className="space-y-4">
          <Text className="text-base font-bold text-fg">
            {displayTitle} 세션을 삭제하시겠습니까?
          </Text>
          <Text className="text-sm text-fg-muted">
            삭제하면 세션과 관련된 모든 데이터가 영구적으로 삭제됩니다.
          </Text>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading}
              className="hover:bg-surface-hover w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-fg transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="hover:bg-danger/90 w-full rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
