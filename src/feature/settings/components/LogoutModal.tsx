import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';

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
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="로그아웃"
      description="정말 로그아웃 하시겠습니까?"
      className="max-w-sm text-left"
    >
      <div className="space-y-4">
        <Text className="text-sm text-fg-muted">
          로그아웃하면 다시 로그인해야 서비스를 이용할 수 있습니다.
        </Text>

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
