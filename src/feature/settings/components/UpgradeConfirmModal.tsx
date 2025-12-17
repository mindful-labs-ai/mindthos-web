import React, { useState } from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import { formatPrice } from '@/shared/utils/format';

export interface UpgradePreviewData {
  currentPlan: { id: string; type: string; price: number; totalCredit: number };
  newPlan: { id: string; type: string; price: number; totalCredit: number };
  remainingCredit: number;
  discount: number;
  finalAmount: number;
}

export interface UpgradeConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: UpgradePreviewData | null;
  onConfirm: () => Promise<void>;
}

export const UpgradeConfirmModal: React.FC<UpgradeConfirmModalProps> = ({
  open,
  onOpenChange,
  previewData,
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('업그레이드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!previewData) return null;

  const { currentPlan, newPlan, remainingCredit, discount, finalAmount } =
    previewData;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="플랜 업그레이드"
      className="max-w-md"
    >
      <div className="space-y-6">
        {/* 플랜 정보 */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Text className="text-fg-muted">현재 플랜</Text>
            <Text className="font-medium">
              {currentPlan.type} ({formatPrice(currentPlan.price)}원/월)
            </Text>
          </div>
          <div className="flex justify-between">
            <Text className="text-fg-muted">변경 플랜</Text>
            <Text className="font-medium">
              {newPlan.type} ({formatPrice(newPlan.price)}원/월)
            </Text>
          </div>
        </div>

        <hr className="border-border" />

        {/* 할인 계산 */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Text className="text-fg-muted">남은 크레딧</Text>
            <Text>{remainingCredit.toLocaleString()} 크레딧</Text>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <Text className="text-fg-muted">할인 금액</Text>
              <Text className="text-success">-{formatPrice(discount)}원</Text>
            </div>
          )}
        </div>

        <hr className="border-border" />

        {/* 최종 결제 금액 */}
        <div className="flex justify-between">
          <Text className="text-lg font-semibold">최종 결제 금액</Text>
          <Text className="text-xl font-bold text-primary">
            {formatPrice(finalAmount)}원
          </Text>
        </div>

        <Text className="text-xs text-fg-muted">
          * 남은 크레딧의 가치가 할인 금액으로 적용됩니다.
        </Text>

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            tone="neutral"
            size="md"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            variant="solid"
            tone="primary"
            size="md"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '처리 중...' : '결제하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
