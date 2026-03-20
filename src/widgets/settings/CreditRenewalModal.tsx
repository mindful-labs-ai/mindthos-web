import React, { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useCardInfo } from '@/features/settings/hooks/useCardInfo';
import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import { usePlansByPeriod } from '@/features/settings/hooks/usePlans';
import { formatUsageDate } from '@/features/settings/utils/planUtils';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { billingService } from '@/shared/api/supabase/billingQueries';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { cardQueryKeys, creditQueryKeys } from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import { ArrowRightIcon, CreditIcon } from '@/shared/icons';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { ProgressCircle } from '@/shared/ui/atoms/ProgressCircle';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { CardRegistrationModal } from '@/widgets/payment/CardRegistrationModal';

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

  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
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
      trackError(MixpanelError.CreditRenewalPreviewError, error);
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
    await queryClient.invalidateQueries({
      queryKey: cardQueryKeys.info(userId!),
    });
    setIsCardModalOpen(false);
    await proceedToPreview();
  };

  const handleConfirmPayment = async (userCouponId?: string) => {
    trackEvent(MixpanelEvent.CreditRenewalAttempt, {
      plan_type: currentPlanType,
      coupon_id: userCouponId,
    });

    await billingService.renewPlan(userCouponId);

    if (userId) {
      const userIdNumber = parseInt(userId);
      if (!isNaN(userIdNumber)) {
        await queryClient.invalidateQueries({
          queryKey: creditQueryKeys.subscription(userIdNumber),
        });
        await queryClient.invalidateQueries({
          queryKey: creditQueryKeys.usage(userIdNumber),
        });
      }
    }

    trackEvent(MixpanelEvent.CreditRenewalSuccess, {
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

  // 공통: 현재 크레딧 카드
  const currentCreditCard = (
    <div
      className={`flex flex-col items-center gap-4 rounded-lg border border-grey-30 p-6 ${isMobile ? 'flex-row' : ''}`}
    >
      <p className="w-full text-l font-emphasize text-grey-100">현재 크레딧</p>
      <div
        className={
          isMobile
            ? 'flex items-center gap-4'
            : 'flex flex-col items-center gap-4'
        }
      >
        <ProgressCircle
          value={currentPercentage}
          size={isMobile ? 80 : 100}
          strokeWidth={16}
          showValue={false}
        />
        <div className={isMobile ? '' : 'text-center'}>
          <p className="flex items-center gap-1 text-l font-headline text-green-80">
            {remaining.toLocaleString()} <CreditIcon />
          </p>
          <p className="text-sm text-grey-60">
            {formatUsageDate(
              creditInfo.subscription.end_at ?? creditInfo.subscription.reset_at
            )}
          </p>
        </div>
      </div>
    </div>
  );

  // 공통: 충전 후 크레딧 카드
  const afterCreditCard = (
    <div
      className={`flex flex-col items-center gap-4 rounded-lg border border-grey-30 p-6 ${isMobile ? 'flex-row' : ''}`}
    >
      <p className="w-full text-l font-emphasize text-grey-100">
        충전 후 크레딧
      </p>
      <div
        className={
          isMobile
            ? 'flex items-center gap-4'
            : 'flex flex-col items-center gap-4'
        }
      >
        <ProgressCircle
          value={100}
          size={isMobile ? 80 : 100}
          strokeWidth={16}
          showValue={false}
        />
        <div className={isMobile ? '' : 'text-center'}>
          <p className="flex items-center gap-1 text-l font-headline text-green-80">
            {total.toLocaleString()} <CreditIcon />
          </p>
          <p className="text-sm text-grey-60">
            {(() => {
              const nextMonth = new Date();
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              return formatUsageDate(nextMonth.toISOString());
            })()}
          </p>
        </div>
      </div>
    </div>
  );

  // 공통: 충전량 안내
  const chargeInfo = (
    <p className="text-center text-m font-medium text-grey-100">
      총{' '}
      <span className="font-headline text-green-80">
        {addedCredits.toLocaleString()} 크레딧
      </span>
      을 충전합니다.
    </p>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className={
        isMobileView
          ? 'flex flex-col'
          : 'flex h-[836px] max-h-[90%] w-full max-w-[870px] items-center justify-center px-12 py-10'
      }
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
      closeOnOverlay={!isCardModalOpen}
    >
      {isMobileView ? (
        <>
          <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 px-4 py-3">
            <BackButton onClick={() => onOpenChange(false)} />
            <p className="text-l font-medium text-grey-80">크레딧 충전하기</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
            <div className="mb-8 text-center">
              <p className="text-l font-emphasize text-grey-100">
                크레딧을 충전하시겠습니까?
              </p>
              <p className="mt-2 text-sm text-grey-60">
                충전에 필요한 크레딧의 양에 따라 가격이 결정됩니다.
                {isMobile ? ' ' : <br />}
                충전을 완료하면 플랜 이용기간은 오늘부터 1개월로 변경됩니다.
              </p>
            </div>

            <div
              className={
                isMobile
                  ? 'flex flex-col items-center gap-4'
                  : 'flex items-center gap-4'
              }
            >
              <div className={isMobile ? 'w-full' : 'flex-1'}>
                {currentCreditCard}
              </div>
              <div className="flex-shrink-0">
                <ArrowRightIcon
                  size={24}
                  className={`text-grey-60 ${isMobile ? 'rotate-90' : ''}`}
                />
              </div>
              <div className={isMobile ? 'w-full' : 'flex-1'}>
                {afterCreditCard}
              </div>
            </div>

            <div className="mt-8">{chargeInfo}</div>
          </div>
          <div className="flex-shrink-0 px-4 pb-4 md:px-10">
            <Button
              variant="solid"
              tone="primary"
              size="lg"
              onClick={handleContinue}
              disabled={isLoadingPreview}
              className="w-full"
            >
              {isLoadingPreview ? '불러오는 중...' : '이어서 진행하기'}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex w-full flex-col items-center">
          <div className="mb-10 text-center">
            <Title
              as="h2"
              className="mb-[46px] text-2xl font-emphasize text-grey-100"
            >
              크레딧 충전하기
            </Title>
            <p className="mt-2 text-l font-emphasize text-grey-100">
              크레딧을 충전하시겠습니까?
            </p>
            <p className="mt-4 text-grey-60">
              충전에 필요한 크레딧의 양에 따라 가격이 결정됩니다.
              <br />
              충전을 완료하면 플랜 이용기간은 오늘부터 1개월로 변경됩니다.
            </p>
          </div>

          <div className="mb-12 flex w-full items-center justify-center gap-8 px-32">
            <div className="flex-1">{currentCreditCard}</div>
            <ArrowRightIcon size={24} className="text-grey-60" />
            <div className="flex-1">{afterCreditCard}</div>
          </div>

          <div className="mb-10">{chargeInfo}</div>

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
      )}

      <CardRegistrationModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        customerKey={user?.id ? String(user.id) : ''}
        onSuccess={handleCardRegistrationSuccess}
      />
    </Modal>
  );
};
