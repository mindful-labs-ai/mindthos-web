import React, { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/atoms/Button';
import { ProgressCircle } from '@/components/ui/atoms/ProgressCircle';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { CardRegistrationModal } from '@/feature/payment/components/CardRegistrationModal';
import { billingService } from '@/feature/payment/services/billingService';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { ChevronRightIcon, CreditIcon } from '@/shared/icons';
import { useAuthStore } from '@/stores/authStore';

import { useCardInfo } from '../hooks/useCardInfo';
import { useCreditInfo } from '../hooks/useCreditInfo';
import { usePlansByPeriod } from '../hooks/usePlans';
import { formatUsageDate } from '../utils/planUtils';

import {
  UpgradeConfirmModal,
  type UpgradePreviewData,
} from './UpgradeConfirmModal';

export interface CreditRenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreditRenewalModal: React.FC<CreditRenewalModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [previewData, setPreviewData] = useState<UpgradePreviewData | null>(
    null
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const { creditInfo } = useCreditInfo();
  const { cardInfo } = useCardInfo();
  const { monthlyPlans } = usePlansByPeriod();
  const user = useAuthStore((state) => state.user);
  const userId = useAuthStore((state) => state.userId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentPlanType = creditInfo?.plan?.type;
  const currentPlanId = monthlyPlans.find(
    (p) => p.type === currentPlanType
  )?.id;

  // 모달 열릴 때 Step 1로 초기화
  useEffect(() => {
    if (open) {
      setStep(1);
      setPreviewData(null);
    }
  }, [open]);

  const proceedToPreview = async () => {
    if (!currentPlanId) {
      toast({
        title: '플랜 정보 오류',
        description: '현재 플랜 정보를 찾을 수 없습니다.',
      });
      return;
    }

    setIsLoadingPreview(true);
    try {
      const preview = await billingService.previewUpgrade(currentPlanId);
      setPreviewData(preview);
      setStep(2);
    } catch (error) {
      trackError('credit_renewal_preview_error', error);
      toast({
        title: '오류',
        description: '충전 정보를 불러오는데 실패했습니다.',
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleContinue = async () => {
    if (!cardInfo) {
      setIsCardModalOpen(true);
      return;
    }
    await proceedToPreview();
  };

  const handleCardRegistrationSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['cardInfo', userId] });
    setIsCardModalOpen(false);
    await proceedToPreview();
  };

  const handleConfirmPayment = async (userCouponId?: string) => {
    trackEvent('credit_renewal_attempt', {
      plan_type: currentPlanType,
      coupon_id: userCouponId,
    });

    await billingService.renewPlan(userCouponId);

    if (userId) {
      const userIdNumber = parseInt(userId);
      if (!isNaN(userIdNumber)) {
        await queryClient.invalidateQueries({
          queryKey: ['credit', 'subscription', userIdNumber],
        });
        await queryClient.invalidateQueries({
          queryKey: ['credit', 'usage', userIdNumber],
        });
      }
    }

    trackEvent('credit_renewal_success', {
      plan_type: currentPlanType,
    });

    toast({
      title: '크레딧 충전 완료',
      description: '크레딧이 충전되었습니다.',
    });
  };

  if (!creditInfo) return null;

  // Step 2: UpgradeConfirmModal UI 재사용
  if (step === 2 && previewData) {
    return (
      <UpgradeConfirmModal
        open={open}
        onOpenChange={(val) => {
          if (!val) onOpenChange(false);
        }}
        previewData={previewData}
        cardInfo={
          cardInfo
            ? {
                type: cardInfo.type,
                number: cardInfo.number,
                company: cardInfo.company,
              }
            : undefined
        }
        onConfirm={handleConfirmPayment}
        title="크레딧 충전하기"
      />
    );
  }

  // Step 1: 크레딧 비교
  const remaining = creditInfo.plan.remaining;
  const total = creditInfo.plan.total;
  const addedCredits = total - remaining;
  const currentPercentage =
    total > 0 ? Math.floor((remaining / total) * 100) : 0;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="flex h-[836px] max-h-[90%] w-full max-w-[870px] items-center justify-center px-12 py-10"
    >
      <div className="flex w-full flex-col items-center">
        {/* 헤더 */}
        <div className="mb-10 items-stretch text-center">
          <Title as="h2" className="mb-[46px] text-2xl font-semibold">
            크레딧 충전하기
          </Title>

          <div className="flex flex-col gap-[18px]">
            <Text className="mt-2 text-lg font-semibold text-fg">
              크레딧을 충전하시겠습니까?
            </Text>

            <Text className="mt-2 text-fg-muted">
              충전에 필요한 크레딧의 양에 따라 가격이 결정됩니다.
              <br />
              충전을 완료하면 플랜 이용기간은 오늘부터 1개월로 변경됩니다.
            </Text>
          </div>
        </div>

        {/* 크레딧 비교 */}
        <div className="mb-12 flex w-full items-center justify-center gap-8 px-32">
          {/* 현재 */}
          <div className="flex flex-1 flex-col items-center justify-evenly gap-6 rounded-lg border border-surface-strong px-7 py-6">
            <Text className="w-full text-xl font-semibold text-fg">
              현재 크레딧
            </Text>
            <ProgressCircle
              value={currentPercentage}
              size={100}
              strokeWidth={16}
              showValue={false}
            />
            <Text className="flex items-center gap-1 text-lg font-bold text-primary-500">
              {remaining.toLocaleString()} <CreditIcon />
            </Text>
            <Text className="text-sm font-normal text-fg-muted">
              {formatUsageDate(
                creditInfo.subscription.end_at ??
                  creditInfo.subscription.reset_at
              )}
            </Text>
          </div>

          {/* 화살표 */}
          <ChevronRightIcon size={24} />

          {/* 충전 후 */}
          <div className="flex flex-1 flex-col items-center justify-evenly gap-6 rounded-lg border border-surface-strong px-7 py-6">
            <Text className="w-full text-xl font-semibold text-fg">
              충전 후 크레딧
            </Text>{' '}
            <ProgressCircle
              value={100}
              size={100}
              strokeWidth={16}
              showValue={false}
            />
            <Text className="flex items-center gap-1 text-lg font-bold text-primary-500">
              {total.toLocaleString()} <CreditIcon />
            </Text>
            <Text className="text-sm font-normal text-fg-muted">
              {(() => {
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return formatUsageDate(nextMonth.toISOString());
              })()}
            </Text>
          </div>
        </div>

        {/* 충전량 안내 */}
        <Text className="mb-10 text-center text-base font-medium">
          총{' '}
          <span className="font-bold text-primary">
            {addedCredits.toLocaleString()}
          </span>{' '}
          크레딧을 충전합니다.
        </Text>

        {/* 이어서 진행하기 버튼 */}
        <Button
          variant="solid"
          tone="primary"
          size="lg"
          onClick={handleContinue}
          disabled={isLoadingPreview}
          className="w-full max-w-sm"
        >
          {isLoadingPreview ? '불러오는 중...' : '이어서 진행하기'}
        </Button>
      </div>

      <CardRegistrationModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        customerKey={user?.id ? String(user.id) : ''}
        onSuccess={handleCardRegistrationSuccess}
      />
    </Modal>
  );
};
