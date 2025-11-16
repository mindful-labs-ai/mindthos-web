import React from 'react';

import { Text } from '@/components/ui';
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
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="마음토스 플랜 업그레이드"
      className="max-w-5xl"
    >
      <div className="mx-24 mb-16 mt-8 flex flex-col items-center space-y-6">
        <div className="flex w-fit justify-center gap-2 rounded-lg bg-surface-contrast p-2">
          <button
            onClick={() => setPeriod('monthly')}
            className={`rounded-lg px-8 py-3 text-sm font-medium transition-colors ${
              period === 'monthly'
                ? 'bg-surface'
                : 'text-fg-muted hover:bg-surface-strong'
            }`}
          >
            월 구독
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`rounded-lg px-8 py-3 text-sm font-medium transition-colors ${
              period === 'yearly'
                ? 'bg-surface'
                : 'text-fg-muted hover:bg-surface-strong'
            }`}
          >
            연 구독
          </button>
        </div>

        {/* Plan Cards */}
        <div className="flex w-full flex-col justify-center gap-6 md:flex-row">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              name={plan.name}
              description={plan.description}
              audioCredit={plan.audio_credit}
              summaryCredit={plan.summary_credit}
              originalPrice={plan.originalPrice}
              discountedPrice={plan.discountedPrice}
              discountRate={plan.discountRate}
              isYearly={period === 'yearly'}
              onSelect={() => handleSelectPlan(plan.type)}
            />
          ))}
        </div>

        <Text className="text-sm text-fg">결제 약관에 동의합니다.</Text>

        {/* Upgrade Button */}
        <Button
          variant="solid"
          tone="primary"
          size="lg"
          disabled={!selectedPlan}
          onClick={handleUpgrade}
          className="w-full"
        >
          플랜 업그레이드
        </Button>
      </div>
    </Modal>
  );
};
