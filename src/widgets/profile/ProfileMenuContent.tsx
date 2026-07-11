import React from 'react';

import { ROUTES } from '@/app/router/constants';
import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import {
  calculateDaysUntilReset,
  getPlanLabel,
} from '@/features/settings/utils/planUtils';
import { GUIDE_URL } from '@/shared/constants/externalUrls';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import {
  MailIcon,
  MapPinIcon,
  SideHelpIcon,
  SideSettingsIcon,
  UserCircle2Icon,
} from '@/shared/icons';
import { Text } from '@/shared/ui';
import { useAuthStore } from '@/stores/authStore';
import { CreditDisplay } from '@/widgets/settings/CreditDisplay';

interface ProfileMenuContentProps {
  /** 메뉴 항목 선택 후 팝오버/시트 닫기 */
  onClose: () => void;
}

/**
 * ProfileMenuContent - 데스크탑 드롭다운 / 모바일 바텀시트 공용 내용
 * 상담사 정보 → 크레딧 → 설정 / 도움말 및 지원
 */
export const ProfileMenuContent: React.FC<ProfileMenuContentProps> = ({
  onClose,
}) => {
  const { navigateWithUtm } = useNavigateWithUtm();
  const userName = useAuthStore((state) => state.userName);
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);
  const { creditInfo } = useCreditInfo();

  const handleSettings = () => {
    navigateWithUtm(ROUTES.SETTINGS);
    onClose();
  };

  const handleHelp = () => {
    window.open(GUIDE_URL, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="flex w-full flex-col">
      <Text className="px-1 text-sm font-medium text-fg-muted">
        상담사 정보
      </Text>

      <div className="mt-3 flex flex-col gap-1.5 px-1">
        <div className="flex items-center gap-2">
          <UserCircle2Icon
            size={20}
            strokeWidth={1.5}
            className="shrink-0 text-grey-70"
          />
          <Text truncate className="text-m font-medium text-grey-100">
            {userName || '이름 없음'}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <MailIcon
            size={20}
            strokeWidth={1.5}
            className="shrink-0 text-grey-70"
          />
          <Text truncate className="text-m font-medium text-grey-100">
            {user?.email || '이메일 없음'}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <MapPinIcon
            size={20}
            strokeWidth={1.5}
            className="shrink-0 text-grey-70"
          />
          <Text truncate className="text-m font-medium text-grey-100">
            {organization || '소속 기관 없음'}
          </Text>
        </div>
      </div>

      {creditInfo && (
        <div className="mt-4">
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
        </div>
      )}

      <div className="border-t border-border pt-2">
        <button
          type="button"
          onClick={handleSettings}
          className="transition-default flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left lg:hover:bg-nav-hover-bg"
        >
          <SideSettingsIcon size={24} className="text-grey-60" />
          <Text className="text-m font-medium text-grey-60">설정</Text>
        </button>
        <button
          type="button"
          onClick={handleHelp}
          className="transition-default flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left lg:hover:bg-nav-hover-bg"
        >
          <SideHelpIcon size={24} className="text-grey-60" />
          <Text className="text-m font-medium text-grey-60">
            도움말 및 지원
          </Text>
        </button>
      </div>
    </div>
  );
};

ProfileMenuContent.displayName = 'ProfileMenuContent';
