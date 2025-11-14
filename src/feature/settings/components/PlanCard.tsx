import React from 'react';

import { Check } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { formatPrice } from '@/shared/utils/format';

export interface PlanCardProps {
  name: string;
  description: string;
  audioCredit: number;
  summaryCredit: number;
  originalPrice: number;
  discountedPrice: number;
  discountRate: number;
  isYearly?: boolean;
  onSelect: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  name,
  description,
  audioCredit,
  summaryCredit,
  originalPrice,
  discountedPrice,
  discountRate,
  isYearly = false,
  onSelect,
}) => {
  return (
    <Card className="h-full text-left">
      <Card.Body className="flex h-full flex-col justify-between space-y-6 p-6">
        <div className="space-y-6">
          <div>
            <Title as="h3" className="mb-2 text-xl font-bold">
              {name}
            </Title>
            <Text className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">
              {description}
            </Text>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Check size={18} className="flex-shrink-0 text-primary" />
              <Text className="text-sm">
                축어록 풀기 월 {audioCredit.toLocaleString()}분
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Check size={18} className="flex-shrink-0 text-primary" />
              <Text className="text-sm">
                AI 요약 월 {summaryCredit.toLocaleString()}회
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Check size={18} className="flex-shrink-0 text-primary" />
              <Text className="text-sm">모든 상담 노트 템플릿</Text>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1">
              <div className="h-4">
                {discountRate > 0 && (
                  <Text className="text-xs text-fg-muted line-through">
                    연 {formatPrice(originalPrice)}원
                  </Text>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <Title as="h2" className="text-3xl font-bold">
                  {formatPrice(discountedPrice)}원
                </Title>
                <Text className="text-sm text-fg-muted">
                  /{isYearly ? '년' : '월'}
                </Text>
              </div>
            </div>
            <div className="flex h-[40px] w-[72px] flex-shrink-0 items-center justify-center">
              {discountRate > 0 && (
                <div className="bg-primary/10 rounded-full border-2 border-primary px-3 py-1.5">
                  <Text className="text-sm font-bold text-primary">
                    {discountRate}%
                  </Text>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="solid"
            tone="primary"
            size="md"
            onClick={onSelect}
            className="w-full"
          >
            시작하기
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};
