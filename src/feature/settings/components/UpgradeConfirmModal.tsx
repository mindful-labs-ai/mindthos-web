import React, { useState } from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { getCardBrandName } from '@/feature/payment/constants/card';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { formatPrice } from '@/shared/utils/format';

export interface UpgradePreviewData {
  currentPlan: { id: string; type: string; price: number; totalCredit: number };
  newPlan: { id: string; type: string; price: number; totalCredit: number };
  remainingCredit: number;
  discount: number;
  finalAmount: number;
  cardInfo?: {
    type: string;
    number: string;
    company: string | null;
  };
}

export interface UpgradeConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: UpgradePreviewData | null;
  cardInfo?: {
    type: string;
    number: string;
    company: string | null;
  };
  onConfirm: () => Promise<void>;
  onChangeCard?: () => void;
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

// 날짜 포맷팅
const formatDateFromDate = (date: Date) => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// 카드 번호 포맷팅 (4자리마다 - 추가)
const formatCardNumber = (number: string) => {
  return number.replace(/(.{4})/g, '$1-').replace(/-$/, '');
};

// 이용 기간 계산 (오늘 ~ 익월 동일 일자 -1일)
const calculatePeriod = () => {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(nextMonth.getDate() - 1);

  return {
    start: formatDateFromDate(today),
    end: formatDateFromDate(nextMonth),
  };
};

export const UpgradeConfirmModal: React.FC<UpgradeConfirmModalProps> = ({
  open,
  onOpenChange,
  previewData,
  cardInfo,
  onConfirm,
  onChangeCard,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    trackEvent('plan_upgrade_attempt', {
      current_plan: previewData?.currentPlan?.type,
      new_plan: previewData?.newPlan?.type,
    });
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      trackError('plan_upgrade_error', error, {
        current_plan: previewData?.currentPlan?.type,
        new_plan: previewData?.newPlan?.type,
      });
      toast({
        title: '플랜 업그레이드 실패',
        description: '플랜 업그레이드에 실패했습니다. 다시 시도해주세요.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!previewData) return null;

  const { currentPlan, newPlan, remainingCredit, discount, finalAmount } =
    previewData;

  // 카드 정보 (previewData에서 오거나 props에서 옴)
  const displayCardInfo = previewData.cardInfo || cardInfo;

  // 이용 기간 계산
  const period = calculatePeriod();

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-xl">
      <div className="space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <Title as="h2" className="text-xl font-bold">
            마음토스 플랜 업그레이드
          </Title>
        </div>

        {/* 결제 금액 카드 */}
        <div className="rounded-xl border border-border p-6">
          <Title as="h3" className="mb-4 text-lg font-semibold">
            결제 금액
          </Title>

          {/* 요금제 */}
          <div className="space-y-6">
            <Text className="text-sm text-fg-muted">요금제</Text>

            {/* 변경 플랜 */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded border border-primary bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary">
                  변경
                </span>
                <div className="text-left">
                  <Text className="text-left font-medium">
                    {getPlanDisplayName(newPlan.type)} 플랜
                  </Text>
                  <Text className="text-sm text-fg-muted">
                    이용 기간 : {period.start} ~ {period.end}
                  </Text>
                </div>
              </div>
              <Text className="font-medium">
                {formatPrice(newPlan.price)}원
              </Text>
            </div>

            {/* 현재 플랜 */}
            {currentPlan.type === 'Free' || (
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 text-start">
                  <span className="rounded border border-border px-2 py-0.5 text-xs font-medium text-fg-muted">
                    현재
                  </span>
                  <div>
                    <Text className="font-medium text-fg">
                      {getPlanDisplayName(currentPlan.type)} 플랜
                    </Text>
                    <Text className="text-sm text-fg-muted">
                      잔여 크레딧 : {remainingCredit.toLocaleString()} 크레딧
                    </Text>
                  </div>
                </div>
                <Text className="font-medium text-fg">
                  -{formatPrice(discount)}원
                </Text>
              </div>
            )}

            {/* 안내 문구 */}
            {currentPlan.type === 'Free' || (
              <div className="pt-4">
                <Text className="text-center text-xs text-fg-muted">
                  *변경할 요금제와 현재 요금제의 차액이 결제됩니다.
                </Text>
              </div>
            )}
          </div>

          {/* 총 결제 금액 */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Text className="font-medium">총 결제 금액</Text>
            <Title as="h2" className="text-2xl font-bold">
              {formatPrice(finalAmount)}원
            </Title>
          </div>

          {/* 결제 카드 */}
          {displayCardInfo && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-contrast p-4 text-start">
              <div>
                <Text className="text-sm text-fg-muted">결제 카드</Text>
                <Text className="font-medium">
                  {getCardBrandName(displayCardInfo.company) || ''}{' '}
                  {formatCardNumber(displayCardInfo.number)}
                </Text>
              </div>
              {onChangeCard && (
                <Button
                  variant="outline"
                  tone="neutral"
                  size="sm"
                  onClick={onChangeCard}
                >
                  결제 수단 변경
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 약관 동의 및 결제 버튼 */}
        <div className="flex flex-col items-center gap-4">
          <Text className="text-sm text-fg-muted">
            <a
              href="/terms?type=service"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-primary-600"
            >
              결제 약관
            </a>
            에 동의합니다.
          </Text>
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full max-w-md bg-gradient-to-r from-green-500 via-lime-400 to-amber-200 text-surface"
          >
            {isLoading ? '처리 중...' : '결제하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
