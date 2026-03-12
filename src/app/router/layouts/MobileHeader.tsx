import React from 'react';

import { useLocation } from 'react-router-dom';

import { MenuIcon, PlusIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';

import { getRouteLabel } from '../navigationConfig';

interface MobileHeaderProps {
  onMenuOpen: () => void;
  onNewSession: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onMenuOpen,
  onNewSession,
}) => {
  const location = useLocation();

  const pageTitle = React.useMemo(() => {
    const pathname = location.pathname;
    if (pathname === '/') return '홈';
    // /clients/:id, /sessions/:id 등 상세 페이지는 상위 경로 라벨 사용
    const basePath = '/' + pathname.split('/').filter(Boolean)[0];
    return getRouteLabel(basePath);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-header flex h-14 items-center justify-between border-b border-border bg-bg px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex items-center justify-center rounded-lg border border-border p-1.5 text-fg-muted transition-colors hover:bg-surface-contrast"
          aria-label="메뉴 열기"
        >
          <MenuIcon size={20} />
        </button>
        <span className="text-base font-medium text-fg">{pageTitle}</span>
      </div>

      <Button
        tone="primary"
        variant="outline"
        size="sm"
        icon={<PlusIcon size={16} />}
        onClick={onNewSession}
      >
        새 상담 기록
      </Button>
    </header>
  );
};
