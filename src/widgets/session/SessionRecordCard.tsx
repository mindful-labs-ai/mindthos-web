import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { SessionRecord } from '@/features/session/types';
import { extractTextOnly } from '@/features/session/utils/parseNonverbalText';
import { cn } from '@/lib/cn';
import {
  assignClientToSession,
  deleteSession,
  updateSessionTitle,
} from '@/shared/api/supabase/sessionQueries';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import {
  MoreVerticalIcon,
  TitleEdit,
  Trash2Icon,
  UserCircle2Icon,
} from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';
import { PopUp } from '@/shared/ui/composites/PopUp';
import { useToast } from '@/shared/ui/composites/Toast';
import { formatKoreanDateTime } from '@/shared/utils/date';
import { useAuthStore } from '@/stores/authStore';
import { ClientSelector } from '@/widgets/client/ClientSelector';

const CardWrapper: React.FC<{
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}> = ({ className, onClick, children }) =>
  onClick ? (
    <div
      role="button"
      tabIndex={0}
      className={cn('session-card-base transition-all', className)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      {children}
    </div>
  ) : (
    <div className={cn('session-card-base transition-all', className)}>
      {children}
    </div>
  );

interface SessionRecordCardProps {
  record: SessionRecord;
  onClick?: (record: SessionRecord) => void;
  onChangeClient?: (record: SessionRecord) => void;
  onDelete?: (record: SessionRecord) => void;
  isReadOnly?: boolean;
}

export const SessionRecordCard: React.FC<SessionRecordCardProps> = ({
  record,
  onClick,
  onChangeClient,
  isReadOnly = false,
}) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isClientSelectorPopupOpen, setIsClientSelectorPopupOpen] =
    React.useState(false);
  const [isClientSelectorFromMenuOpen, setIsClientSelectorFromMenuOpen] =
    React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const menuClosedAtRef = React.useRef(0);

  // 제목 수정 관련 상태
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState('');
  const [isSavingTitle, setIsSavingTitle] = React.useState(false);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const titleMeasureRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    if (isEditingTitle && titleMeasureRef.current && titleInputRef.current) {
      titleInputRef.current.style.width = `${titleMeasureRef.current.offsetWidth + 8}px`;
    }
  }, [editedTitle, isEditingTitle]);

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
          queryKey: sessionQueryKeys.all(Number(userId)),
        }),
        queryClient.resetQueries({
          queryKey: sessionQueryKeys.detail(record.session_id, false),
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
    // 메뉴가 열려있거나 방금 닫힌 직후 카드 클릭 무시 (모바일 바텀시트 딤 클릭 시 click-through 방지)
    if (
      isMenuOpen ||
      isClientSelectorFromMenuOpen ||
      isClientSelectorPopupOpen
    ) {
      return;
    }
    if (Date.now() - menuClosedAtRef.current < 300) {
      return;
    }
    // 제목 수정 중에는 카드 클릭 무시
    if (isEditingTitle) {
      return;
    }
    // succeeded 상태일 때만 클릭 가능
    if (sessionState === 'succeeded') {
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
        queryKey: sessionQueryKeys.all(Number(userId)),
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
          queryKey: sessionQueryKeys.all(Number(userId)),
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
    if (isMobileView) {
      // 모바일: PopUp 닫고 모달 열기
      setIsMenuOpen(false);
      setIsClientSelectorFromMenuOpen(true);
    } else {
      setIsClientSelectorFromMenuOpen(true);
    }
  };

  const handleMenuOpenChange = (open: boolean) => {
    if (isReadOnly && open) {
      showReadOnlyToast();
      return;
    }
    if (!open) {
      menuClosedAtRef.current = Date.now();
    }
    setIsMenuOpen(open);
  };

  const triggerButton = (
    <button
      type="button"
      className="rounded-lg p-1 text-fg-muted hover:bg-surface-contrast"
      aria-label="더보기 메뉴"
    >
      <MoreVerticalIcon size={20} />
    </button>
  );

  const desktopMenuContent = (
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
      <button
        onClick={handleDelete}
        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface-contrast"
      >
        <Trash2Icon size={18} className="text-fg-muted" />
        <Text className="text-fg">상담 기록 삭제</Text>
      </button>
    </div>
  );

  const mobileMenuContent = (
    <div className="mb-16 w-full space-y-1">
      <button
        type="button"
        onClick={handleOpenClientSelectorFromMenu}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
      >
        <span className="text-m text-grey-100 md:text-l">클라이언트 변경</span>
      </button>
      <button
        onClick={handleDelete}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
      >
        <span className="text-m text-red-80 md:text-l">상담 기록 삭제</span>
      </button>
    </div>
  );

  const renderCardMenu = () => (
    <div className="flex-shrink-0" data-popup-wrapper>
      {isMobileView ? (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpenChange(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                handleMenuOpenChange(true);
            }}
          >
            {triggerButton}
          </div>
          <Modal
            open={isMenuOpen}
            onOpenChange={handleMenuOpenChange}
            mobileVariant="bottomSheet"
          >
            {mobileMenuContent}
          </Modal>
          <ClientSelector
            variant="modal"
            clients={clients}
            onSelect={handleClientSelect}
            open={isClientSelectorFromMenuOpen}
            onOpenChange={setIsClientSelectorFromMenuOpen}
          />
        </>
      ) : (
        <PopUp
          open={isMenuOpen}
          onOpenChange={handleMenuOpenChange}
          placement="bottom-left"
          trigger={triggerButton}
          content={desktopMenuContent}
        />
      )}
    </div>
  );

  const renderDeleteModal = () => (
    <Modal
      open={isDeleteModalOpen}
      onOpenChange={setIsDeleteModalOpen}
      title="상담기록 삭제"
      className="max-w-sm"
    >
      <div className="space-y-4">
        <Text className="typo-m font-headline text-fg">
          상담기록 {displayTitle}을 삭제하시겠습니까?
        </Text>
        <Text className="typo-sm text-fg-muted">
          해당 상담기록 데이터가 영구히 삭제됩니다.
        </Text>
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isLoading}
            className="hover:bg-surface-hover typo-sm w-full rounded-lg border border-border bg-surface px-4 py-2 font-medium text-fg transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isLoading}
            className="hover:bg-danger/90 typo-sm w-full rounded-lg bg-danger px-4 py-2 font-medium text-primary-fg transition-colors disabled:opacity-50"
          >
            {isLoading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </Modal>
  );

  const renderTitleEditButtons = () =>
    isEditingTitle ? (
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSaveTitle();
          }}
          disabled={isSavingTitle}
          className="whitespace-nowrap rounded-md bg-green-80 px-4 py-1 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isSavingTitle ? '저장...' : '편집 완료'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCancelEditTitle();
          }}
          disabled={isSavingTitle}
          className="whitespace-nowrap rounded-md border border-grey-30 bg-white px-4 py-1 text-sm font-medium text-grey-70 transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          취소
        </button>
      </div>
    ) : null;

  const renderClientInfo = () => (
    <div className="flex h-9 flex-nowrap items-center justify-between gap-2 overflow-x-hidden">
      <div className="flex gap-2" data-popup-wrapper>
        {hasClient ? (
          <Text className="font-emphasize" as="span">
            {record.client_name}
          </Text>
        ) : (
          <ClientSelector
            variant={isMobileView ? 'modal' : 'dropdown'}
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
      {!isEditingTitle ? (
        <div
          className={`ml-auto min-w-0 gap-2 overflow-x-auto ${isMobile ? 'hidden' : 'flex'}`}
        >
          {record.note_types.slice(0, isTablet ? 2 : 4).map((type, index) => (
            <Badge
              key={`${type}-${index}`}
              tone="neutral"
              variant="solid"
              size="md"
            >
              {type}
            </Badge>
          ))}
          {isTablet
            ? record.note_types.length > 2 && (
                <Badge key="more-tags" tone="neutral" variant="solid" size="md">
                  +{record.note_types.length - 2}
                </Badge>
              )
            : record.note_types.length > 4 && (
                <Badge key="more-tags" tone="neutral" variant="solid" size="md">
                  +{record.note_types.length - 4}
                </Badge>
              )}
        </div>
      ) : null}
    </div>
  );

  // ==========================================
  // 1. 성공 상태 카드 (클릭 가능, 일반 표시)
  // ==========================================
  if (sessionState === 'succeeded') {
    return (
      <>
        <CardWrapper className="cursor-pointer" onClick={handleCardClick}>
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {isEditingTitle ? (
                <div className="relative inline-flex min-w-0 flex-1">
                  <span
                    ref={titleMeasureRef}
                    className="session-card-title invisible absolute whitespace-pre"
                    aria-hidden="true"
                  >
                    {editedTitle || ' '}
                  </span>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    style={{ width: 'auto' }}
                    className="session-card-title rounded bg-green-20 px-1 outline-none"
                    disabled={isSavingTitle}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <>
                  <h3 className="session-card-title px-1 text-left">
                    {truncatedTitle + (isTruncated ? '...' : '')}
                  </h3>
                  <button
                    type="button"
                    onClick={handleStartEditTitle}
                    className="flex size-[30px] items-center justify-center text-fg-muted hover:text-fg"
                    aria-label="제목 수정"
                  >
                    <TitleEdit size={20} />
                  </button>
                </>
              )}
            </div>
            <div className={isEditingTitle ? 'invisible' : ''}>
              {renderCardMenu()}
            </div>
          </div>

          <Text className="typo-sm line-clamp-2 overflow-hidden px-1 text-left text-fg">
            {extractTextOnly(record.content)}
          </Text>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <span className="typo-xs text-grey-70">
                {formatKoreanDateTime(record.created_at)}
              </span>
              <span className="typo-xs text-grey-70">|</span>
              <span className="typo-xs text-grey-70">
                {record.is_handwritten
                  ? '직접 입력'
                  : (record.stt_model === 'whisper' && '일반 축어록') ||
                    (record.stt_model === 'gemini-3' && '고급 축어록')}
              </span>
            </div>
          </div>

          {!isMobile && renderClientInfo()}
          {renderTitleEditButtons()}
        </CardWrapper>

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
        <CardWrapper className="cursor-not-allowed opacity-75">
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Title
                as="h3"
                className="typo-l truncate text-left font-headline text-fg-muted"
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
                <Text className="typo-xs text-grey-70">
                  {record.current_step || '처리 중...'}
                </Text>
                <Text className="typo-xs text-primary-700 font-medium">
                  {record.progress_percentage}%
                </Text>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
                <div
                  className="bg-primary-500 h-full transition-all duration-slow ease-out"
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
              <Text className="typo-xs text-grey-70">
                {formatKoreanDateTime(record.created_at)}
              </Text>
            </div>
          </div>

          {!isMobile && renderClientInfo()}
        </CardWrapper>

        {renderDeleteModal()}
      </>
    );
  }

  // ==========================================
  // 3. 실패 상태 카드 (클릭 불가, 에러 표시)
  // ==========================================
  return (
    <>
      <CardWrapper className="cursor-not-allowed opacity-75">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Title
              as="h3"
              className="typo-l truncate text-left font-headline text-fg-muted"
            >
              {truncatedTitle + (isTruncated ? '...' : '')}
            </Title>
            <Badge tone="error" variant="soft" size="sm">
              실패
            </Badge>
          </div>
          {renderCardMenu()}
        </div>

        <Text className="typo-sm line-clamp-2 overflow-hidden text-left">
          상담 기록 작성에 실패했습니다.
        </Text>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Text className="typo-xs text-grey-70">
              {formatKoreanDateTime(record.created_at)}
            </Text>
          </div>
        </div>

        {!isMobile && renderClientInfo()}
      </CardWrapper>

      {renderDeleteModal()}
    </>
  );
};
