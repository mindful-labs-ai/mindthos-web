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
import {
  clientQueryKeys,
  sessionQueryKeys,
} from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import {
  MoreVerticalIcon,
  TitleEdit,
  Trash2Icon,
  UserCircle2Icon,
} from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';
import { PopUp } from '@/shared/ui/composites/PopUp';
import { useToast } from '@/shared/ui/composites/Toast';
import { formatKoreanDateTime } from '@/shared/utils/date';
import { useAuthStore } from '@/stores/authStore';
import { ClientSelector } from '@/widgets/client/ClientSelector';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SessionState = 'succeeded' | 'in_progress' | 'failed';

interface SessionRecordCardProps {
  record: SessionRecord;
  onClick?: (record: SessionRecord) => void;
  onChangeClient?: (record: SessionRecord) => void;
  onDelete?: (record: SessionRecord) => void;
  isReadOnly?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: CardWrapper
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: CardHeader (제목 + 메뉴)
// ─────────────────────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: string;
  isEditing: boolean;
  editedTitle: string;
  isSaving: boolean;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  titleMeasureRef: React.RefObject<HTMLSpanElement | null>;
  onStartEdit: (e: React.MouseEvent) => void;
  onChangeTitle: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  menu: React.ReactNode;
  badge?: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  isEditing,
  editedTitle,
  isSaving,
  titleInputRef,
  titleMeasureRef,
  onStartEdit,
  onChangeTitle,
  onKeyDown,
  menu,
  badge,
}) => (
  <div className="flex items-start justify-between">
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {isEditing ? (
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
            onChange={(e) => onChangeTitle(e.target.value)}
            onKeyDown={onKeyDown}
            style={{ width: 'auto' }}
            className="session-card-title rounded bg-green-20 px-1 outline-none"
            disabled={isSaving}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <>
          <h3 className="session-card-title px-1 text-left">{title}</h3>
          {onStartEdit && (
            <button
              type="button"
              onClick={onStartEdit}
              className="flex size-[30px] items-center justify-center text-fg-muted hover:text-fg"
              aria-label="제목 수정"
            >
              <TitleEdit size={20} />
            </button>
          )}
        </>
      )}
      {badge}
    </div>
    <div className={isEditing ? 'invisible' : ''}>{menu}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: CardMeta (날짜 + 유형)
// ─────────────────────────────────────────────────────────────────────────────

interface CardMetaProps {
  createdAt: string;
  isHandwritten?: boolean;
  sttModel?: string | null;
}

const CardMeta: React.FC<CardMetaProps> = ({
  createdAt,
  isHandwritten,
  sttModel,
}) => (
  <div className="flex items-center gap-1">
    <span className="text-sm font-sub text-grey-70">
      {formatKoreanDateTime(createdAt)}
    </span>
    {(isHandwritten || sttModel) && (
      <>
        <span className="typo-xs text-grey-70">|</span>
        <span className="typo-xs text-grey-70">
          {isHandwritten
            ? '직접 입력'
            : sttModel === 'whisper'
              ? '일반 축어록'
              : sttModel === 'gemini-3'
                ? '고급 축어록'
                : ''}
        </span>
      </>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: ClientInfoRow (클라이언트 + 노트 뱃지)
// ─────────────────────────────────────────────────────────────────────────────

interface ClientInfoRowProps {
  hasClient: boolean;
  clientName: string;
  noteTypes: string[];
  isEditingTitle: boolean;
  isMobile: boolean;
  isTablet: boolean;
  clientSelector: React.ReactNode;
}

const ClientInfoRow: React.FC<ClientInfoRowProps> = ({
  hasClient,
  clientName,
  noteTypes,
  isEditingTitle,
  isMobile,
  isTablet,
  clientSelector,
}) => {
  if (isMobile) return null;

  const maxBadges = isTablet ? 2 : 4;

  return (
    <div className="flex h-9 flex-nowrap items-center justify-between gap-2 overflow-x-hidden">
      <div className="flex gap-2" data-popup-wrapper>
        {hasClient ? (
          <Text className="font-emphasize" as="span">
            {clientName}
          </Text>
        ) : (
          clientSelector
        )}
      </div>
      {!isEditingTitle && (
        <div className="ml-auto flex min-w-0 gap-2 overflow-x-auto">
          {noteTypes.slice(0, maxBadges).map((type, index) => (
            <Badge
              key={`${type}-${index}`}
              tone="neutral"
              variant="solid"
              size="md"
              className="bg-grey-40 text-sm !font-headline"
            >
              {type}
            </Badge>
          ))}
          {noteTypes.length > maxBadges && (
            <Badge
              tone="neutral"
              variant="solid"
              size="md"
              className="bg-grey-40 text-sm !font-headline"
            >
              +{noteTypes.length - maxBadges}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: TitleEditButtons (편집 완료/취소)
// ─────────────────────────────────────────────────────────────────────────────

interface TitleEditButtonsProps {
  isEditing: boolean;
  isSaving: boolean;
  onSave: (e: React.MouseEvent) => void;
  onCancel: (e: React.MouseEvent) => void;
}

const TitleEditButtons: React.FC<TitleEditButtonsProps> = ({
  isEditing,
  isSaving,
  onSave,
  onCancel,
}) => {
  if (!isEditing) return null;
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="whitespace-nowrap rounded-md bg-green-80 px-4 py-1 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {isSaving ? '저장...' : '편집 완료'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="whitespace-nowrap rounded-md border border-grey-30 bg-white px-4 py-1 text-sm font-medium text-grey-70 transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        취소
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: ProgressBar
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  percentage: number;
  stepLabel: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, stepLabel }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <Text className="typo-xs text-grey-70">{stepLabel}</Text>
      <Text className="typo-xs text-primary-700 font-medium">
        {percentage}%
      </Text>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
      <div
        className="bg-primary-500 h-full transition-all duration-slow ease-out"
        style={{
          width: `${percentage}%`,
          background:
            'linear-gradient(90deg, var(--color-primary-500) 30%, var(--color-primary-100) 50%, var(--color-primary-500) 90%)',
          backgroundSize: '200% 100%',
          animation: 'progress-flow 2.5s linear infinite',
        }}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: DeleteConfirmModal
// ─────────────────────────────────────────────────────────────────────────────

interface DeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isLoading: boolean;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
  open,
  onOpenChange,
  title,
  isLoading,
  onConfirm,
}) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title="상담기록 삭제"
    className="max-w-sm"
  >
    <div className="space-y-4">
      <Text className="typo-m font-headline text-fg">
        상담기록 {title}을 삭제하시겠습니까?
      </Text>
      <Text className="typo-sm text-fg-muted">
        해당 상담기록 데이터가 영구히 삭제됩니다.
      </Text>
      <div className="flex justify-center gap-2 pt-2">
        <button
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="hover:bg-surface-hover typo-sm w-full rounded-lg border border-border bg-surface px-4 py-2 font-medium text-fg transition-colors disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="hover:bg-danger/90 typo-sm w-full rounded-lg bg-danger px-4 py-2 font-medium text-primary-fg transition-colors disabled:opacity-50"
        >
          {isLoading ? '삭제 중...' : '삭제'}
        </button>
      </div>
    </div>
  </Modal>
);

// ─────────────────────────────────────────────────────────────────────────────
// Container: SessionRecordCard (로직 + 조립)
// ─────────────────────────────────────────────────────────────────────────────

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
  const { clients } = useClientList();

  // ── State ──
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isClientSelectorPopupOpen, setIsClientSelectorPopupOpen] =
    React.useState(false);
  const [isClientSelectorFromMenuOpen, setIsClientSelectorFromMenuOpen] =
    React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState('');
  const [isSavingTitle, setIsSavingTitle] = React.useState(false);
  const menuClosedAtRef = React.useRef(0);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const titleMeasureRef = React.useRef<HTMLSpanElement>(null);

  // ── Derived ──
  const hasClient = !!(
    record.client_id && record.client_name !== '클라이언트 없음'
  );
  const displayTitle =
    record.title ||
    (hasClient
      ? `${record.client_name} ${record.session_number}회기`
      : `상담 ${record.session_number}회기`);

  const { truncatedTitle, isTruncated } = React.useMemo(() => {
    const normalized = displayTitle.normalize('NFC');
    const chars = [...normalized];
    if (chars.length <= 14)
      return { truncatedTitle: normalized, isTruncated: false };
    return { truncatedTitle: chars.slice(0, 14).join(''), isTruncated: true };
  }, [displayTitle]);

  const formattedTitle = truncatedTitle + (isTruncated ? '...' : '');

  const sessionState: SessionState = (() => {
    if (!record.processing_status || record.processing_status === 'succeeded')
      return 'succeeded';
    if (record.processing_status === 'failed') return 'failed';
    return 'in_progress';
  })();

  // ── Auto-resize title input ──
  React.useLayoutEffect(() => {
    if (isEditingTitle && titleMeasureRef.current && titleInputRef.current) {
      titleInputRef.current.style.width = `${titleMeasureRef.current.offsetWidth + 8}px`;
    }
  }, [editedTitle, isEditingTitle]);

  // ── Handlers ──
  const showReadOnlyToast = () => {
    toast({
      title: '읽기 전용',
      description: '예시에서는 이 기능을 사용할 수 없습니다.',
      duration: 2500,
    });
  };

  const handleStartEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    setEditedTitle(displayTitle);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleSaveTitle = async () => {
    const trimmed = editedTitle.trim();
    if (!trimmed || trimmed === displayTitle) {
      setIsEditingTitle(false);
      return;
    }
    setIsSavingTitle(true);
    try {
      await updateSessionTitle(record.session_id, trimmed);
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
    } catch {
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

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditTitle();
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-popup-wrapper]')) return;
    if (isMenuOpen || isClientSelectorFromMenuOpen || isClientSelectorPopupOpen)
      return;
    if (Date.now() - menuClosedAtRef.current < 300) return;
    if (isEditingTitle) return;
    if (sessionState === 'succeeded') onClick?.(record);
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
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKeys.all(Number(userId)),
      });
      setIsDeleteModalOpen(false);
    } catch {
      toast({
        title: '상담기록 삭제 실패',
        description: '다시 시도해주세요.',
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
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: sessionQueryKeys.all(Number(userId)),
          }),
          queryClient.invalidateQueries({ queryKey: clientQueryKeys.all }),
        ]);
        onChangeClient?.(record);
      } catch {
        toast({
          title: '클라이언트 할당 실패',
          description: '다시 시도해주세요.',
          duration: 2500,
        });
      } finally {
        setIsLoading(false);
      }
    }
    setIsClientSelectorFromMenuOpen(false);
    setIsClientSelectorPopupOpen(false);
    setIsMenuOpen(false);
  };

  const handleMenuOpenChange = (open: boolean) => {
    if (isReadOnly && open) {
      showReadOnlyToast();
      return;
    }
    if (!open) menuClosedAtRef.current = Date.now();
    setIsMenuOpen(open);
  };

  const handleOpenClientSelectorFromMenu = () => {
    if (isReadOnly) {
      showReadOnlyToast();
      return;
    }
    if (isMobileView) {
      setIsMenuOpen(false);
    }
    setIsClientSelectorFromMenuOpen(true);
  };

  // ── Assembled slots ──
  const triggerButton = (
    <button
      type="button"
      className="rounded-lg p-1 text-fg-muted hover:bg-surface-contrast"
      aria-label="더보기 메뉴"
    >
      <MoreVerticalIcon size={20} />
    </button>
  );

  const cardMenu = (
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
            <div className="mb-16 w-full space-y-1">
              <button
                type="button"
                onClick={handleOpenClientSelectorFromMenu}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
              >
                <span className="text-m text-grey-100 md:text-l">
                  클라이언트 변경
                </span>
              </button>
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
              >
                <span className="text-m text-red-80 md:text-l">
                  상담 기록 삭제
                </span>
              </button>
            </div>
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
          }
        />
      )}
    </div>
  );

  const clientSelector = (
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
  );

  // ── Render by state ──
  if (sessionState === 'succeeded') {
    return (
      <>
        <CardWrapper className="cursor-pointer" onClick={handleCardClick}>
          <CardHeader
            title={formattedTitle}
            isEditing={isEditingTitle}
            editedTitle={editedTitle}
            isSaving={isSavingTitle}
            titleInputRef={titleInputRef}
            titleMeasureRef={titleMeasureRef}
            onStartEdit={handleStartEditTitle}
            onChangeTitle={setEditedTitle}
            onKeyDown={handleTitleKeyDown}
            menu={cardMenu}
          />
          <Text className="line-clamp-2 overflow-hidden px-1 text-left text-m font-medium text-fg">
            {extractTextOnly(record.content)}
          </Text>
          <CardMeta
            createdAt={record.created_at}
            isHandwritten={record.is_handwritten}
            sttModel={record.stt_model}
          />
          <ClientInfoRow
            hasClient={hasClient}
            clientName={record.client_name}
            noteTypes={record.note_types}
            isEditingTitle={isEditingTitle}
            isMobile={isMobile}
            isTablet={isTablet}
            clientSelector={clientSelector}
          />
          <TitleEditButtons
            isEditing={isEditingTitle}
            isSaving={isSavingTitle}
            onSave={(e) => {
              e.stopPropagation();
              handleSaveTitle();
            }}
            onCancel={(e) => {
              e.stopPropagation();
              handleCancelEditTitle();
            }}
          />
        </CardWrapper>
        <DeleteConfirmModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title={displayTitle}
          isLoading={isLoading}
          onConfirm={handleConfirmDelete}
        />
      </>
    );
  }

  if (sessionState === 'in_progress') {
    const progressLabel = (() => {
      const map: Record<string, string> = {
        pending: '작업중',
        transcribing: '전사 중',
        generating_note: '노트 작성 중',
      };
      return map[record.processing_status ?? ''] || '처리 중';
    })();

    return (
      <>
        <CardWrapper className="cursor-not-allowed opacity-75">
          <CardHeader
            title={formattedTitle}
            isEditing={false}
            editedTitle=""
            isSaving={false}
            titleInputRef={titleInputRef}
            titleMeasureRef={titleMeasureRef}
            onStartEdit={() => {}}
            onChangeTitle={() => {}}
            onKeyDown={() => {}}
            menu={cardMenu}
            badge={
              <Badge tone="primary" variant="soft" size="sm">
                {progressLabel}
              </Badge>
            }
          />
          {record.progress_percentage !== undefined && (
            <ProgressBar
              percentage={record.progress_percentage}
              stepLabel={record.current_step || '처리 중...'}
            />
          )}
          <CardMeta
            createdAt={record.created_at}
            isHandwritten={record.is_handwritten}
            sttModel={record.stt_model}
          />
          <ClientInfoRow
            hasClient={hasClient}
            clientName={record.client_name}
            noteTypes={record.note_types}
            isEditingTitle={false}
            isMobile={isMobile}
            isTablet={isTablet}
            clientSelector={clientSelector}
          />
        </CardWrapper>
        <DeleteConfirmModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title={displayTitle}
          isLoading={isLoading}
          onConfirm={handleConfirmDelete}
        />
      </>
    );
  }

  // failed
  return (
    <>
      <CardWrapper className="cursor-not-allowed opacity-75">
        <CardHeader
          title={formattedTitle}
          isEditing={false}
          editedTitle=""
          isSaving={false}
          titleInputRef={titleInputRef}
          titleMeasureRef={titleMeasureRef}
          onStartEdit={() => {}}
          onChangeTitle={() => {}}
          onKeyDown={() => {}}
          menu={cardMenu}
          badge={
            <Badge tone="error" variant="soft" size="sm">
              실패
            </Badge>
          }
        />
        <Text className="typo-sm line-clamp-2 overflow-hidden text-left">
          상담 기록 작성에 실패했습니다.
        </Text>
        <CardMeta
          createdAt={record.created_at}
          isHandwritten={record.is_handwritten}
          sttModel={record.stt_model}
        />
        <ClientInfoRow
          hasClient={hasClient}
          clientName={record.client_name}
          noteTypes={record.note_types}
          isEditingTitle={false}
          isMobile={isMobile}
          isTablet={isTablet}
          clientSelector={clientSelector}
        />
      </CardWrapper>
      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title={displayTitle}
        isLoading={isLoading}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
