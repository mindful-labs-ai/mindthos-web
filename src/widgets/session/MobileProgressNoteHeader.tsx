/**
 * 모바일 상담노트 헤더
 * sticky 헤더 + 케밥 메뉴 → 바텀시트 (편집/복사/재생성)
 * 편집 시에는 compact-nav 헤더에서 저장/취소 처리
 */

import React, { useState } from 'react';

import { ChevronRightIcon, CopyIcon } from '@/shared/icons';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';

interface MobileProgressNoteHeaderProps {
  title: string;
  isEditing: boolean;
  isReadOnly: boolean;
  isRegenerating: boolean;
  canEdit: boolean;
  canRegenerate: boolean;
  onEditStart: () => void;
  onCopyAll: () => void;
  onRegenerateClick: () => void;
}

export const MobileProgressNoteHeader: React.FC<
  MobileProgressNoteHeaderProps
> = ({
  title,
  isEditing,
  isReadOnly,
  isRegenerating,
  canEdit,
  canRegenerate,
  onEditStart,
  onCopyAll,
  onRegenerateClick,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-10 mb-6 flex items-center justify-between bg-surface px-4 py-2">
      <Title as="h2" className="typo-m font-headline text-fg-muted">
        {title}
      </Title>
      <div className="flex items-center gap-2">
        {!isEditing && (
          <>
            <button
              type="button"
              className="rounded-lg p-2 text-fg-muted transition-colors lg:hover:bg-surface lg:hover:text-fg"
              onClick={() => setIsMenuOpen(true)}
              aria-label="추가 메뉴"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            <Modal
              open={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              mobileVariant="bottomSheet"
            >
              <div className="w-full space-y-1">
                {canEdit && !isReadOnly && (
                  <button
                    onClick={() => {
                      onEditStart();
                      setIsMenuOpen(false);
                    }}
                    disabled={isRegenerating}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors lg:hover:bg-surface"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-fg-muted"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span className="typo-m text-fg">편집</span>
                    <ChevronRightIcon size={20} className="text-grey-70" />
                  </button>
                )}
                <button
                  onClick={() => {
                    onCopyAll();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors lg:hover:bg-surface"
                >
                  <CopyIcon size={18} className="text-fg-muted" />
                  <span className="typo-m text-fg">복사하기</span>
                  <ChevronRightIcon size={20} className="text-grey-70" />
                </button>
                {canRegenerate && (
                  <button
                    onClick={() => {
                      onRegenerateClick();
                      setIsMenuOpen(false);
                    }}
                    disabled={isReadOnly || isRegenerating}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors disabled:opacity-50 lg:hover:bg-surface"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="text-fg-muted"
                    >
                      <path
                        d="M8.33447 13.3333H4.16781V17.5M11.6678 6.66667H15.8345V2.5M3.82031 7.50284C4.28755 6.34638 5.06984 5.3442 6.07826 4.61019C7.08669 3.87618 8.28185 3.4396 9.52593 3.35042C10.77 3.26125 12.0134 3.52284 13.1162 4.10551C14.219 4.68819 15.1355 5.56878 15.7629 6.64677M16.1824 12.4976C15.7152 13.654 14.9329 14.6562 13.9245 15.3902C12.9161 16.1242 11.7221 16.5602 10.478 16.6494C9.23395 16.7386 7.98953 16.477 6.88672 15.8944C5.78391 15.3117 4.86682 14.4313 4.23942 13.3533"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="typo-m text-fg">
                      {isRegenerating ? '재생성 중...' : '노트 재생성'}
                    </span>
                    <ChevronRightIcon size={20} className="text-grey-70" />
                  </button>
                )}
              </div>
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};
