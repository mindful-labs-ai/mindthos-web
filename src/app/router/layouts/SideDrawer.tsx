import React from 'react';

import { cn } from '@/lib/cn';
import { ChevronLeftIcon } from '@/shared/icons';

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
        'fixed inset-0 z-overlay transition-visibility',
        open ? 'visible' : 'invisible'
      )}
    >
      {/* Backdrop - blur + dim */}
      <div
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <aside
        className={cn(
          'absolute inset-y-0 left-0 flex w-64 max-w-[80vw] flex-col bg-bg shadow-xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer header with close button */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <button
            onClick={() =>
              window.location.assign('/')
            }
            className="flex items-center gap-2 rounded hover:opacity-80"
          >
            <img
              src="/title_mindthos_logo.png"
              alt="마음토스"
              className="h-6 w-auto antialiased"
              draggable="false"
            />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-lg border border-border p-1.5 text-fg-muted transition-colors hover:bg-surface-contrast"
            aria-label="메뉴 닫기"
          >
            <ChevronLeftIcon size={20} />
          </button>
        </div>

        {/* Drawer body - SideTab content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </aside>
    </div>
  );
};
