import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { CheckIcon } from '@/shared/icons';
import { formatPrice } from '@/shared/utils/format';

export interface PlanCardProps {
  name: string;
  description: string;
  totalCredit: number;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  isYearly?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
}

type PlanKey = '스타터' | '플러스' | '프로';

const planFeature = {
  스타터: {
    0: { text: '일반 및 고급 축어록', style: null, sub: null },
    1: { text: '상담노트 일부 양식 사용 가능', style: null, sub: null },
    2: {
      text: 'AI 수퍼비전 일부 양식 사용 가능',
      style: null,
      sub: null,
    },
  },
  플러스: {
    0: {
      text: '스타터 모든 기능 포함',
      style: 'font-bold text-primary',
      sub: null,
    },
    1: {
      text: '모든 사례개념화 노트',
      style: 'font-bold',
      sub: '사용 가능',
    },
    2: {
      text: '모든 이론 AI 슈퍼비전',
      style: 'font-bold',
      sub: '사용 가능',
    },
  },
  프로: {
    0: {
      text: '플러스 모든 기능 포함',
      style: 'font-bold text-primary',
      sub: null,
    },
    1: { text: '최신기능 우선 사용', style: null, sub: null },
    2: { text: '대용량 데이터 우선 처리', style: null, sub: null },
  },
};

export const PlanCard: React.FC<PlanCardProps> = ({
  name,
  description,
  totalCredit,
  price,
  originalPrice,
  discountRate = 0,
  isYearly = false,
  isSelected = false,
  onSelect,
}) => {
  const features = planFeature[name as PlanKey];

  if (!features) return null;

  return (
    <Card
      className={`h-full w-72 text-left transition-all ${
        isSelected
          ? 'border-2 border-primary'
          : 'border border-border hover:border-primary-100'
      }`}
    >
      <Card.Body className="flex h-full flex-col justify-between space-y-6 p-6">
        <div
          className="cursor-pointer space-y-6"
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`${name} 플랜 선택`}
        >
          <div className="relative">
            <Title as="h3" className="mb-2 text-xl font-bold">
              {name}
            </Title>
            <Text className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">
              {description}
            </Text>
            {name === '플러스' && (
              <div className="absolute right-0 top-0 rounded-xl bg-primary px-3 py-1 text-sm font-semibold text-surface">
                인기
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckIcon size={18} className="flex-shrink-0 text-primary" />
              <Text className="text-sm">
                <span className="font-semibold">
                  {totalCredit.toLocaleString()} 크레딧
                </span>{' '}
                / 월
              </Text>
            </div>
            {Object.entries(features).map(([idx, { text, style, sub }]) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckIcon size={18} className="flex-shrink-0 text-primary" />
                <div className="flex gap-1">
                  <Text className={`text-sm ${style}`}>{text}</Text>
                  {sub && <span className="text-sm"> {sub}</span>}
                </div>
              </div>
            ))}
            {/* <div className="flex items-center gap-3">
              <CheckIcon size={18} className="flex-shrink-0 text-primary" />
              <Text className="text-sm">음성 전사 + AI 요약</Text>
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon size={18} className="flex-shrink-0 text-primary" />
              <Text className="text-sm">모든 상담 노트 템플릿</Text>
            </div> */}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1">
              <div className="h-4">
                {discountRate > 0 && originalPrice && (
                  <Text className="text-xs text-fg-muted line-through">
                    {isYearly ? '연' : '월'} {formatPrice(originalPrice)}원
                  </Text>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <Title as="h2" className="text-3xl font-bold">
                  {formatPrice(price)}원
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
            variant="outline"
            tone="primary"
            size="md"
            onClick={onSelect}
            className={`w-full bg-transparent ${name === '플러스' ? 'border-none bg-gradient-to-r from-green-500 via-lime-400 to-amber-200 text-surface' : 'bg-transparent'}`}
          >
            {isSelected ? '✓ 선택됨' : '시작하기'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};
