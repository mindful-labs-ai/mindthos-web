import React from 'react';

import { useLocation } from 'react-router-dom';

import { MenuIcon, PlusIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { useModalStore } from '@/stores/modalStore';

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
    <header className="h-header border-header-border bg-header-bg sticky top-0 z-header flex items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          className="transition-default flex size-8 items-center justify-center rounded-md border border-border p-1.5 text-fg-muted"
          aria-label="메뉴 열기"
        >
          <MenuIcon size={24} />
        </button>
        <span className="typo-m text-fg">{pageTitle}</span>
      </div>

      {location.pathname === '/clients' ? (
        <Button
          tone="primary"
          variant="solid"
          size="md"
          onClick={() => useModalStore.getState().openModal('addClient')}
          className="truncate"
        >
          클라이언트 추가하기
        </Button>
      ) : (
        <Button
          tone="primary"
          variant="outline"
          size="md"
          icon={<PlusIcon size={16} />}
          onClick={onNewSession}
          className="truncate"
        >
          새 상담 기록
        </Button>
      )}
    </header>
  );
};
