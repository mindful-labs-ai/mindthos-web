import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';

interface CreditUsageInfoProps {
  remainingCredit: number;
}

interface UsageTypes {
  perMinutes: UsageItems[];
  perCounts: UsageItems[];
}

interface UsageItems {
  label: string;
  amount: string;
}

export const CreditUsageInfo: React.FC<CreditUsageInfoProps> = ({
  remainingCredit,
}) => {
  const calculateUsage = (): UsageTypes => {
    const basicTranscript = Math.floor(remainingCredit);
    const advancedTranscript = Math.floor(remainingCredit / 1.5);
    const sessionNotes = Math.floor(remainingCredit / 10);
    const clientAnalysis = Math.floor(remainingCredit / 50);

    return {
      perMinutes: [
        {
          label: '일반 축어록',
          amount: `${basicTranscript.toLocaleString()}분`,
        },
        {
          label: '고급 축어록',
          amount: `${advancedTranscript.toLocaleString()}분`,
        },
      ],
      perCounts: [
        {
          label: '상담 노트 생성',
          amount: `${sessionNotes.toLocaleString()}회`,
        },
        {
          label: '클라이언트 사례 분석',
          amount: `${clientAnalysis.toLocaleString()}회`,
        },
      ],
    };
  };

  const usageItems = calculateUsage();

  return (
    <div className="flex-1 space-y-4 rounded-lg bg-surface-contrast p-6">
      <Title as="h3" className="text-base font-semibold text-fg-muted">
        남은 크레딧으로 사용 가능
      </Title>
      <div className="flex justify-center gap-12 text-left">
        <div className="flex flex-col gap-6">
          {usageItems.perMinutes.map((item, index) => (
            <div key={index} className="flex gap-6">
              <Text as="p" className="text-sm font-medium text-fg">
                {item.label}
              </Text>
              <Text as="p" className="text-sm font-bold text-fg">
                {item.amount}
              </Text>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          {usageItems.perCounts.map((item, index) => (
            <div key={index} className="flex gap-6">
              <Text as="p" className="text-sm font-medium text-fg">
                {item.label}
              </Text>
              <Text as="p" className="text-sm font-bold text-fg">
                {item.amount}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
