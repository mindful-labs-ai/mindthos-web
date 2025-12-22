import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';

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
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="계정 탈퇴"
      description="정말 계정을 탈퇴하시겠습니까?"
      className="max-w-sm text-left"
    >
      <div className="space-y-4">
        <Text className="text-sm text-fg-muted">
          계정을 탈퇴하면 모든 데이터가 삭제되며, 복구할 수 없습니다.
          <br />
          정말 탈퇴하시겠습니까?
        </Text>

        {error && (
          <p className="text-sm text-danger" role="alert">
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
