import React from 'react';

import { useLocation } from 'react-router-dom';

import { Button, Text } from '@/components/ui';
import { PopUp } from '@/components/ui/composites/PopUp';
import { Spotlight } from '@/components/ui/composites/Spotlight';
import {
  ClientTabTooltip,
  SessionTabTooltip,
} from '@/feature/onboarding/components/TutorialTooltips';
import { useTutorial } from '@/feature/onboarding/hooks/useTutorial';
import { CreateHandWrittenSessionModal } from '@/feature/session/components/CreateHandWrittenSessionModal';
import { CreditDisplay } from '@/feature/settings/components/CreditDisplay';
import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import {
  calculateDaysUntilReset,
  getPlanLabel,
} from '@/feature/settings/utils/planUtils';
import { cn } from '@/lib/cn';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Edit3Icon, PlusIcon, SideLockIcon, UploadIcon } from '@/shared/icons';
import { useModalStore } from '@/stores/modalStore';
import { useQuestStore } from '@/stores/questStore';

import {
  AI_ANALYSIS_ITEMS,
  BOTTOM_NAV_ITEMS,
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
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-3 py-2.5',
        'text-left text-sm font-medium',
        'transition-colors duration-200',
        isActive
          ? 'bg-surface-contrast text-fg'
          : 'text-[#BABAC0] opacity-90 hover:bg-surface-contrast'
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <span className={cn('flex-shrink-0')}>{icon}</span>}
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {disabled && <SideLockIcon size={14} className="text-[#BABAC0]" />}
        </div>
      </div>
      {badge && (
        <span
          className={cn(
            'rounded-md px-1 py-0.5 text-xs font-bold',
            badge === 'beta'
              ? 'bg-primary text-white'
              : 'bg-[#BABAC0] text-surface'
          )}
        >
          {badge === 'beta' ? 'Beta' : '준비 중'}
        </span>
      )}
    </button>
  );
};

export const SideTab = () => {
  const { navigateWithUtm } = useNavigateWithUtm();
  const location = useLocation();
  const [isNewRecordMenuOpen, setIsNewRecordMenuOpen] = React.useState(false);
  const [isHandWrittenModalOpen, setIsHandWrittenModalOpen] =
    React.useState(false);

  // 전역 모달 스토어 사용
  const openModal = useModalStore((state) => state.openModal);

  // 크레딧 정보 가져오기
  const { creditInfo } = useCreditInfo();
  // 현재 퀘스트 레벨 가져오기
  const { currentLevel } = useQuestStore();
  // 튜토리얼 훅
  const { checkIsTutorialActive, handleTutorialAction, endTutorial } =
    useTutorial({
      currentLevel,
    });

  // 현재 경로에 따라 activeNav 자동 설정
  const activeNav: string = React.useMemo(() => {
    return getNavValueFromPath(location.pathname);
  }, [location.pathname]);

  const handleNavSelect = (value: string) => {
    if (value === 'help') {
      window.open(
        'https://rare-puppy-06f.notion.site/v2-2cfdd162832d801bae95f67269c062c7?source=copy_link',
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    const path = getPathFromNavValue(value);
    if (path) {
      if (value === 'sessions' && checkIsTutorialActive(1, 1)) {
        // 레벨 1 튜토리얼: 상담 기록 탭 클릭
        handleTutorialAction(() => navigateWithUtm(path), 1, {
          targetLevel: 1,
        });
      } else if (value === 'client' && checkIsTutorialActive(1, 2)) {
        // 레벨 2 튜토리얼: 클라이언트 탭 클릭
        handleTutorialAction(() => navigateWithUtm(path), 1, {
          targetLevel: 2,
        });
      } else {
        navigateWithUtm(path);
      }
    }
  };

  const handleAudioUploadClick = () => {
    setIsNewRecordMenuOpen(false);
    openModal('createMultiSession');
  };

  const handleDirectInputClick = () => {
    setIsNewRecordMenuOpen(false);
    setIsHandWrittenModalOpen(true);
  };

  return (
    <aside
      className={cn(
        'relative z-10 flex h-full flex-col overflow-hidden border-r border-border bg-bg transition-all duration-300',
        'w-0 px-0',
        'lg:w-64 lg:px-3',
        'md:w-64 md:px-3',
        'sm:min-w-64 sm:px-3'
      )}
    >
      {/* Logo Section */}
      <div className="flex h-14 items-center justify-between border-b border-border p-4">
        <button
          onClick={() => navigateWithUtm('/')}
          className="flex items-center gap-2 rounded hover:opacity-80"
        >
          <img
            src="/title_mindthos_logo.png"
            alt="마음토스"
            className="h-6 w-auto antialiased"
            draggable="false"
          />
        </button>
      </div>

      {/* New Session Button (with dropdown) */}
      <div className="p-4">
        <PopUp
          open={isNewRecordMenuOpen}
          onOpenChange={setIsNewRecordMenuOpen}
          placement="bottom-right"
          trigger={
            <Button
              variant="outline"
              tone="primary"
              size="md"
              className="w-full justify-center"
              icon={<PlusIcon size={18} />}
              onClick={async () => {
                setIsNewRecordMenuOpen(!isNewRecordMenuOpen);
              }}
            >
              새 상담 기록
            </Button>
          }
          content={
            <div className="w-[200px] space-y-1">
              <button
                onClick={handleAudioUploadClick}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <UploadIcon size={18} className="" />
                <Text>녹음 파일 업로드</Text>
              </button>
              <button
                onClick={handleDirectInputClick}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <Edit3Icon size={18} className="" />
                <Text>직접 입력하기</Text>
              </button>
            </div>
          }
          triggerClassName="w-full"
        />
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3">
        {/* 상담 관리 섹션 */}
        <div className="mb-4">
          <Text className="mb-2 px-1.5 text-sm font-medium text-fg">
            상담 관리
          </Text>
          <Spotlight
            isActive={
              (currentLevel === 1 && checkIsTutorialActive(1, 1)) ||
              (currentLevel === 2 && checkIsTutorialActive(1, 2))
            }
            onClose={() => endTutorial()}
            tooltip={
              currentLevel === 1 ? <SessionTabTooltip /> : <ClientTabTooltip />
            }
            tooltipPosition="right"
            selector={
              currentLevel === 1
                ? '[data-value="sessions"]'
                : '[data-value="client"]'
            }
            className="w-full"
          >
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
          </Spotlight>
        </div>

        {/* AI 분석 섹션 */}
        <div>
          <Text className="mb-2 px-1.5 text-sm font-medium text-fg">
            AI 분석
          </Text>
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

      <div>
        {/* Credit Display */}
        {creditInfo && (
          <CreditDisplay
            totalCredit={creditInfo.plan.total}
            usedCredit={creditInfo.plan.used}
            planLabel={getPlanLabel(creditInfo.plan.type)}
            planType={creditInfo.plan.type}
            daysUntilReset={calculateDaysUntilReset(
              creditInfo.subscription.reset_at
            )}
            variant="sidebar"
          />
        )}
        <div className="border-t border-border px-3 py-3">
          <nav className="flex flex-col gap-1">
            {BOTTOM_NAV_ITEMS.map((item) => (
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
    </aside>
  );
};
