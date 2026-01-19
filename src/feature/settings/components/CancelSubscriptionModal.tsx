import React, { useState } from 'react';

import { ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { trackError } from '@/lib/mixpanel';
import { CheckIcon, HelpCircleIcon } from '@/shared/icons';

import { planFeature, type PlanKey } from './PlanCard';

export interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanType: string;
  currentPlanCredit: number;
  effectiveAt: string | null;
  onConfirm: () => Promise<void>;
}

// 플랜 타입 → 한글 이름 변환
const getPlanDisplayName = (type: string): string => {
  const map: Record<string, string> = {
    Free: '무료',
    Starter: '스타터',
    Plus: '플러스',
    Pro: '프로',
    스타터: '스타터',
    플러스: '플러스',
    프로: '프로',
  };
  return map[type] || type;
};

// 플랜 타입 → planFeature 키 변환
const getPlanFeatureKey = (type: string): PlanKey | null => {
  const map: Record<string, PlanKey> = {
    Starter: '스타터',
    Plus: '플러스',
    Pro: '프로',
    스타터: '스타터',
    플러스: '플러스',
    프로: '프로',
  };
  return map[type] || null;
};

export const CancelSubscriptionModal: React.FC<
  CancelSubscriptionModalProps
> = ({
  open,
  onOpenChange,
  currentPlanType,
  currentPlanCredit,
  effectiveAt,
  onConfirm,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      trackError('subscription_cancel_error', error, {
        current_plan: currentPlanType,
      });
      toast({
        title: '구독 해지 실패',
        description: '구독 해지에 실패했습니다. 다시 시도해주세요.',
        duration: 5000,
      });
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

  const planFeatureKey = getPlanFeatureKey(currentPlanType);
  const currentFeatures = planFeatureKey ? planFeature[planFeatureKey] : null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="flex max-w-3xl items-center justify-center"
    >
      <div className="flex w-full flex-col items-stretch space-y-12 px-12">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-danger">
            <HelpCircleIcon size={24} />
            <Title as="h2" className="text-xl font-bold">
              정기결제 중단하기
            </Title>
          </div>
          <div className="space-y-1">
            <Text className="font-semibold">
              정말 정기결제를 중단하시겠어요?
            </Text>
            <Text className="font-semibold">
              결제 중단 후 아래 기능을 더 이상 이용할 수 없습니다.
            </Text>
          </div>
        </div>

        {/* 플랜 비교 카드 */}
        <div className="flex w-full flex-row items-center justify-center gap-4">
          {/* 현재 플랜 */}
          <div className="flex-1 self-stretch rounded-xl border border-border px-4 py-6">
            <Title
              as="h3"
              className="mb-6 px-4 text-left text-lg font-semibold"
            >
              {getPlanDisplayName(currentPlanType)} 요금제 이용 중
            </Title>
            <div className="space-y-3">
              {/* 크레딧 */}
              <div className="flex items-center gap-3">
                <CheckIcon size={18} className="flex-shrink-0 text-primary" />
                <Text className="text-sm">
                  <span className="font-semibold">
                    {currentPlanCredit.toLocaleString()} 크레딧
                  </span>{' '}
                  / 월
                </Text>
              </div>
              {/* 피처 목록 */}
              {currentFeatures &&
                Object.entries(currentFeatures).map(
                  ([idx, { text, style, sub }]) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckIcon
                        size={18}
                        className="flex-shrink-0 text-primary"
                      />
                      <div className="flex gap-1">
                        <Text className={`text-sm ${style || ''}`}>{text}</Text>
                        {sub && <span className="text-sm">{sub}</span>}
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>

          {/* 화살표 */}
          <div className="flex-shrink-0">
            <ChevronRightIcon size={24} className="text-fg-muted" />
          </div>

          {/* 정기결제 중단 후 (Free 플랜 - 하드코딩) */}
          <div className="flex-1 self-stretch rounded-xl border border-border px-4 py-6">
            <Title
              as="h3"
              className="mb-6 px-4 text-left text-lg font-semibold"
            >
              정기결제 중단 후
            </Title>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckIcon size={18} className="flex-shrink-0 text-primary" />
                <Text className="text-sm">
                  <span className="font-semibold">100 크레딧</span> / 월
                </Text>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon size={18} className="flex-shrink-0 text-primary" />
                <Text className="text-sm">제한된 상담 노트 템플릿</Text>
              </div>
            </div>
          </div>
        </div>

        {/* 해지 적용일 안내 */}
        <div className="text-center">
          <Text className="text-sm text-fg-muted">
            정기결제를 중단해도{' '}
            <span className="font-semibold text-fg">
              {formatDate(effectiveAt)}
            </span>
            까지 이용할 수 있습니다.
          </Text>
        </div>

        {/* 버튼 */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            tone="neutral"
            size="lg"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-40"
          >
            계속 이용하기
          </Button>
          <Button
            variant="soft"
            tone="danger"
            size="lg"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-40"
          >
            {isLoading ? '처리 중...' : '중단하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
