// TODO: 삭제 예정 - 어디에서도 import되지 않음, 결제 UI 변경으로 미사용
import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { CheckIcon, XIcon } from '@/shared/icons';
import { formatPrice } from '@/shared/utils/format';

export interface PlanInfo {
  type: string;
  price: number;
  totalCredit: number;
}

export interface PlanComparisonCardProps {
  currentPlan: PlanInfo;
  newPlan: PlanInfo;
  type: 'downgrade' | 'cancel';
}

const planFeatures: Record<string, string[]> = {
  Free: ['일반 축어록', '기본 상담노트'],
  Plus: ['일반 및 고급 축어록', '모든 상담노트', '모든 AI 슈퍼비전'],
  Pro: ['플러스 모든 기능', '최신기능 우선 사용', '대용량 데이터 우선 처리'],
};

export const PlanComparisonCard: React.FC<PlanComparisonCardProps> = ({
  currentPlan,
  newPlan,
  type,
}) => {
  const currentFeatures = planFeatures[currentPlan.type] || [];
  const newFeatures = planFeatures[newPlan.type] || [];

  // 잃게 되는 기능 (현재 플랜에는 있지만 새 플랜에는 없는 것)
  const lostFeatures = currentFeatures.filter((f) => !newFeatures.includes(f));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        {/* 현재 플랜 */}
        <Card className="w-48 border border-border">
          <Card.Body className="p-4 text-center">
            <Text className="text-xs text-fg-muted">현재 플랜</Text>
            <Title as="h4" className="mt-1 text-lg font-bold">
              {currentPlan.type}
            </Title>
            <Text className="mt-2 text-xl font-semibold">
              {formatPrice(currentPlan.price)}원
            </Text>
            <Text className="text-xs text-fg-muted">/월</Text>
            <div className="mt-3 rounded-lg bg-bg-subtle p-2">
              <Text className="text-sm font-medium">
                {currentPlan.totalCredit.toLocaleString()} 크레딧
              </Text>
            </div>
          </Card.Body>
        </Card>

        {/* 화살표 */}
        <div className="flex flex-col items-center">
          <Text className="text-2xl text-fg-muted">→</Text>
        </div>

        {/* 새 플랜 */}
        <Card
          className={`w-48 border-2 ${type === 'cancel' ? 'border-danger' : 'border-warning'}`}
        >
          <Card.Body className="p-4 text-center">
            <Text className="text-xs text-fg-muted">
              {type === 'cancel' ? '해지 후' : '변경 후'}
            </Text>
            <Title as="h4" className="mt-1 text-lg font-bold">
              {newPlan.type}
            </Title>
            <Text className="mt-2 text-xl font-semibold">
              {newPlan.price === 0 ? '무료' : `${formatPrice(newPlan.price)}원`}
            </Text>
            {newPlan.price > 0 && (
              <Text className="text-xs text-fg-muted">/월</Text>
            )}
            <div className="mt-3 rounded-lg bg-bg-subtle p-2">
              <Text className="text-sm font-medium">
                {newPlan.totalCredit.toLocaleString()} 크레딧
              </Text>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* 잃게 되는 혜택 */}
      {lostFeatures.length > 0 && (
        <div className="border-warning bg-warning/5 rounded-lg border p-4">
          <Text className="text-warning mb-3 font-semibold">
            잃게 되는 혜택
          </Text>
          <div className="space-y-2">
            {lostFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <XIcon size={16} className="text-danger" />
                <Text className="text-sm text-fg-muted">{feature}</Text>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <XIcon size={16} className="text-danger" />
              <Text className="text-sm text-fg-muted">
                크레딧{' '}
                {(
                  currentPlan.totalCredit - newPlan.totalCredit
                ).toLocaleString()}{' '}
                감소
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* 유지되는 혜택 */}
      {newFeatures.length > 0 && (
        <div className="rounded-lg border border-border bg-bg-subtle p-4">
          <Text className="mb-3 font-semibold text-fg-muted">
            유지되는 혜택
          </Text>
          <div className="space-y-2">
            {newFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckIcon size={16} className="text-success" />
                <Text className="text-sm">{feature}</Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
