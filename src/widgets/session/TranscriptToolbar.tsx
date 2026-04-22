/**
 * 데스크톱 축어록 툴바 컴포넌트
 * 편집/저장/취소/복사/메뉴 버튼을 포함
 */

import React from 'react';

import { CopyIcon } from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { PopUp } from '@/shared/ui/composites/PopUp';
import { useSessionStore } from '@/stores/sessionStore';

interface TranscriptToolbarProps {
  /** 읽기 전용 여부 */
  isReadOnly: boolean;
  /** 편집 중 여부 */
  isEditing: boolean;
  /** 익명화 모드 여부 */
  isAnonymized: boolean;
  /** 타임스탬프 기능 활성화 여부 */
  enableTimestampFeatures: boolean;
  /** 메뉴 열림 상태 */
  isMenuOpen: boolean;
  /** 메뉴 열림 상태 변경 핸들러 */
  setIsMenuOpen: (open: boolean) => void;
  /** 익명화 토글 핸들러 */
  onToggleAnonymized: () => void;
  /** 편집 시작 핸들러 */
  onEditStart: () => void;
  /** 편집 저장 핸들러 */
  onSaveEdit: () => void;
  /** 편집 취소 핸들러 */
  onCancelEdit: () => void;
  /** 복사 핸들러 */
  onCopy: () => void;
}

export const TranscriptToolbar: React.FC<TranscriptToolbarProps> = React.memo(
  ({
    isReadOnly,
    isEditing,
    isAnonymized,
    enableTimestampFeatures,
    isMenuOpen,
    setIsMenuOpen,
    onToggleAnonymized,
    onEditStart,
    onSaveEdit,
    onCancelEdit,
    onCopy,
  }) => {
    const sharedMenuItems = (
      <>
        <button
          onClick={() => {
            onToggleAnonymized();
            setIsMenuOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors lg:hover:bg-surface"
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
            {isAnonymized ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
          <span className="typo-sm text-fg">
            {isAnonymized ? '참석자 가리기 해제' : '참석자 가리기'}
          </span>
        </button>
        {enableTimestampFeatures && (
          <button
            onClick={() => {
              const store = useSessionStore.getState();
              store.setAutoScrollEnabled(!store.autoScrollEnabled);
              setIsMenuOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors lg:hover:bg-surface"
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
              {useSessionStore.getState().autoScrollEnabled ? (
                <>
                  <path d="M12 5v14" />
                  <path d="M19 12l-7 7-7-7" />
                </>
              ) : (
                <>
                  <path d="M12 5v14" />
                  <path d="M19 12l-7 7-7-7" />
                  <line x1="4" y1="4" x2="20" y2="20" />
                </>
              )}
            </svg>
            <span className="typo-sm text-fg">
              {useSessionStore.getState().autoScrollEnabled
                ? '자동 스크롤 끄기'
                : '자동 스크롤 켜기'}
            </span>
          </button>
        )}
      </>
    );

    const menuContent = (
      <div className="w-full space-y-1">{sharedMenuItems}</div>
    );

    return (
      <div className="absolute inset-x-0 right-4 top-0 z-10 flex w-full select-none justify-end">
        <div className="flex select-none items-center gap-2 overflow-hidden px-2 pt-4">
          {isReadOnly ? (
            <Badge tone="warning" variant="soft" size="sm">
              예시 - 읽기 전용
            </Badge>
          ) : isEditing ? (
            <>
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-m font-medium text-primary-fg transition-colors lg:hover:opacity-80"
                onClick={onSaveEdit}
              >
                편집 완료
              </button>
              <button
                type="button"
                className="lg:hover:bg-surface-hover typo-sm rounded-lg bg-surface px-4 py-2 font-medium text-fg transition-colors"
                onClick={onCancelEdit}
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                onClick={onEditStart}
                title="편집"
              >
                편집
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                onClick={onCopy}
                title="복사"
                aria-label="축어록 복사"
              >
                <CopyIcon size={20} /> 복사하기
              </button>
              <div className="inline-block">
                <PopUp
                  open={isMenuOpen}
                  onOpenChange={setIsMenuOpen}
                  placement="bottom-left"
                  trigger={
                    <button
                      type="button"
                      className="rounded-lg p-2 text-fg-muted transition-colors lg:hover:bg-surface lg:hover:text-fg"
                      title="메뉴"
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
                  }
                  content={<div className="w-[200px]">{menuContent}</div>}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

TranscriptToolbar.displayName = 'TranscriptToolbar';
