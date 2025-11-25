import React from 'react';

import { ProgressCircle } from '@/components/ui/atoms/ProgressCircle';
import { Text } from '@/components/ui/atoms/Text';

interface CreditDisplayProps {
  totalCredit: number;
  usedCredit: number;
  planLabel: string;
  planType: string;
  daysUntilReset?: number;
  variant?: 'sidebar' | 'detailed';
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  totalCredit,
  usedCredit,
  planLabel,
  planType,
  daysUntilReset,
  variant = 'sidebar',
}) => {
  const remaining = totalCredit - usedCredit;
  const percentage =
    totalCredit > 0 ? Math.floor((remaining / totalCredit) * 100) : 0;
  const isFree = planType.toLowerCase() === 'free';

  if (variant === 'detailed') {
    return (
      <div className="flex items-center gap-4 rounded-lg p-6">
        <ProgressCircle
          value={percentage}
          size={80}
          strokeWidth={8}
          showValue={false}
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Text className="text-sm text-fg-muted">남은 크레딧:</Text>
            <Text className="text-lg">
              <span className="font-bold text-primary">
                {remaining.toLocaleString()} C
              </span>{' '}
              / {totalCredit.toLocaleString()} C
            </Text>
          </div>
          {isFree ? (
            <Text className="text-xs text-fg-muted">
              유료 플랜으로 전환하여 더 많은 크레딧을 이용하세요
            </Text>
          ) : (
            daysUntilReset !== undefined && (
              <Text className="text-xs text-fg-muted">
                {planLabel} 이용 중, 초기화까지 {daysUntilReset}일
              </Text>
            )
          )}
        </div>
      </div>
    );
  }

  // sidebar variant
  return (
    <div className="mx-3 mb-6 space-y-3 rounded-lg border-t border-border bg-surface-contrast px-1 py-4 text-left">
      <Text className="px-3 text-xs font-medium text-fg-muted">
        마음토스 크레딧
      </Text>
      <div className="flex items-center gap-2 px-3">
        <ProgressCircle
          value={percentage}
          size={36}
          strokeWidth={5}
          showValue={false}
        />
        <div className="flex-1 text-left">
          <Text className="text-sm text-fg">
            <span className="font-bold text-primary">
              {remaining.toLocaleString()} C
            </span>{' '}
            / {totalCredit.toLocaleString()} C
          </Text>
          {isFree ? (
            <Text className="text-xs text-fg-muted">
              유료 플랜으로 전환하세요
            </Text>
          ) : (
            daysUntilReset !== undefined && (
              <Text className="text-xs text-fg-muted">
                {planLabel} 이용 중, 초기화까지 {daysUntilReset}일
              </Text>
            )
          )}
        </div>
      </div>
    </div>
  );
};
