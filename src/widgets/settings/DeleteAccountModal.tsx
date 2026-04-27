import React from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';

export interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error: string;
}

/**
 * DeleteAccountModal - 계정 탈퇴 확인 모달
 * 계정 탈퇴 전 사용자에게 최종 확인을 받는 모달
 *
 * @example
 * <DeleteAccountModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onConfirm={handleDelete}
 *   isDeleting={isDeleting}
 *   error={error}
 * />
 */
export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  error,
}) => {
  React.useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.AccountDeleteConfirmView);
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-sm">
      <div className="flex flex-col gap-6 p-6">
        <div>
          <Text className="typo-xl font-emphasize">계정 탈퇴</Text>
          <Text className="typo-sm mt-2 text-fg-muted">
            계정을 탈퇴하면 모든 데이터가 삭제되며, 복구할 수 없어요.
            <br />
            정말 탈퇴하시겠어요?
          </Text>
        </div>

        {error && (
          <p className="typo-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            tone="neutral"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            variant="solid"
            tone="danger"
            className="flex-1"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '탈퇴 중...' : '탈퇴하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
