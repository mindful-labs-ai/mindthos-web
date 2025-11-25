import React from 'react';

import { Text, Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Modal } from '@/components/ui/composites/Modal';
import {
  plusPlan,
  proPlan,
  yearPlusPlan,
  yearProPlan,
} from '@/feature/settings/data/mockData';
import {
  calculateDiscountRate,
  calculateMonthlyPrice,
} from '@/shared/utils/plan';

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
  const [period, setPeriod] = React.useState<PlanPeriod>('monthly');
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);

  const handleSelectPlan = (planType: string) => {
    setSelectedPlan(planType);
  };

  const handleUpgrade = () => {
    if (!selectedPlan) {
      alert('플랜을 선택해주세요.');
      return;
    }
    // TODO: 플랜 업그레이드 처리
    console.log('Upgrading to plan:', selectedPlan, 'period:', period);
  };

  const plans = React.useMemo(
    () =>
      period === 'monthly'
        ? [
            {
              name: '플러스',
              ...plusPlan,
              originalPrice: plusPlan.price * 12,
              discountedPrice: plusPlan.price,
              discountRate: 0,
            },
            {
              name: '프로',
              ...proPlan,
              originalPrice: proPlan.price * 12,
              discountedPrice: proPlan.price,
              discountRate: 0,
            },
          ]
        : [
            {
              name: '플러스',
              ...yearPlusPlan,
              originalPrice: plusPlan.price * 12,
              discountedPrice: calculateMonthlyPrice(yearPlusPlan.price),
              discountRate: calculateDiscountRate(
                plusPlan.price,
                yearPlusPlan.price
              ),
            },
            {
              name: '프로',
              ...yearProPlan,
              originalPrice: proPlan.price * 12,
              discountedPrice: calculateMonthlyPrice(yearProPlan.price),
              discountRate: calculateDiscountRate(
                proPlan.price,
                yearProPlan.price
              ),
            },
          ],
    [period]
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="w-5/6 max-w-full">
      <div className="flex flex-col items-center gap-y-12">
        <Title className="pt-4" as="h2">
          마음토스 플랜 업그레이드
        </Title>
        {/* Period Toggle */}
        <div className="flex w-fit justify-center gap-1 rounded-lg bg-surface-contrast p-1">
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
        </div>

        {/* Plan Cards */}
        <div className="flex w-full justify-center gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className="max-w-md flex-1">
              <PlanCard
                name={plan.name}
                description={plan.description}
                audioCredit={plan.audio_credit}
                summaryCredit={plan.summary_credit}
                originalPrice={plan.originalPrice}
                discountedPrice={plan.discountedPrice}
                discountRate={plan.discountRate}
                isYearly={period === 'yearly'}
                isSelected={selectedPlan === plan.type}
                onSelect={() => handleSelectPlan(plan.type)}
              />
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col items-center gap-y-2">
          <Text>결제 약관에 동의합니다.</Text>
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            disabled={!selectedPlan}
            onClick={handleUpgrade}
            className="w-full max-w-lg"
          >
            플랜 업그레이드
          </Button>
        </div>
      </div>
    </Modal>
  );
};
