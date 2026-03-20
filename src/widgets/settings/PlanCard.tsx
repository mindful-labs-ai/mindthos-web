import React from 'react';

import { CheckIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
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
  isCurrent?: boolean;
  onSelect: () => void;
  /** 모바일: 가격을 상단 우측에 배치 */
  compact?: boolean;
}

export type PlanKey = '스타터' | '플러스' | '프로';

export const planFeature = {
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
      style: 'font-headline text-primary',
      sub: null,
    },
    1: {
      text: '모든 사례개념화 노트',
      style: 'font-headline',
      sub: '사용 가능',
    },
    2: {
      text: '모든 이론 AI 슈퍼비전',
      style: 'font-headline',
      sub: '사용 가능',
    },
  },
  프로: {
    0: {
      text: '플러스 모든 기능 포함',
      style: 'font-headline text-primary',
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
  // originalPrice,
  // discountRate = 0,
  isYearly = false,
  isSelected = false,
  isCurrent = false,
  onSelect,
  compact = false,
}) => {
  const features = planFeature[name as PlanKey];

  if (!features) return null;

  // 현재 이용 중인 플랜 스타일
  const getBorderClass = () => {
    if (isCurrent) return 'border-2 border-grey-20';
    if (isSelected) return 'border-2 border-green-80';
    return 'border border-border hover:border-2';
  };

  return (
    <div
      className={`h-full w-full select-none rounded-xl bg-white text-left transition-all lg:w-72 ${isCurrent ? 'cursor-not-allowed' : 'cursor-pointer'} ${getBorderClass()}`}
    >
      <div className="flex h-full flex-col justify-between space-y-6 p-6">
        <div
          className={`space-y-6 ${isCurrent ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-xl font-headline text-grey-100">
                    {name}
                  </h3>
                  {name === '플러스' && (
                    <span className="rounded-xl bg-green-80 px-3 py-0.5 text-xs font-medium text-white">
                      인기
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-grey-60">
                  {description}
                </p>
              </div>
              {compact && (
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-headline text-grey-100">
                      {formatPrice(price)}원
                    </span>
                    <span className="text-sm text-grey-60">
                      /{isYearly ? '년' : '월'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckIcon size={18} className="flex-shrink-0 text-primary" />
              <Text className="typo-sm">
                <span className="font-emphasize">
                  {totalCredit.toLocaleString()} 크레딧
                </span>{' '}
                / 월
              </Text>
            </div>
            {Object.entries(features).map(([idx, { text, style, sub }]) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckIcon size={18} className="flex-shrink-0 text-primary" />
                <div className="flex gap-1">
                  <Text className={`typo-sm ${style}`}>{text}</Text>
                  {sub && <span className="typo-sm"> {sub}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {!compact && (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-headline text-grey-100">
                {formatPrice(price)}원
              </span>
              <span className="text-sm text-grey-60">
                /{isYearly ? '년' : '월'}
              </span>
            </div>
          )}
          <Button
            variant="outline"
            tone="primary"
            size="md"
            onClick={onSelect}
            disabled={isCurrent}
            className={`w-full ${
              isCurrent
                ? 'cursor-not-allowed border-surface bg-surface-contrast text-fg-muted'
                : name === '플러스'
                  ? 'border-none bg-gradient-to-r from-green-500 via-lime-400 to-amber-200 text-white'
                  : 'bg-transparent'
            }`}
          >
            {isCurrent
              ? '이용 중인 플랜'
              : isSelected
                ? '✓ 선택됨'
                : '시작하기'}
          </Button>
        </div>
      </div>
    </div>
  );
};
