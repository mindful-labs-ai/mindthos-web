import React from 'react';

import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import { Modal } from '@/shared/ui/composites/Modal';
import { PopUp } from '@/shared/ui/composites/PopUp';
import { useAuthStore } from '@/stores/authStore';

import { ProfileAvatar } from './ProfileAvatar';
import { ProfileMenuContent } from './ProfileMenuContent';

interface ProfileMenuProps {
  /** 'dropdown' = 데스크탑 팝오버, 'sheet' = 모바일 바텀시트 */
  surface: 'dropdown' | 'sheet';
}

/**
 * ProfileMenu - 헤더 우측 프로필 진입점
 * 아바타 클릭 시 상담사 정보·크레딧·설정·도움말 표시
 * - dropdown: 데스크탑 헤더 (PopUp 팝오버)
 * - sheet: 모바일 헤더 (Modal 바텀시트)
 */
export const ProfileMenu: React.FC<ProfileMenuProps> = ({ surface }) => {
  const [open, setOpen] = React.useState(false);
  const userName = useAuthStore((state) => state.userName);
  const user = useAuthStore((state) => state.user);
  const { creditInfo } = useCreditInfo();

  const initial =
    userName?.trim().charAt(0) ||
    user?.email?.trim().charAt(0).toUpperCase() ||
    '?';

  const percentage =
    creditInfo && creditInfo.plan.total > 0
      ? Math.floor((creditInfo.plan.remaining / creditInfo.plan.total) * 100)
      : 0;

  if (surface === 'dropdown') {
    return (
      <PopUp
        open={open}
        onOpenChange={setOpen}
        placement="bottom"
        trigger={<ProfileAvatar initial={initial} percentage={percentage} />}
        content={<ProfileMenuContent onClose={() => setOpen(false)} />}
        className="w-72"
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="프로필 메뉴 열기"
        className="focus-default shrink-0 rounded-full"
      >
        <ProfileAvatar initial={initial} percentage={percentage} />
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        mobileVariant="bottomSheet"
        hideCloseButton
      >
        <ProfileMenuContent onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
};

ProfileMenu.displayName = 'ProfileMenu';
