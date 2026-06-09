import React from 'react';

import { useLocation } from 'react-router-dom';

import { cn } from '@/lib/cn';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Edit3Icon, PlusIcon, SideLockIcon, UploadIcon } from '@/shared/icons';
import { Text } from '@/shared/ui';
import { PopUp } from '@/shared/ui/composites/PopUp';
import { useModalStore } from '@/stores/modalStore';
import { CreateHandWrittenSessionModal } from '@/widgets/session/CreateHandWrittenSessionModal';

import {
  AI_ANALYSIS_ITEMS,
  SESSION_MANAGEMENT_ITEMS,
  getNavValueFromPath,
  getPathFromNavValue,
} from '../navigationConfig';

interface NavItemProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  badge?: 'beta' | 'comingSoon';
  disabled?: boolean;
  isActive: boolean;
  onSelect: (value: string) => void;
  onDisabledClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  value,
  badge,
  disabled,
  isActive,
  onSelect,
  onDisabledClick,
}) => {
  const handleClick = () => {
    if (disabled) {
      onDisabledClick?.();
    } else {
      onSelect(value);
    }
  };

  return (
    <button
      data-value={value}
      type="button"
      onClick={handleClick}
      className={cn('nav-content', isActive ? 'active-nav' : 'inactive-nav')}
    >
      <div className="flex items-center gap-3">
        {icon && <span className={cn('flex-shrink-0')}>{icon}</span>}
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {disabled && (
            <SideLockIcon size={14} className="text-nav-inactive-text" />
          )}
        </div>
      </div>
      {badge && (
        <span
          className={cn(
            'rounded-md px-1 py-0.5 text-xs font-bold',
            badge === 'beta'
              ? 'bg-primary text-primary-fg'
              : 'bg-nav-inactive-text text-surface'
          )}
        >
          {badge === 'beta' ? 'Beta' : '준비 중'}
        </span>
      )}
    </button>
  );
};

interface SideTabProps {
  /** 'sidebar' = 데스크탑 사이드바, 'drawer' = 모바일 드로어 내부 */
  variant?: 'sidebar' | 'drawer';
  /** 드로어에서 네비게이션 선택 후 닫기 콜백 */
  onNavSelect?: () => void;
}

export const SideTab: React.FC<SideTabProps> = ({
  variant = 'sidebar',
  onNavSelect,
}) => {
  const { navigateWithUtm } = useNavigateWithUtm();
  const location = useLocation();
  const [isNewRecordMenuOpen, setIsNewRecordMenuOpen] = React.useState(false);
  const [isHandWrittenModalOpen, setIsHandWrittenModalOpen] =
    React.useState(false);

  // 전역 모달 스토어 사용
  const openModal = useModalStore((state) => state.openModal);

  // 현재 경로에 따라 activeNav 자동 설정
  const activeNav: string = React.useMemo(() => {
    return getNavValueFromPath(location.pathname);
  }, [location.pathname]);

  const handleNavSelect = (value: string) => {
    const path = getPathFromNavValue(value);
    if (path) {
      navigateWithUtm(path);
      onNavSelect?.();
    }
  };

  const handleAudioUploadClick = () => {
    setIsNewRecordMenuOpen(false);
    openModal('createMultiSession');
    onNavSelect?.();
  };

  const handleDirectInputClick = () => {
    setIsNewRecordMenuOpen(false);
    setIsHandWrittenModalOpen(true);
    onNavSelect?.();
  };

  const isDrawer = variant === 'drawer';

  const content = (
    <>
      {/* Logo Section - 데스크탑 사이드바에서만 표시 */}
      {!isDrawer && (
        <div className="flex h-header w-full items-center justify-between border-b border-sidebar-border">
          <button
            onClick={() => navigateWithUtm('/')}
            className="main-logo-size items-center gap-2 lg:hover:opacity-80"
          >
            <img
              src="/title_mindthos_logo.png"
              alt="마음토스"
              className="h-6 w-full object-cover antialiased"
              draggable="false"
            />
          </button>
        </div>
      )}

      {/* New Session Button (with dropdown) - 드로어에서는 헤더에 있으므로 숨김 */}
      {!isDrawer && (
        <div className="new-session-padding">
          <PopUp
            open={isNewRecordMenuOpen}
            onOpenChange={setIsNewRecordMenuOpen}
            placement="bottom-right"
            trigger={
              <button
                className="focus-default inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md border border-green-80 bg-green-20 px-4 text-m font-medium text-primary transition-opacity lg:hover:opacity-75"
                onClick={async () => {
                  setIsNewRecordMenuOpen(!isNewRecordMenuOpen);
                }}
              >
                <PlusIcon size={18} />새 상담 기록
              </button>
            }
            content={
              <div className="w-[200px] space-y-1">
                <button
                  onClick={handleAudioUploadClick}
                  className="transition-default flex w-full items-center gap-3 rounded-lg px-4 py-3 lg:hover:bg-nav-hover-bg"
                >
                  <UploadIcon size={18} className="" />
                  <Text>녹음 파일 업로드</Text>
                </button>
                <button
                  onClick={handleDirectInputClick}
                  className="transition-default flex w-full items-center gap-3 rounded-lg px-4 py-3 lg:hover:bg-nav-hover-bg"
                >
                  <Edit3Icon size={18} className="" />
                  <Text>직접 입력하기</Text>
                </button>
              </div>
            }
            triggerClassName="w-full"
          />
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* 상담 관리 섹션 */}
        <div className="">
          <Text className="nav-label">상담 관리</Text>
          <nav className="flex flex-col gap-1">
            {SESSION_MANAGEMENT_ITEMS.map((item) => (
              <NavItem
                key={item.value}
                icon={item.icon}
                label={item.label}
                value={item.value}
                badge={item.badge}
                disabled={item.disabled}
                isActive={activeNav === item.value}
                onSelect={handleNavSelect}
                onDisabledClick={() =>
                  openModal('comingSoon', { source: `sidebar_${item.value}` })
                }
              />
            ))}
          </nav>
        </div>

        {/* AI 분석 섹션 */}
        <div>
          <Text className="nav-label">AI 분석</Text>
          <nav className="flex flex-col gap-1">
            {AI_ANALYSIS_ITEMS.map((item) => (
              <NavItem
                key={item.value}
                icon={item.icon}
                label={item.label}
                value={item.value}
                badge={item.badge}
                disabled={item.disabled}
                isActive={activeNav === item.value}
                onSelect={handleNavSelect}
                onDisabledClick={() =>
                  openModal('comingSoon', { source: `sidebar_${item.value}` })
                }
              />
            ))}
          </nav>
        </div>
      </div>

      {/* 직접 입력 세션 생성 모달 */}
      <CreateHandWrittenSessionModal
        open={isHandWrittenModalOpen}
        onOpenChange={setIsHandWrittenModalOpen}
      />
    </>
  );

  // 드로어 모드: aside wrapper 없이 내용만 반환
  if (isDrawer) {
    return content;
  }

  // 데스크탑 사이드바 모드
  return (
    <aside
      className={cn(
        'relative z-sidebar flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar-bg transition-all duration-slow',
        'w-sidetab',
        'px-5'
      )}
    >
      {content}
    </aside>
  );
};
