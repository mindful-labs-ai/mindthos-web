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
          label: '상담 노트 작성',
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
    <div className="space-y-4 rounded-lg border bg-surface-contrast p-6">
      <Title as="h4" className="font-medium text-fg-muted">
        남은 크레딧으로 사용 가능
      </Title>
      <div className="flex gap-2 text-left">
        <div className="flex flex-1 flex-col gap-3">
          <Text className="text-sm font-medium text-fg-muted">녹음 변환</Text>
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
        <div className="flex flex-1 flex-col gap-3">
          <Text className="text-sm font-medium text-fg-muted">
            AI 상담 노트 및 분석
          </Text>
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
