/**
 * 모바일 축어록 툴바 컴포넌트
 * 케밥 메뉴 → 바텀시트로 편집/복사/익명화/자동스크롤 제공
 */

import React from 'react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import {
  ChevronRightIcon,
  CopyIcon,
  DeidentificationIcon,
} from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Modal } from '@/shared/ui/composites/Modal';
import { useSessionStore } from '@/stores/sessionStore';

interface MobileTranscriptToolbarProps {
  isReadOnly: boolean;
  isEditing: boolean;
  isAnonymized: boolean;
  enableTimestampFeatures: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  onToggleAnonymized: () => void;
  onEditStart: () => void;
  onCopy: () => void;
  onDeidentify?: () => void;
  showDeid?: boolean;
  hasActivatedDeid?: boolean;
}

export const MobileTranscriptToolbar: React.FC<MobileTranscriptToolbarProps> =
  React.memo(
    ({
      isReadOnly,
      isEditing,
      isAnonymized,
      enableTimestampFeatures,
      isMenuOpen,
      setIsMenuOpen,
      onToggleAnonymized,
      onEditStart,
      onCopy,
      onDeidentify,
      showDeid = false,
      hasActivatedDeid = false,
    }) => {
      const { isTablet } = useDevice();
      const showUtteranceIndex = useSessionStore(
        (state) => state.showUtteranceIndex
      );
      const setShowUtteranceIndex = useSessionStore(
        (state) => state.setShowUtteranceIndex
      );

      // 케밥 메뉴 아이콘
      const kebabIcon = (
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
      );

      return (
        <div
          className={cn(
            'pointer-events-none sticky top-0 z-10 flex w-full select-none justify-end',
            !isEditing && !isReadOnly && '-mb-[38px]'
          )}
        >
          <div className="pointer-events-auto flex select-none items-center gap-2 overflow-hidden px-2 pt-4">
            {
              isReadOnly ? (
                <Badge tone="warning" variant="soft" size="sm">
                  예시 - 읽기 전용
                </Badge>
              ) : !isEditing ? (
                <>
                  {/* 태블릿: 편집/복사 인라인 + 케밥 메뉴  */}
                  {isTablet && (
                    <>
                      <button
                        type="button"
                        onClick={onEditStart}
                        className="rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                      >
                        편집
                      </button>
                      <button
                        type="button"
                        onClick={onCopy}
                        className="flex items-center gap-1.5 rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                      >
                        <CopyIcon size={20} /> 복사하기
                      </button>
                      {onDeidentify && (
                        <button
                          type="button"
                          className={`flex items-center gap-1.5 rounded-md border bg-white px-3.5 py-1 text-m font-medium transition-colors ${
                            !hasActivatedDeid
                              ? 'border-green-80 text-green-80 lg:hover:opacity-80'
                              : showDeid
                                ? 'border-orange-100 text-orange-100 lg:hover:opacity-80'
                                : 'border border-grey-30 text-grey-70 lg:hover:bg-grey-10 lg:hover:text-grey-100'
                          }`}
                          onClick={onDeidentify}
                          aria-label="축어록 비식별화"
                        >
                          <DeidentificationIcon />
                          {!hasActivatedDeid
                            ? '비식별화 하기'
                            : showDeid
                              ? '비식별화 ON'
                              : '비식별화 OFF'}
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    className="rounded-lg p-2 text-grey-60 transition-colors lg:hover:bg-grey-20 lg:hover:text-grey-80"
                    title="메뉴"
                    aria-label="추가 메뉴"
                    onClick={() => setIsMenuOpen(true)}
                  >
                    {kebabIcon}
                  </button>
                  <Modal
                    open={isMenuOpen}
                    onOpenChange={setIsMenuOpen}
                    mobileVariant="bottomSheet"
                  >
                    <div className="mb-16 w-full space-y-1">
                      {!isTablet && (
                        <button
                          onClick={() => {
                            onEditStart();
                            setIsMenuOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                        >
                          <span className="text-l text-grey-100">편집</span>
                          <ChevronRightIcon
                            size={20}
                            className="text-grey-70"
                          />
                        </button>
                      )}
                      {!isTablet && (
                        <button
                          onClick={() => {
                            onCopy();
                            setIsMenuOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                        >
                          <span className="text-l text-grey-100">복사하기</span>
                          <ChevronRightIcon
                            size={20}
                            className="text-grey-70"
                          />
                        </button>
                      )}
                      {!isTablet && onDeidentify && !hasActivatedDeid && (
                        <button
                          onClick={() => {
                            onDeidentify();
                            setIsMenuOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                        >
                          <span className="text-l text-grey-100">
                            비식별화 하기
                          </span>
                          <ChevronRightIcon
                            size={20}
                            className="text-grey-70"
                          />
                        </button>
                      )}
                      {!isTablet && onDeidentify && hasActivatedDeid && (
                        <button
                          onClick={() => {
                            onDeidentify();
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                        >
                          <span className="text-l text-orange-100">
                            비식별화 활성화
                          </span>
                          <div
                            className={`relative h-[26px] w-[46px] rounded-full border transition-colors ${
                              showDeid
                                ? 'border-green-80/30 bg-green-80'
                                : 'border-grey-40 bg-grey-30'
                            }`}
                          >
                            <div
                              className={`absolute top-[2px] h-[20px] w-[20px] rounded-full border border-white bg-white shadow transition-transform ${
                                showDeid
                                  ? 'translate-x-[22px]'
                                  : '!bg-grey-50 translate-x-[2px]'
                              }`}
                            />
                          </div>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onToggleAnonymized();
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                      >
                        <span className="text-l text-grey-100">
                          참석자 가리기
                        </span>
                        <div
                          className={`relative h-[26px] w-[46px] rounded-full border transition-colors ${
                            isAnonymized
                              ? 'border-green-80/30 bg-green-80'
                              : 'border-grey-40 bg-grey-30'
                          }`}
                        >
                          <div
                            className={`absolute top-[2px] h-[20px] w-[20px] rounded-full border border-white bg-white shadow transition-transform ${
                              isAnonymized
                                ? 'translate-x-[22px]'
                                : '!bg-grey-50 translate-x-[2px]'
                            }`}
                          />
                        </div>
                      </button>
                      {enableTimestampFeatures && (
                        <button
                          onClick={() => {
                            setShowUtteranceIndex(!showUtteranceIndex);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                        >
                          <span className="text-l text-grey-100">
                            타임스탬프 가리기
                          </span>
                          <div
                            className={`relative h-[26px] w-[46px] rounded-full border transition-colors ${
                              showUtteranceIndex
                                ? 'border-green-80/30 bg-green-80'
                                : 'border-grey-40 bg-grey-30'
                            }`}
                          >
                            <div
                              className={`absolute top-[2px] h-[20px] w-[20px] rounded-full border border-white bg-white shadow transition-transform ${
                                showUtteranceIndex
                                  ? 'translate-x-[22px]'
                                  : '!bg-grey-50 translate-x-[2px]'
                              }`}
                            />
                          </div>
                        </button>
                      )}
                      {enableTimestampFeatures && (
                        <button
                          onClick={() => {
                            const store = useSessionStore.getState();
                            store.setAutoScrollEnabled(
                              !store.autoScrollEnabled
                            );
                            setIsMenuOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                        >
                          <span className="text-l text-grey-100">
                            {useSessionStore.getState().autoScrollEnabled
                              ? '자동 스크롤 끄기'
                              : '자동 스크롤 켜기'}
                          </span>
                          <ChevronRightIcon
                            size={20}
                            className="text-grey-70"
                          />
                        </button>
                      )}
                    </div>
                  </Modal>
                </>
              ) : hasActivatedDeid ? (
                <span className="rounded-md bg-white px-1 py-0.5 text-red-50 opacity-75">
                  비식별화 되어 있는 항목은 주황색으로 표시돼요.
                </span>
              ) : null /* 편집 모드: 버튼 숨기되 wrapper 유지 */
            }
          </div>
        </div>
      );
    }
  );

MobileTranscriptToolbar.displayName = 'MobileTranscriptToolbar';
