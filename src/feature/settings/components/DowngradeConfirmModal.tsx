import React, { useState } from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';

import {
  PlanComparisonCard,
  type PlanInfo,
} from './PlanComparisonCard';

export interface DowngradeConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanInfo;
  newPlan: PlanInfo;
  effectiveAt: string | null;
  onConfirm: () => Promise<void>;
}

export const DowngradeConfirmModal: React.FC<DowngradeConfirmModalProps> = ({
  open,
  onOpenChange,
  currentPlan,
  newPlan,
  effectiveAt,
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('다운그레이드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '구독 종료 후';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="플랜 다운그레이드"
      className="max-w-lg"
    >
      <div className="space-y-6">
        {/* 플랜 비교 */}
        <PlanComparisonCard
          currentPlan={currentPlan}
          newPlan={newPlan}
          type="downgrade"
        />

        {/* 적용일 안내 */}
        <div className="rounded-lg bg-bg-subtle p-4 text-center">
          <Text className="text-sm text-fg-muted">변경 적용일</Text>
          <Text className="mt-1 text-lg font-semibold">
            {formatDate(effectiveAt)}
          </Text>
          <Text className="mt-2 text-xs text-fg-muted">
            현재 구독이 종료된 후 새 플랜이 적용됩니다.
          </Text>
        </div>

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
            tone="warning"
            size="md"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '처리 중...' : '변경 예약하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
