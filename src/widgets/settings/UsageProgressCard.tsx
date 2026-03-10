// TODO: 삭제 예정 - 어디에서도 import되지 않음, 결제 UI 변경으로 미사용
import React from 'react';

import type { UsageLimit } from '@/features/settings/types';
import { ProgressCircle } from '@/shared/ui/atoms/ProgressCircle';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';

export interface UsageProgressCardProps {
  title: string;
  usage: UsageLimit;
  total: number;
  unit: string;
}

export const UsageProgressCard: React.FC<UsageProgressCardProps> = ({
  title,
  usage,
  total,
  unit,
}) => {
  const remaining = total - usage.credit;
  const percentage = Math.floor((remaining / total) * 100);

  return (
    <div className="flex flex-1 flex-row items-center justify-center gap-4 p-12">
      <ProgressCircle
        value={percentage}
        size={96}
        strokeWidth={12}
        showValue={false}
      />

      <div className="text-left">
        <Title as="h4" className="mb-1 text-base font-semibold">
          {title}
        </Title>
        <Text className="text-sm text-fg">
          <span className="font-bold text-primary">
            {remaining}
            {unit} 남음
          </span>{' '}
          / {total}
          {unit}
        </Text>
      </div>
    </div>
  );
};
