import React, { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Text, Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { useTossPayments } from '@/feature/payment/hooks/useTossPayments';
import { billingService } from '@/feature/payment/services/billingService';
import { useCardInfo } from '@/feature/settings/hooks/useCardInfo';
import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import { usePlansByPeriod } from '@/feature/settings/hooks/usePlans';
import { trackEvent } from '@/lib/mixpanel';
import { useAuthStore } from '@/stores/authStore';

import { DowngradeConfirmModal } from './DowngradeConfirmModal';
import { PaymentResultModal } from './PaymentResultModal';
import { PlanCard } from './PlanCard';
import {
  UpgradeConfirmModal,
  type UpgradePreviewData,
} from './UpgradeConfirmModal';

export interface PlanChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PlanPeriod = 'monthly' | 'yearly';

export const PlanChangeModal: React.FC<PlanChangeModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [period] = React.useState<PlanPeriod>('monthly');
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(
    null
  );
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  // 업그레이드/다운그레이드 모달 상태
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);
  const [upgradePreview, setUpgradePreview] =
    useState<UpgradePreviewData | null>(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState<{
    type: string;
    price: number;
    totalCredit: number;
  } | null>(null);
  const [paymentResultOpen, setPaymentResultOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    status: 'success' | 'failure';
    planName?: string;
    period?: { start: string; end: string };
    cardInfo?: { type?: string | null; number?: string };
    amount?: number;
    reason?: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const userId = useAuthStore((state) => state.userId);
  const userName = useAuthStore((state) => state.userName);
  const { monthlyPlans, yearlyPlans, isLoading } = usePlansByPeriod();
  const { requestBillingAuth } = useTossPayments(user?.id || '');
  const { cardInfo } = useCardInfo();
  const { creditInfo } = useCreditInfo();

  // 현재 플랜 정보
  const currentPlanType = creditInfo?.plan?.type;
  const currentPlanId = monthlyPlans.find(
    (p) => p.type === currentPlanType
  )?.id;
  const currentPlanPrice =
    monthlyPlans.find((p) => p.type === currentPlanType)?.price || 0;
  const currentPlanCredit = creditInfo?.plan?.total || 0;

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleUpgrade = async () => {
    if (!selectedPlanId) {
      toast({
        title: '플랜 선택 필요',
        description: '변경할 플랜을 선택해주세요.',
      });
      return;
    }

    if (!userName || !user?.email) {
      toast({
        title: '사용자 정보 오류',
        description: '사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.',
      });
      return;
    }

    // 선택한 플랜 정보 조회
    const selectedPlan = [...monthlyPlans, ...yearlyPlans].find(
      (p) => p.id === selectedPlanId
    );
    if (!selectedPlan) {
      toast({
        title: '플랜 정보 오류',
        description: '선택한 플랜 정보를 찾을 수 없습니다.',
      });
      return;
    }

    // 현재 플랜과 비교하여 업그레이드/다운그레이드 판단
    const isUpgradeAction = selectedPlan.price > currentPlanPrice;

    try {
      setIsUpgrading(true);

      if (isUpgradeAction) {
        // 업그레이드: 미리보기 조회 후 확인 모달 표시
        const preview = await billingService.previewUpgrade(selectedPlanId);
        setUpgradePreview(preview);
        setUpgradeModalOpen(true);
        setIsUpgrading(false);
      } else {
        // 다운그레이드: 확인 모달 표시
        setSelectedNewPlan({
          type: getPlanName(selectedPlan.type),
          price: selectedPlan.price,
          totalCredit: selectedPlan.total_credit,
        });
        setDowngradeModalOpen(true);
        setIsUpgrading(false);
      }
    } catch (error) {
      setIsUpgrading(false);
      toast({
        title: '플랜 변경 실패',
        description:
          error instanceof Error
            ? error.message
            : '플랜 변경 중 오류가 발생했습니다.',
      });
    }
  };

  // 업그레이드 확정 (결제)
  const handleConfirmUpgrade = async () => {
    if (!selectedPlanId || !cardInfo) {
      // 카드가 없으면 카드 등록 플로우
      if (!cardInfo && selectedPlanId && userName && user?.email) {
        const initResponse = await billingService.initUpgrade({
          planId: selectedPlanId,
        });

        if (!initResponse.success) {
          throw new Error(
            initResponse.message || '플랜 업그레이드 초기화에 실패했습니다.'
          );
        }

        await requestBillingAuth({
          customerName: userName,
          customerEmail: user.email,
          planId: selectedPlanId,
        });
        return;
      }
      throw new Error('결제 정보가 없습니다.');
    }

    const period = calculatePeriod();
    const selectedPlan = [...monthlyPlans, ...yearlyPlans].find(
      (p) => p.id === selectedPlanId
    );

    try {
      const response = await billingService.changePlan(selectedPlanId);

      if (response.type !== 'upgrade') {
        throw new Error('업그레이드에 실패했습니다. 다시 시도해주세요.');
      }

      // 크레딧 관련 쿼리 invalidate
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

      // 플랜 업그레이드 성공 트래킹
      trackEvent('plan_upgrade_success', {
        new_plan: response.newPlan,
        amount: response.finalAmount,
      });

      setPaymentResult({
        status: 'success',
        planName: getPlanName(response.newPlan || selectedPlan?.type || ''),
        period,
        cardInfo: {
          type: cardInfo.type ?? cardInfo.company,
          number: cardInfo.number,
        },
        amount: response.finalAmount ?? upgradePreview?.finalAmount,
      });
      setPaymentResultOpen(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      trackEvent('plan_upgrade_failed', {
        target_plan: selectedPlan?.type,
        error: errorMessage,
      });

      setPaymentResult({
        status: 'failure',
        planName: selectedPlan ? getPlanName(selectedPlan.type) : undefined,
        period,
        cardInfo: cardInfo
          ? { type: cardInfo.type ?? cardInfo.company, number: cardInfo.number }
          : undefined,
        amount: upgradePreview?.finalAmount ?? selectedPlan?.price,
        reason:
          error instanceof Error
            ? error.message
            : '결제에 실패했습니다. 다시 시도해주세요.',
      });
      setPaymentResultOpen(true);
    }
  };

  // 다운그레이드 확정
  const handleConfirmDowngrade = async () => {
    if (!selectedPlanId) {
      throw new Error('플랜 정보가 없습니다.');
    }

    const response = await billingService.changePlan(selectedPlanId);

    if (response.type === 'downgrade') {
      trackEvent('plan_downgrade_scheduled', { new_plan: selectedPlanId });

      toast({
        title: '플랜 다운그레이드 예약',
        description: '구독 종료 후 새 플랜이 적용됩니다.',
      });

      // 크레딧 관련 쿼리 invalidate
      if (userId) {
        const userIdNumber = parseInt(userId);
        if (!isNaN(userIdNumber)) {
          await queryClient.invalidateQueries({
            queryKey: ['credit', 'subscription', userIdNumber],
          });
        }
      }

      onOpenChange(false);
    }
  };

  const currentPlans = period === 'monthly' ? monthlyPlans : yearlyPlans;

  // 할인율 계산 (연간 플랜의 경우)
  const getDiscountInfo = (yearlyPlan: (typeof yearlyPlans)[0]) => {
    // 같은 타입의 월간 플랜 찾기 (예: PRO_YEAR -> PRO)
    const monthlyPlanType = yearlyPlan.type.replace('_YEAR', '');
    const monthlyPlan = monthlyPlans.find((p) => p.type === monthlyPlanType);

    if (!monthlyPlan) {
      return { originalPrice: undefined, discountRate: 0 };
    }

    const monthlyTotal = monthlyPlan.price * 12;
    const discountRate = Math.round(
      ((monthlyTotal - yearlyPlan.price) / monthlyTotal) * 100
    );

    return {
      originalPrice: monthlyTotal,
      discountRate,
    };
  };

  // 플랜 이름 정리 (PLUS -> 플러스, PRO -> 프로)
  const getPlanName = (type: string) => {
    const baseType = type.replace('_YEAR', '');
    if (baseType === 'Starter') return '스타터';
    if (baseType === 'Plus') return '플러스';
    if (baseType === 'Pro') return '프로';
    return baseType;
  };

  const formatDateFromDate = (date: Date) =>
    date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const calculatePeriod = () => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(endDate.getDate() - 1);

    return {
      start: formatDateFromDate(startDate),
      end: formatDateFromDate(endDate),
    };
  };

  const handleClosePaymentResult = () => {
    setPaymentResultOpen(false);
    if (paymentResult?.status === 'success') {
      onOpenChange(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="mx-12 flex h-fit max-w-fit items-center justify-center"
    >
      <div className="flex flex-col items-stretch gap-y-12 p-6">
        <Title className="pt-4" as="h2">
          마음토스 플랜 업그레이드
        </Title>
        {/* Period Toggle */}
        {/* <div className="flex justify-center gap-1 rounded-lg bg-surface-contrast p-1">
          <Button
            variant={period === 'monthly' ? 'solid' : 'ghost'}
            tone={period === 'monthly' ? 'surface' : 'neutral's}
            size="sm"
            onClick={() => setPeriod('monthly')}
            className="min-w-[100px]"
          >
            월 구독
          </Button>
          <Button
            variant={period === 'yearly' ? 'solid' : 'ghost'}
            tone={period === 'yearly' ? 'surface' : 'neutral'}
            size="sm"
            onClick={() => setPeriod('yearly')}
            className="min-w-[100px]"
          >
            연 구독
          </Button>
        </div> */}

        {/* Plan Cards */}
        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Text className="text-fg-muted">플랜 정보를 불러오는 중...</Text>
          </div>
        ) : currentPlans.length === 0 ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Text className="text-fg-muted">사용 가능한 플랜이 없습니다.</Text>
          </div>
        ) : (
          <div className="flex justify-center gap-6 overflow-auto">
            {currentPlans.map((plan) => {
              const isYearly = plan.is_year;
              const discountInfo = isYearly
                ? getDiscountInfo(plan)
                : { originalPrice: undefined, discountRate: 0 };
              const isCurrent = plan.id === currentPlanId;

              return (
                <div key={plan.id} className="max-w-md flex-1">
                  <PlanCard
                    name={getPlanName(plan.type)}
                    description={plan.description}
                    totalCredit={plan.total_credit}
                    price={plan.price}
                    originalPrice={discountInfo.originalPrice}
                    discountRate={discountInfo.discountRate}
                    isYearly={isYearly}
                    isSelected={selectedPlanId === plan.id}
                    isCurrent={isCurrent}
                    onSelect={() => !isCurrent && handleSelectPlan(plan.id)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col items-center gap-y-2">
          <Text className="text-sm text-fg">
            <span className="underline">결제 약관</span>에 동의합니다.
          </Text>
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            disabled={
              !selectedPlanId ||
              isLoading ||
              isUpgrading ||
              selectedPlanId === currentPlanId
            }
            onClick={handleUpgrade}
            className="w-full max-w-lg"
          >
            {isUpgrading
              ? '처리 중...'
              : selectedPlanId
                ? (() => {
                    const selectedPlan = [...monthlyPlans, ...yearlyPlans].find(
                      (p) => p.id === selectedPlanId
                    );
                    if (!selectedPlan) return '플랜 변경';
                    return selectedPlan.price > currentPlanPrice
                      ? '플랜 업그레이드'
                      : '플랜 다운그레이드';
                  })()
                : '플랜 변경'}
          </Button>
        </div>
      </div>

      {/* 업그레이드 확인 모달 */}
      <UpgradeConfirmModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        previewData={upgradePreview}
        cardInfo={
          cardInfo
            ? { type: cardInfo.type, number: cardInfo.number }
            : undefined
        }
        onConfirm={handleConfirmUpgrade}
      />

      {/* 다운그레이드 확인 모달 */}
      {selectedNewPlan && (
        <DowngradeConfirmModal
          open={downgradeModalOpen}
          onOpenChange={setDowngradeModalOpen}
          currentPlanType={currentPlanType || 'Free'}
          currentPlanCredit={currentPlanCredit}
          newPlanType={selectedNewPlan.type}
          newPlanCredit={selectedNewPlan.totalCredit}
          effectiveAt={creditInfo?.subscription?.end_at || null}
          onConfirm={handleConfirmDowngrade}
        />
      )}

      {/* 결제 결과 모달 */}
      {paymentResult && (
        <PaymentResultModal
          open={paymentResultOpen}
          status={paymentResult.status}
          planName={paymentResult.planName}
          period={paymentResult.period}
          cardInfo={paymentResult.cardInfo}
          amount={paymentResult.amount}
          reason={paymentResult.reason}
          onClose={handleClosePaymentResult}
        />
      )}
    </Modal>
  );
};
