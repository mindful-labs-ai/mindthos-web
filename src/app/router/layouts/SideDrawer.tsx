import React from 'react';

import { cn } from '@/lib/cn';
import { BackButton } from '@/shared/ui/atoms/BackButton';

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * 모바일/태블릿용 사이드 드로어
 * - 좌측에서 슬라이드 인/아웃
 * - 배경 blur + dim 처리
 * - 외부 클릭 시 닫힘
 */
export const SideDrawer: React.FC<SideDrawerProps> = ({
  open,
  onClose,
  children,
}) => {
  // ESC 키로 닫기
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // 열려있을 때 body 스크롤 방지
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  return (
    <div
      className={cn(
        'transition-visibility fixed inset-0 z-overlay',
        open ? 'visible' : 'invisible'
      )}
    >
      {/* Backdrop - blur + dim */}
      <div
        className={cn(
          'absolute inset-0 bg-overlay-bg backdrop-blur-sm transition-opacity duration-slow',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <aside
        className={cn(
          'absolute inset-y-0 left-0 flex w-sidetab flex-col bg-sidebar-bg px-5 shadow-prominent transition-transform duration-slow ease-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer header with close button */}
        <div className="flex h-header w-full items-center justify-between border-b border-sidebar-border">
          <button
            onClick={() => window.location.assign('/')}
            className="main-logo-mobile-size items-center gap-2"
          >
            <img
              src="/title_mindthos_logo.png"
              alt="마음토스"
              className="h-6 w-full object-cover antialiased"
              draggable="false"
            />
          </button>
          <BackButton onClick={onClose} aria-label="메뉴 닫기" />
        </div>

        {/* Drawer body - SideTab content */}
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
};
