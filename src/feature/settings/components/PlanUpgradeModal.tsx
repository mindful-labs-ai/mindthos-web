import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Text, Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { useTossPayments } from '@/feature/payment/hooks/useTossPayments';
import { billingService } from '@/feature/payment/services/billingService';
import { useCardInfo } from '@/feature/settings/hooks/useCardInfo';
import { usePlansByPeriod } from '@/feature/settings/hooks/usePlans';
import { useAuthStore } from '@/stores/authStore';

import { PlanCard } from './PlanCard';

export interface PlanUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PlanPeriod = 'monthly' | 'yearly';

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [period] = React.useState<PlanPeriod>('monthly');
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(
    null
  );
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const userId = useAuthStore((state) => state.userId);
  const userName = useAuthStore((state) => state.userName);
  const { monthlyPlans, yearlyPlans, isLoading } = usePlansByPeriod();
  const { requestBillingAuth } = useTossPayments(user?.id || '');
  const { cardInfo } = useCardInfo();

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleUpgrade = async () => {
    if (!selectedPlanId) {
      toast({
        title: '플랜 선택 필요',
        description: '업그레이드할 플랜을 선택해주세요.',
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

    try {
      setIsUpgrading(true);

      // 카드가 이미 등록되어 있으면 바로 결제
      if (cardInfo) {
        const response = await billingService.upgradePlan({
          planId: selectedPlanId,
        });

        if (!response.success) {
          throw new Error(
            response.message || '플랜 업그레이드에 실패했습니다.'
          );
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

        toast({
          title: '플랜 업그레이드 완료',
          description: '플랜이 성공적으로 업그레이드되었습니다.',
        });

        onOpenChange(false);
        setIsUpgrading(false);
        return;
      }

      // 카드가 없으면 카드 등록 플로우 진행
      // 1. init-upgrade 호출하여 payments 임시 row 생성 (5분 유효)
      const initResponse = await billingService.initUpgrade({
        planId: selectedPlanId,
      });

      if (!initResponse.success) {
        throw new Error(
          initResponse.message || '플랜 업그레이드 초기화에 실패했습니다.'
        );
      }

      // 2. Toss SDK로 카드 등록 리다이렉트 (planId를 successUrl에 포함)
      await requestBillingAuth({
        customerName: userName,
        customerEmail: user.email,
        planId: selectedPlanId,
      });

      // requestBillingAuth는 Toss로 리다이렉트하므로 이후 코드는 실행되지 않음
    } catch (error) {
      setIsUpgrading(false);
      toast({
        title: '플랜 업그레이드 실패',
        description:
          error instanceof Error
            ? error.message
            : '플랜 업그레이드 중 오류가 발생했습니다.',
      });
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
    if (baseType === 'PLUS') return '플러스';
    if (baseType === 'PRO') return '프로';
    return baseType;
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="w-5/6 max-w-full">
      <div className="flex flex-col items-center gap-y-12">
        <Title className="pt-4" as="h2">
          마음토스 플랜 업그레이드
        </Title>
        {/* Period Toggle */}
        {/* <div className="flex justify-center gap-1 rounded-lg bg-surface-contrast p-1">
          <Button
            variant={period === 'monthly' ? 'solid' : 'ghost'}
            tone={period === 'monthly' ? 'surface' : 'neutral'}
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
          <div className="flex w-full justify-center gap-6">
            {currentPlans.map((plan) => {
              const isYearly = plan.is_year;
              const discountInfo = isYearly
                ? getDiscountInfo(plan)
                : { originalPrice: undefined, discountRate: 0 };

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
                    onSelect={() => handleSelectPlan(plan.id)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex w-full flex-col items-center gap-y-2">
          <Text>결제 약관에 동의합니다.</Text>
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            disabled={!selectedPlanId || isLoading || isUpgrading}
            onClick={handleUpgrade}
            className="w-full max-w-lg"
          >
            {isUpgrading ? '결제 준비 중...' : '플랜 업그레이드'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
