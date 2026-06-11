import React from 'react';

import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

export type ModalMobileVariant = 'center' | 'bottomSheet' | 'fullScreen';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
  closeOnOverlay?: boolean;
  hideCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
  /** 모바일(<sm)에서의 모달 형태. 기본값 'center' */
  mobileVariant?: ModalMobileVariant;
  /** fullScreen에서 history 관리 비활성화 (중첩 모달에서 history 충돌 방지) */
  disableHistory?: boolean;
  /** 오버레이(딤 + 래퍼) className 오버라이드 — 팝오버 위에 띄우는 등 z-index 조정용 */
  overlayClassName?: string;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getVisibleFocusable(container: HTMLElement): HTMLElement[] {
  const all = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(all).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      (el.offsetWidth > 0 || el.offsetHeight > 0)
  );
}

/**
 * Modal - 접근 가능한 다이얼로그
 * 포커스 트랩(sentinel 방식), 백드롭 클릭 종료, ESC 키 지원
 *
 * mobileVariant:
 * - 'center': 기본 중앙 팝업 (PC와 동일)
 * - 'bottomSheet': 모바일에서 하단에서 올라오는 시트
 * - 'fullScreen': 모바일에서 전체 화면
 *
 * @example
 * <Modal open={isOpen} onOpenChange={setIsOpen} title="Title" mobileVariant="bottomSheet">Content</Modal>
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  initialFocusRef,
  closeOnOverlay = true,
  hideCloseButton = false,
  children,
  className,
  mobileVariant = 'center',
  disableHistory = false,
  overlayClassName,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  // 초기 포커스 설정 & 닫힐 때 포커스 복원
  React.useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (contentRef.current) {
          const first = getVisibleFocusable(contentRef.current)[0];
          first?.focus();
        }
      }, 0);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open, initialFocusRef]);

  // ESC 닫기 + 스크롤 잠금
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  // fullScreen 모달: history 기반 depth 처리 (모바일 뒤로 스와이프 지원)
  const isFullScreenDepth = mobileVariant === 'fullScreen' && !disableHistory;
  const historyPushedRef = React.useRef(false);
  const modalId = React.useId();
  const modalIdRef = React.useRef(modalId);
  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  React.useEffect(() => {
    if (!isFullScreenDepth) return;

    if (open) {
      const modalId = modalIdRef.current;
      window.history.pushState({ modalId }, '');
      historyPushedRef.current = true;

      const handlePopState = (_e: PopStateEvent) => {
        if (!historyPushedRef.current) return;
        // pop된 후 현재 state에 modalId가 있으면
        // → 아직 자기 또는 자기보다 위의 모달 entry가 남아있으므로 무시
        if (window.history.state?.modalId) return;
        historyPushedRef.current = false;
        onOpenChangeRef.current(false);
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (historyPushedRef.current) {
          historyPushedRef.current = false;
          window.history.back();
        }
      };
    }
  }, [open, isFullScreenDepth]);

  // Sentinel 포커스 핸들러: 모달 경계에 도달하면 반대쪽으로 순환
  const handleSentinelFocus = React.useCallback((position: 'start' | 'end') => {
    if (!contentRef.current) return;
    const focusable = getVisibleFocusable(contentRef.current);
    if (focusable.length === 0) return;

    if (position === 'start') {
      focusable[focusable.length - 1].focus();
    } else {
      focusable[0].focus();
    }
  }, []);

  // 바텀시트 드래그 닫기
  const dragStartY = React.useRef<number | null>(null);
  const dragCurrentY = React.useRef<number>(0);

  const handleDragStart = React.useCallback((clientY: number) => {
    dragStartY.current = clientY;
    dragCurrentY.current = 0;
    if (contentRef.current) {
      contentRef.current.style.transition = 'none';
    }
  }, []);

  const handleDragMove = React.useCallback((clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = clientY - dragStartY.current;
    dragCurrentY.current = Math.max(0, delta);
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${dragCurrentY.current}px)`;
    }
  }, []);

  const handleDragEnd = React.useCallback(() => {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform 0.2s ease-out';
      if (dragCurrentY.current > 80) {
        contentRef.current.style.transform = 'translateY(100%)';
        setTimeout(() => onOpenChange(false), 200);
      } else {
        contentRef.current.style.transform = 'translateY(0)';
      }
    }
    dragCurrentY.current = 0;
  }, [onOpenChange]);

  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    [handleDragStart]
  );
  const handleTouchMove = React.useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    [handleDragMove]
  );
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientY);
      const onMouseMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
      const onMouseUp = () => {
        handleDragEnd();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [handleDragStart, handleDragMove, handleDragEnd]
  );

  if (!open) return null;

  // 모바일 variant별 wrapper/content 스타일
  const wrapperClass = cn(
    'fixed inset-0 z-modal',
    // center (기본): PC와 동일
    mobileVariant === 'center' && 'flex items-center justify-center p-4',
    // bottomSheet: 모바일/태블릿에서 하단 정렬, lg 이상에서는 center
    mobileVariant === 'bottomSheet' &&
      'flex items-end lg:items-center lg:justify-center lg:p-4',
    // fullScreen: 모바일/태블릿에서 전체 화면, lg 이상에서는 center
    mobileVariant === 'fullScreen' &&
      'flex items-stretch lg:items-center lg:justify-center lg:p-4',
    overlayClassName
  );

  const contentClass = cn(
    'relative z-10',
    'bg-surface',

    // center: 항상 센터 팝업
    mobileVariant === 'center' && [
      'overflow-auto',
      'max-h-[80vh] w-full',
      'border-default rounded-lg shadow-prominent',
      'animate-scaleIn',
      'px-6 py-4',
    ],

    // bottomSheet: 모바일/태블릿에서 바텀시트(콘텐츠 높이, 최대 80vh), lg+ 에서 center
    mobileVariant === 'bottomSheet' && [
      // 모바일/태블릿: 하단 시트 - 콘텐츠에 맞게 높이 조정, 최대 80vh
      'flex flex-col overflow-hidden',
      'max-h-[80vh] w-full',
      'rounded-t-2xl border-x-2 border-t-2 border-border shadow-prominent',
      'animate-slideUpFull',
      'px-6 pt-4',
      // lg+: 센터 팝업 (overflow-auto로 복원)
      'lg:max-h-[90vh] lg:max-w-lg',
      'lg:overflow-auto',
      'lg:rounded-lg lg:border-2',
      'lg:animate-scaleIn',
      'lg:pb-4',
    ],

    // fullScreen: 모바일/태블릿에서 전체 화면(좌측 슬라이드), lg+ 에서 center
    mobileVariant === 'fullScreen' && [
      // 모바일/태블릿: 풀스크린 - 좌측에서 슬라이드
      'overflow-auto',
      'h-full w-full',
      'animate-slideInFromLeft',
      // lg+: 센터 팝업
      'lg:h-auto lg:max-h-[90vh] lg:w-auto lg:max-w-lg',
      'lg:rounded-lg lg:border-2 lg:border-border lg:shadow-prominent',
      'lg:animate-scaleIn',
      'lg:px-6 lg:py-4',
    ],

    className
  );

  return createPortal(
    <div className={wrapperClass}>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-overlay-bg backdrop-blur-sm',
          mobileVariant === 'fullScreen'
            ? 'hidden lg:block lg:animate-[fadeIn_0.2s_ease-out]'
            : 'animate-fadeIn'
        )}
        onClick={() => closeOnOverlay && onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Focus trap: start sentinel */}
      <span
        tabIndex={0}
        role="button"
        onFocus={() => handleSentinelFocus('start')}
        aria-hidden="true"
        style={{ position: 'fixed', opacity: 0, pointerEvents: 'none' }}
      />

      {/* Content */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={contentClass}
      >
        {/* Bottom sheet handle (드래그로 닫기 지원) */}
        {mobileVariant === 'bottomSheet' && (
          <div
            role="presentation"
            className="mb-3 flex cursor-grab justify-center py-1 active:cursor-grabbing lg:hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
        )}

        {/* fullScreen 모바일 닫기 버튼 */}
        {mobileVariant === 'fullScreen' && !hideCloseButton && (
          <div className="mb-4 flex items-center lg:hidden">
            <button
              onClick={() => onOpenChange(false)}
              aria-label="닫기"
              className="typo-sm flex items-center gap-1.5 text-fg-muted lg:hover:text-fg"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              닫기
            </button>
          </div>
        )}

        {/* Header */}
        {(title || description) && (
          <>
            {title && (
              <h2 id="modal-title" className="typo-xl-emphasize text-fg">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="typo-sm mt-1 text-fg-muted">
                {description}
              </p>
            )}
            <div className="mb-3 border-b border-border pt-3" />
          </>
        )}

        {/* Body */}
        {mobileVariant === 'bottomSheet' ? (
          <div className="flex-1 overflow-y-auto overscroll-contain pb-6 lg:overflow-visible lg:pb-0">
            {children}
          </div>
        ) : (
          children
        )}

        {/* Close button (bottomSheet는 핸들 드래그로 닫기 지원하므로 숨김) */}
        {!hideCloseButton && mobileVariant !== 'bottomSheet' && (
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className={cn(
              'absolute right-4 top-4',
              'rounded-sm p-1',
              'text-fg-muted lg:hover:bg-surface-contrast lg:hover:text-fg',
              'transition-default',
              'focus-default'
            )}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Focus trap: end sentinel */}
      <span
        tabIndex={0}
        role="button"
        onFocus={() => handleSentinelFocus('end')}
        aria-hidden="true"
        style={{ position: 'fixed', opacity: 0, pointerEvents: 'none' }}
      />
    </div>,
    document.body
  );
};

Modal.displayName = 'Modal';
