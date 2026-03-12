import React from 'react';

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
  const isFullScreenDepth = mobileVariant === 'fullScreen';
  const historyPushedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isFullScreenDepth) return;

    if (open) {
      // 모달 열릴 때 history에 state 추가
      window.history.pushState({ modalDepth: true }, '');
      historyPushedRef.current = true;

      const handlePopState = (_e: PopStateEvent) => {
        // 뒤로가기 시 모달 닫기
        if (historyPushedRef.current) {
          historyPushedRef.current = false;
          onOpenChange(false);
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        // 모달이 프로그래밍적으로 닫힐 때 (뒤로가기가 아닌 경우) history 정리
        if (historyPushedRef.current) {
          historyPushedRef.current = false;
          window.history.back();
        }
      };
    }
  }, [open, isFullScreenDepth, onOpenChange]);

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

  if (!open) return null;

  // 모바일 variant별 wrapper/content 스타일
  const wrapperClass = cn(
    'fixed inset-0 z-50',
    // center (기본): PC와 동일
    mobileVariant === 'center' && 'flex items-center justify-center p-4',
    // bottomSheet: 모바일에서 하단 정렬, sm 이상에서는 center
    mobileVariant === 'bottomSheet' &&
      'flex items-end sm:items-center sm:justify-center sm:p-4',
    // fullScreen: 모바일에서 전체 화면, sm 이상에서는 center
    mobileVariant === 'fullScreen' &&
      'flex items-stretch sm:items-center sm:justify-center sm:p-4'
  );

  const contentClass = cn(
    'relative z-10',
    'bg-surface',

    // center: 항상 센터 팝업
    mobileVariant === 'center' && [
      'overflow-auto',
      'max-h-[90vh] w-full',
      'rounded-[var(--radius-lg)] border-2 border-border shadow-xl',
      'animate-scaleIn',
      'px-6 py-4',
    ],

    // bottomSheet: 모바일에서 바텀시트(고정 40vh, 내부 스크롤), sm+ 에서 center
    mobileVariant === 'bottomSheet' && [
      // 모바일: 하단 시트 - 고정 높이, flex column, overflow hidden (내부 스크롤)
      'flex flex-col overflow-hidden',
      'h-[40vh] w-full',
      'rounded-t-2xl border-x-2 border-t-2 border-border shadow-xl',
      'animate-slideUpFull',
      'px-6 pt-4',
      // sm+: 센터 팝업 (overflow-auto로 복원)
      'sm:h-auto sm:max-h-[90vh] sm:max-w-lg',
      'sm:overflow-auto',
      'sm:rounded-[var(--radius-lg)] sm:border-2',
      'sm:animate-scaleIn',
      'sm:pb-4',
    ],

    // fullScreen: 모바일에서 전체 화면(좌측 슬라이드), sm+ 에서 center
    mobileVariant === 'fullScreen' && [
      // 모바일: 풀스크린 - 좌측에서 슬라이드
      'overflow-auto',
      'h-full w-full',
      'animate-slideInFromLeft',
      'px-4 py-4',
      // sm+: 센터 팝업
      'sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-lg',
      'sm:rounded-[var(--radius-lg)] sm:border-2 sm:border-border sm:shadow-xl',
      'sm:animate-scaleIn',
      'sm:px-6',
    ],

    className
  );

  return (
    <div className={wrapperClass}>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm',
          mobileVariant === 'fullScreen'
            ? 'hidden sm:block sm:animate-[fadeIn_0.2s_ease-out]'
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
        {/* Bottom sheet handle */}
        {mobileVariant === 'bottomSheet' && (
          <div className="mb-3 flex justify-center sm:hidden">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
        )}

        {/* fullScreen 모바일 닫기 버튼 */}
        {mobileVariant === 'fullScreen' && !hideCloseButton && (
          <div className="mb-4 flex items-center sm:hidden">
            <button
              onClick={() => onOpenChange(false)}
              aria-label="닫기"
              className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
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
              <h2 id="modal-title" className="text-xl font-semibold text-fg">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="mt-1 text-sm text-fg-muted">
                {description}
              </p>
            )}
            <div className="mb-3 border-b border-border pt-3" />
          </>
        )}

        {/* Body */}
        {mobileVariant === 'bottomSheet' ? (
          <div className="flex-1 overflow-y-auto overscroll-contain pb-6 sm:overflow-visible sm:pb-0">
            {children}
          </div>
        ) : (
          children
        )}

        {/* Close button */}
        {!hideCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className={cn(
              'absolute right-4 top-4',
              'rounded-[var(--radius-sm)] p-1',
              'text-fg-muted hover:bg-surface-contrast hover:text-fg',
              'transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              mobileVariant === 'bottomSheet' && 'top-5 sm:top-4'
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
    </div>
  );
};

Modal.displayName = 'Modal';
