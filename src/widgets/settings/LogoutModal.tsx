import React from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';

export interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

/**
 * LogoutModal - 로그아웃 확인 모달
 * 로그아웃 전 사용자에게 최종 확인을 받는 모달
 *
 * @example
 * <LogoutModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onConfirm={handleLogout}
 * />
 */
export const LogoutModal: React.FC<LogoutModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  React.useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.LogoutConfirmView);
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-sm">
      <div className="flex flex-col gap-6 p-6">
        <div>
          <Text className="typo-xl font-emphasize">로그아웃</Text>
          <Text className="typo-sm mt-2 text-fg-muted">
            로그아웃하면 다시 로그인해야 서비스를 이용할 수 있습니다.
          </Text>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            tone="neutral"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            variant="solid"
            tone="primary"
            className="flex-1"
            onClick={onConfirm}
          >
            로그아웃
          </Button>
        </div>
      </div>
    </Modal>
  );
};
