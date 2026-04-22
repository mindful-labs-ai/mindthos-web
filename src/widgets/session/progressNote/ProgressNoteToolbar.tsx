import { useState } from 'react';

import {
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  MoreVerticalIcon,
} from '@/shared/icons';
import { Modal } from '@/shared/ui/composites/Modal';

type ToolbarVariant = 'desktop' | 'mobile-inline' | 'mobile-kebab';

interface ProgressNoteToolbarProps {
  variant: ToolbarVariant;
  isEditing: boolean;
  hasEdits: boolean;
  isSaving: boolean;
  copiedAll: boolean;
  canEdit: boolean;
  canRegenerate: boolean;
  isRegenerating: boolean;
  onEditStart: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onCopyAll: () => void;
  onRegenerateClick: () => void;
}

const RegenerateIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    className={spinning ? 'animate-spin' : ''}
  >
    <path
      d="M8.33447 13.3333H4.16781V17.5M11.6678 6.66667H15.8345V2.5M3.82031 7.50284C4.28755 6.34638 5.06984 5.3442 6.07826 4.61019C7.08669 3.87618 8.28185 3.4396 9.52593 3.35042C10.77 3.26125 12.0134 3.52284 13.1162 4.10551C14.219 4.68819 15.1355 5.56878 15.7629 6.64677M16.1824 12.4976C15.7152 13.654 14.9329 14.6562 13.9245 15.3902C12.9161 16.1242 11.7221 16.5602 10.478 16.6494C9.23395 16.7386 7.98953 16.477 6.88672 15.8944C5.78391 15.3117 4.86682 14.4313 4.23942 13.3533"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function ProgressNoteToolbar({
  variant,
  isEditing,
  hasEdits,
  isSaving,
  copiedAll,
  canEdit,
  canRegenerate,
  isRegenerating,
  onEditStart,
  onCancelEdit,
  onSaveEdit,
  onCopyAll,
  onRegenerateClick,
}: ProgressNoteToolbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isEditing) {
    // 모바일은 compact-nav에서 취소/저장 처리 → 렌더하지 않음
    if (variant !== 'desktop') return null;
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancelEdit}
          disabled={isSaving}
          className="rounded-md border border-grey-30 px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSaveEdit}
          disabled={!hasEdits || isSaving}
          className={`rounded-md px-3.5 py-1 text-m font-medium transition-colors ${
            hasEdits && !isSaving
              ? 'bg-green-80 text-white lg:hover:opacity-90'
              : 'cursor-not-allowed bg-grey-20 text-grey-60'
          }`}
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    );
  }

  if (variant === 'desktop') {
    return (
      <div className="flex items-center gap-2">
        {canEdit && (
          <button
            type="button"
            onClick={onEditStart}
            disabled={isRegenerating}
            className={`rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100 ${
              isRegenerating ? 'cursor-not-allowed opacity-50' : ''
            }`}
            aria-label="노트 편집"
          >
            편집
          </button>
        )}
        <button
          type="button"
          onClick={onCopyAll}
          className="flex items-center gap-1.5 rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
          aria-label="전체 복사"
        >
          {copiedAll ? (
            <>
              <CheckIcon size={18} className="text-green-80" />
              <span className="text-green-80">복사됨</span>
            </>
          ) : (
            <>
              <CopyIcon size={20} />
              <span>복사하기</span>
            </>
          )}
        </button>
        {canRegenerate && (
          <button
            type="button"
            onClick={onRegenerateClick}
            disabled={isRegenerating}
            className={`flex items-center gap-1.5 rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors ${
              isRegenerating
                ? 'cursor-not-allowed opacity-50'
                : 'lg:hover:bg-grey-10 lg:hover:text-grey-100'
            }`}
            aria-label="노트 재생성"
          >
            <RegenerateIcon spinning={isRegenerating} />
            <span>{isRegenerating ? '재생성 중...' : '노트 재생성'}</span>
          </button>
        )}
      </div>
    );
  }

  const showInlineEditCopy = variant === 'mobile-inline';
  const showMenuEditCopy = variant === 'mobile-kebab';

  return (
    <div className="flex items-center gap-2">
      {showInlineEditCopy && canEdit && (
        <button
          type="button"
          onClick={onEditStart}
          disabled={isRegenerating}
          className="rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
        >
          편집
        </button>
      )}
      {showInlineEditCopy && (
        <button
          type="button"
          onClick={onCopyAll}
          className="flex items-center gap-1.5 rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
        >
          <CopyIcon size={20} /> 복사하기
        </button>
      )}
      <button
        type="button"
        className="rounded-lg p-2 text-grey-60 transition-colors lg:hover:bg-grey-20 lg:hover:text-grey-80"
        onClick={() => setIsMenuOpen(true)}
        aria-label="추가 메뉴"
      >
        <MoreVerticalIcon size={20} />
      </button>
      <Modal
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        mobileVariant="bottomSheet"
      >
        <div className="mb-16 w-full space-y-1">
          {showMenuEditCopy && canEdit && (
            <button
              onClick={() => {
                onEditStart();
                setIsMenuOpen(false);
              }}
              disabled={isRegenerating}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
            >
              <span className="text-l text-grey-100">편집</span>
              <ChevronRightIcon size={20} className="text-grey-70" />
            </button>
          )}
          {showMenuEditCopy && (
            <button
              onClick={() => {
                onCopyAll();
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
            >
              <span className="text-l text-grey-100">복사하기</span>
              <ChevronRightIcon size={20} className="text-grey-70" />
            </button>
          )}
          {canRegenerate && (
            <button
              onClick={() => {
                onRegenerateClick();
                setIsMenuOpen(false);
              }}
              disabled={isRegenerating}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors disabled:opacity-50 lg:hover:bg-surface"
            >
              <span className="text-l text-grey-100">
                {isRegenerating ? '재생성 중...' : '노트 재생성'}
              </span>
              <ChevronRightIcon size={20} className="text-grey-70" />
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
