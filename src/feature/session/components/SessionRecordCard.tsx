import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { Modal } from '@/components/ui/composites/Modal';
import { PopUp } from '@/components/ui/composites/PopUp';
import { useToast } from '@/components/ui/composites/Toast';
import { ClientSelector } from '@/feature/client/components/ClientSelector';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { MoreVerticalIcon, Trash2Icon, UserCircle2Icon } from '@/shared/icons';
import { formatKoreanDateTime } from '@/shared/utils/date';
import { useAuthStore } from '@/stores/authStore';

import {
  assignClientToSession,
  deleteSession,
  updateSessionTitle,
} from '../services/sessionService';
import type { SessionRecord } from '../types';
import { extractTextOnly } from '../utils/parseNonverbalText';

interface SessionRecordCardProps {
  record: SessionRecord;
  onClick?: (record: SessionRecord) => void;
  onChangeClient?: (record: SessionRecord) => void;
  onDelete?: (record: SessionRecord) => void;
  isMobile?: boolean;
  isReadOnly?: boolean;
}

export const SessionRecordCard: React.FC<SessionRecordCardProps> = ({
  record,
  onClick,
  onChangeClient,
  isMobile = false,
  isReadOnly = false,
}) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isClientSelectorPopupOpen, setIsClientSelectorPopupOpen] =
    React.useState(false);
  const [isClientSelectorFromMenuOpen, setIsClientSelectorFromMenuOpen] =
    React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isMobileAlertOpen, setIsMobileAlertOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // 제목 수정 관련 상태
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState('');
  const [isSavingTitle, setIsSavingTitle] = React.useState(false);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const { clients } = useClientList();

  const hasClient =
    record.client_id && record.client_name !== '클라이언트 없음';

  // title이 있으면 그대로 사용, 없으면 기존 방식대로 fallback
  const displayTitle =
    record.title ||
    (hasClient
      ? `${record.client_name} ${record.session_number}회기`
      : `상담 ${record.session_number}회기`);

  // 한글 깨짐 방지: 14자로 자르기 (완성형 한글 보존)
  const { truncatedTitle, isTruncated } = (() => {
    // 문자열을 정규화하여 완성형 한글 보존 (NFC: Normalization Form Canonical Composition)
    const normalized = displayTitle.normalize('NFC');

    // 문자 길이 계산
    let charCount = 0;
    for (const _char of normalized) {
      charCount++;
    }

    // 14자 이하면 그대로 반환
    if (charCount <= 14) {
      return { truncatedTitle: normalized, isTruncated: false };
    }

    // 14자 초과면 14자만 추출
    let result = '';
    let count = 0;

    for (const char of normalized) {
      if (count >= 14) break;
      result += char;
      count++;
    }

    return { truncatedTitle: result, isTruncated: true };
  })();

  // ==========================================
  // 세션 상태 분류 (3가지: 성공, 진행 중, 실패)
  // ==========================================
  type SessionState = 'succeeded' | 'in_progress' | 'failed';

  const getSessionState = (): SessionState => {
    if (!record.processing_status || record.processing_status === 'succeeded') {
      return 'succeeded';
    }
    if (record.processing_status === 'failed') {
      return 'failed';
    }
    // pending, transcribing, generating_note는 모두 진행 중
    return 'in_progress';
  };

  const sessionState = getSessionState();

  // ==========================================
  // 공통 핸들러 함수들
  // ==========================================
  const showReadOnlyToast = () => {
    toast({
      title: '읽기 전용',
      description: '예시에서는 이 기능을 사용할 수 없습니다.',
      duration: 2500,
    });
  };

  // 제목 수정 시작
  const handleStartEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setEditedTitle(displayTitle);
    setIsEditingTitle(true);
    // 다음 렌더링 후 input에 포커스
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  // 제목 저장 (버튼 클릭용)
  const handleSaveTitleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 버튼 클릭 시 카드 클릭 방지
    await handleSaveTitle();
  };

  // 제목 저장 로직
  const handleSaveTitle = async () => {
    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle || trimmedTitle === displayTitle) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    try {
      await updateSessionTitle(record.session_id, trimmedTitle);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['sessions', Number(userId)],
        }),
        queryClient.resetQueries({
          queryKey: ['session', record.session_id, false],
        }),
      ]);

      toast({
        title: '제목 수정 완료',
        description: '상담기록 제목이 변경되었습니다.',
        duration: 2000,
      });
    } catch (error) {
      console.error('제목 수정 실패:', error);
      toast({
        title: '제목 수정 실패',
        description: '다시 시도해주세요.',
        duration: 2500,
      });
    } finally {
      setIsSavingTitle(false);
      setIsEditingTitle(false);
    }
  };

  // 제목 수정 취소 (버튼 클릭용)
  const handleCancelEditTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCancelEditTitle();
  };

  // 제목 수정 취소 로직
  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  // 제목 입력 키보드 핸들러
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditTitle();
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // PopUp 영역 클릭 시 카드 클릭 이벤트 무시
    if ((e.target as HTMLElement).closest('[data-popup-wrapper]')) {
      return;
    }
    // 제목 수정 중에는 카드 클릭 무시
    if (isEditingTitle) {
      return;
    }
    // succeeded 상태일 때만 클릭 가능
    if (sessionState === 'succeeded') {
      if (isMobile) return setIsMobileAlertOpen(true);
      onClick?.(record);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setIsLoading(true);
    try {
      await deleteSession(record.session_id);

      // 세션 목록 갱신
      await queryClient.invalidateQueries({
        queryKey: ['sessions', Number(userId)],
      });

      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('세션 삭제 실패:', error);
      toast({
        title: '상담기록 삭제 실패',
        description: '상담기록 삭제에 실패하였습니다. 다시 시도해주세요.',
        duration: 2500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientSelect = async (client: any) => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
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

  // ==========================================
  // 공통 컴포넌트들
  // ==========================================
  const handleOpenClientSelectorFromMenu = () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    if (isMobile) {
      // 모바일: PopUp 닫고 모달 열기
      setIsMenuOpen(false);
      setIsClientSelectorFromMenuOpen(true);
    } else {
      setIsClientSelectorFromMenuOpen(true);
    }
  };

  const renderCardMenu = () => (
    <div className="flex-shrink-0" data-popup-wrapper>
      <PopUp
        open={isMenuOpen}
        onOpenChange={(open) => {
          if (isReadOnly && open) {
            showReadOnlyToast();
            return;
          }
          setIsMenuOpen(open);
        }}
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
            {isMobile ? (
              <button
                type="button"
                onClick={handleOpenClientSelectorFromMenu}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface-contrast"
              >
                <UserCircle2Icon size={18} className="text-fg-muted" />
                <Text className="text-fg">클라이언트 변경</Text>
              </button>
            ) : (
              <ClientSelector
                variant="dropdown"
                trigger={
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface-contrast"
                  >
                    <UserCircle2Icon size={18} className="text-fg-muted" />
                    <Text className="text-fg">클라이언트 변경</Text>
                  </button>
                }
                open={isClientSelectorFromMenuOpen}
                onOpenChange={setIsClientSelectorFromMenuOpen}
                placement="bottom-left"
                clients={clients}
                onSelect={handleClientSelect}
              />
            )}
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
      {/* 모바일용 ClientSelector 모달 - PopUp 바깥에서 렌더링 */}
      {isMobile && (
        <ClientSelector
          variant="modal"
          clients={clients}
          onSelect={handleClientSelect}
          open={isClientSelectorFromMenuOpen}
          onOpenChange={setIsClientSelectorFromMenuOpen}
        />
      )}
    </div>
  );

  const renderMobileAlertModal = () => (
    <Modal
      open={isMobileAlertOpen}
      onOpenChange={setIsMobileAlertOpen}
      className="h-[250px] max-w-sm"
    >
      <div className="flex h-full flex-col justify-around text-center">
        <Text className="text-xl font-semibold text-fg">모바일 이용 안내</Text>
        <Text className="text-base text-fg">
          상담기록은 PC 환경에서
          <br />
          확인할 수 있습니다.
        </Text>
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => setIsMobileAlertOpen(false)}
            className="w-full rounded-lg bg-primary px-4 py-2 text-base font-medium text-surface transition-colors disabled:opacity-50"
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );

  const renderDeleteModal = () => (
    <Modal
      open={isDeleteModalOpen}
      onOpenChange={setIsDeleteModalOpen}
      title="상담기록 삭제"
      className="max-w-sm"
    >
      <div className="space-y-4">
        <Text className="text-base font-bold text-fg">
          상담기록 {displayTitle}을 삭제하시겠습니까?
        </Text>
        <Text className="text-sm text-fg-muted">
          해당 상담기록 데이터가 영구히 삭제됩니다.
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
  );

  const renderClientInfo = () => (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2" data-popup-wrapper>
        {hasClient ? (
          <Text className="font-semibold" as="span">
            {record.client_name}
          </Text>
        ) : (
          <ClientSelector
            variant={isMobile ? 'modal' : 'dropdown'}
            trigger={
              <Badge
                tone="error"
                variant="soft"
                size="md"
                className="cursor-pointer border border-danger transition-all hover:bg-red-300"
              >
                클라이언트 미정
              </Badge>
            }
            open={isClientSelectorPopupOpen}
            onOpenChange={(open) => {
              if (isReadOnly && open) {
                showReadOnlyToast();
                return;
              }
              setIsClientSelectorPopupOpen(open);
            }}
            placement="bottom-left"
            clients={clients}
            onSelect={handleClientSelect}
          />
        )}
      </div>
      <div className="hidden gap-2 sm:flex md:flex lg:flex">
        {record.note_types.slice(0, 4).map((type, index) => (
          <Badge
            key={`${type}-${index}`}
            tone="neutral"
            variant="solid"
            size="md"
          >
            {type}
          </Badge>
        ))}
        {record.note_types.length > 4 && (
          <Badge key="more-tags" tone="neutral" variant="solid" size="md">
            +{record.note_types.length - 4}
          </Badge>
        )}
      </div>
    </div>
  );

  // ==========================================
  // 1. 성공 상태 카드 (클릭 가능, 일반 표시)
  // ==========================================
  if (sessionState === 'succeeded') {
    return (
      <>
        <Card
          className="cursor-pointer bg-surface transition-all"
          onClick={handleCardClick}
        >
          <Card.Body className="space-y-3 p-6">
            <div className="flex items-start justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={handleTitleKeyDown}
                      className="focus:ring-primary/20 w-full min-w-[200px] max-w-[300px] rounded-lg border border-border bg-bg px-2 py-1 text-lg font-bold focus:border-primary focus:outline-none focus:ring-2"
                      disabled={isSavingTitle}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      onClick={handleSaveTitleClick}
                      disabled={isSavingTitle}
                      className="whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-600 disabled:opacity-50"
                    >
                      {isSavingTitle ? '저장...' : '완료'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditTitleClick}
                      disabled={isSavingTitle}
                      className="hover:bg-surface-hover whitespace-nowrap rounded-lg bg-surface px-3 py-1.5 text-xs text-fg disabled:opacity-50"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    <Title
                      as="h3"
                      className="truncate text-left text-lg font-bold"
                    >
                      {truncatedTitle + (isTruncated ? '...' : '')}
                    </Title>
                    <button
                      type="button"
                      onClick={handleStartEditTitle}
                      className="hidden p-2 text-fg-muted hover:text-fg sm:flex"
                      aria-label="제목 수정"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="transition-colors"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {renderCardMenu()}
            </div>

            <Text className="line-clamp-2 overflow-hidden text-left text-sm text-fg">
              {extractTextOnly(record.content)}
            </Text>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Text className="text-xs text-fg-muted">
                  {formatKoreanDateTime(record.created_at)}
                </Text>
                {record.is_handwritten && (
                  <Badge tone="neutral" variant="soft" size="sm">
                    직접 입력
                  </Badge>
                )}
              </div>
            </div>

            {renderClientInfo()}
          </Card.Body>
        </Card>

        {renderMobileAlertModal()}
        {renderDeleteModal()}
      </>
    );
  }

  // ==========================================
  // 2. 진행 중 상태 카드 (클릭 불가, 프로그레스 바)
  // ==========================================
  if (sessionState === 'in_progress') {
    const getProgressLabel = () => {
      const statusConfig = {
        pending: '작업중',
        transcribing: '전사 중',
        generating_note: '노트 작성 중',
      };
      return (
        statusConfig[
          record.processing_status as
            | 'pending'
            | 'transcribing'
            | 'generating_note'
        ] || '처리 중'
      );
    };

    return (
      <>
        <Card className="cursor-not-allowed opacity-75 transition-all">
          <Card.Body className="space-y-3 p-6">
            <div className="flex items-start justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Title
                  as="h3"
                  className="truncate text-left text-lg font-bold text-fg-muted"
                >
                  {truncatedTitle + (isTruncated ? '...' : '')}
                </Title>
                <Badge tone="primary" variant="soft" size="sm">
                  {getProgressLabel()}
                </Badge>
              </div>
              {renderCardMenu()}
            </div>

            {/* 프로그레스 바 */}
            {record.progress_percentage !== undefined && (
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
                    style={{
                      width: `${record.progress_percentage}%`,
                      background:
                        'linear-gradient(90deg, var(--color-primary-500) 30%, var(--color-primary-100) 50%, var(--color-primary-500) 90%)',
                      backgroundSize: '200% 100%',
                      animation: 'progress-flow 2.5s linear infinite',
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Text className="text-xs text-fg-muted">
                  {formatKoreanDateTime(record.created_at)}
                </Text>
                {record.is_handwritten && (
                  <Badge tone="neutral" variant="soft" size="sm">
                    직접 입력
                  </Badge>
                )}
              </div>
            </div>

            {renderClientInfo()}
          </Card.Body>
        </Card>

        {renderDeleteModal()}
      </>
    );
  }

  // ==========================================
  // 3. 실패 상태 카드 (클릭 불가, 에러 표시)
  // ==========================================
  return (
    <>
      <Card className="cursor-not-allowed opacity-75 transition-all">
        <Card.Body className="space-y-3 p-6">
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Title
                as="h3"
                className="truncate text-left text-lg font-bold text-fg-muted"
              >
                {truncatedTitle + (isTruncated ? '...' : '')}
              </Title>
              <Badge tone="error" variant="soft" size="sm">
                실패
              </Badge>
            </div>
            {renderCardMenu()}
          </div>

          <Text className="line-clamp-2 overflow-hidden text-left text-sm">
            상담 기록 작성에 실패했습니다.
          </Text>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Text className="text-xs text-fg-muted">
                {formatKoreanDateTime(record.created_at)}
              </Text>
              {record.is_handwritten && (
                <Badge tone="neutral" variant="soft" size="sm">
                  직접 입력
                </Badge>
              )}
            </div>
          </div>

          {renderClientInfo()}
        </Card.Body>
      </Card>

      {renderDeleteModal()}
    </>
  );
};
