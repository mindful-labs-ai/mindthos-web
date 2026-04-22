/**
 * 모바일 직접 입력 세션 툴바 컴포넌트
 * 태블릿: 편집/복사 인라인 + 케밥 메뉴 없음
 * 모바일: 케밥 → 바텀시트 (편집/복사)
 */

import React from 'react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { ChevronRightIcon, CopyIcon } from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Modal } from '@/shared/ui/composites/Modal';

interface MobileHandwrittenToolbarProps {
  isReadOnly: boolean;
  isEditing: boolean;
  onEditStart: () => void;
  onCopy: () => void;
}

export const MobileHandwrittenToolbar: React.FC<MobileHandwrittenToolbarProps> =
  React.memo(({ isReadOnly, isEditing, onEditStart, onCopy }) => {
    const { isTablet } = useDevice();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
          !isEditing && !isReadOnly && '-mb-10'
        )}
      >
        <div className="pointer-events-auto flex select-none items-center gap-2 overflow-hidden px-2 pt-4">
          {isReadOnly ? (
            <Badge tone="warning" variant="soft" size="sm">
              예시 - 읽기 전용
            </Badge>
          ) : !isEditing ? (
            <>
              {/* 태블릿: 편집/복사 인라인 */}
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
                </>
              )}
              {/* 모바일: 케밥 메뉴 */}
              {!isTablet && (
                <>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-grey-60 transition-colors lg:hover:bg-grey-20 lg:hover:text-grey-80"
                    onClick={() => setIsMenuOpen(true)}
                    aria-label="추가 메뉴"
                  >
                    {kebabIcon}
                  </button>
                  <Modal
                    open={isMenuOpen}
                    onOpenChange={setIsMenuOpen}
                    mobileVariant="bottomSheet"
                  >
                    <div className="mb-16 w-full space-y-1">
                      <button
                        onClick={() => {
                          onEditStart();
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                      >
                        <span className="text-l text-grey-100">편집</span>
                        <ChevronRightIcon size={20} className="text-grey-70" />
                      </button>
                      <button
                        onClick={() => {
                          onCopy();
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                      >
                        <span className="text-l text-grey-100">복사하기</span>
                        <ChevronRightIcon size={20} className="text-grey-70" />
                      </button>
                    </div>
                  </Modal>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
  });

MobileHandwrittenToolbar.displayName = 'MobileHandwrittenToolbar';
