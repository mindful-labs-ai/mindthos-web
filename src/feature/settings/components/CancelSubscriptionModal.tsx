import React, { useState } from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';

import {
  PlanComparisonCard,
  type PlanInfo,
} from './PlanComparisonCard';

export interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanInfo;
  effectiveAt: string | null;
  onConfirm: () => Promise<void>;
}

const FREE_PLAN: PlanInfo = {
  type: 'Free',
  price: 0,
  totalCredit: 100,
};

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  open,
  onOpenChange,
  currentPlan,
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
      console.error('구독 해지 실패:', error);
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
      title="구독 해지"
      className="max-w-lg"
    >
      <div className="space-y-6">
        {/* 플랜 비교 */}
        <PlanComparisonCard
          currentPlan={currentPlan}
          newPlan={FREE_PLAN}
          type="cancel"
        />

        {/* 해지 안내 */}
        <div className="rounded-lg border border-danger bg-danger/5 p-4 text-center">
          <Text className="text-sm text-fg-muted">해지 적용일</Text>
          <Text className="mt-1 text-lg font-semibold text-danger">
            {formatDate(effectiveAt)}
          </Text>
          <Text className="mt-2 text-xs text-fg-muted">
            현재 구독이 종료된 후 무료 플랜으로 전환됩니다.
          </Text>
        </div>

        {/* 주의사항 */}
        <div className="rounded-lg bg-bg-subtle p-4">
          <Text className="text-sm font-medium">해지 전 확인사항</Text>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">
            <li>남은 크레딧은 구독 종료일까지 사용 가능합니다.</li>
            <li>구독 종료 후에는 무료 플랜 크레딧만 제공됩니다.</li>
            <li>해지 예약은 언제든지 취소할 수 있습니다.</li>
          </ul>
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
            tone="danger"
            size="md"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '처리 중...' : '구독 해지하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
