/**
 * 탭 변경 확인 모달
 * 편집 중 탭 변경 시 확인을 요청하는 모달
 */

import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';

interface TabChangeConfirmModalProps {
  /** 모달 열림 상태 */
  open: boolean;
  /** 모달 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 취소 버튼 클릭 핸들러 */
  onCancel: () => void;
  /** 확인 버튼 클릭 핸들러 */
  onConfirm: () => void;
}

export const TabChangeConfirmModal: React.FC<TabChangeConfirmModalProps> =
  React.memo(({ open, onOpenChange, onCancel, onConfirm }) => {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="탭 변경 확인"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <Text className="text-base text-fg">
            편집 중인 내용이 있습니다. 저장하지 않고 탭을 변경하시겠습니까?
          </Text>
          <Text className="text-sm text-fg-muted">
            변경하면 편집 중인 내용이 모두 사라집니다.
          </Text>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={onCancel}
              className="hover:bg-surface-hover w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-fg transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="hover:bg-primary/90 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </Modal>
    );
  });

TabChangeConfirmModal.displayName = 'TabChangeConfirmModal';
