import React from 'react';

import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';

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
    <div className="space-y-4 rounded-md border border-grey-40 bg-grey-20 p-6">
      <Title
        as="h4"
        className="text-start text-sm font-sub text-grey-80 md:text-center lg:text-start"
      >
        남은 크레딧으로 사용 가능
      </Title>
      <div className="flex flex-col gap-y-5 text-left md:flex-row md:gap-2">
        <div className="flex flex-1 flex-col gap-1 md:gap-3">
          <Text className="text-sm font-sub text-grey-80">녹음 변환</Text>
          {usageItems.perMinutes.map((item, index) => (
            <div key={index} className="flex gap-6">
              <Text as="p" className="truncate text-sm font-sub text-fg">
                {item.label}
              </Text>
              <Text as="p" className="truncate text-sm font-emphasize text-fg">
                {item.amount}
              </Text>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-1 md:gap-3">
          <Text className="truncate text-sm font-sub text-grey-80">
            AI 상담 노트 및 분석
          </Text>
          {usageItems.perCounts.map((item, index) => (
            <div key={index} className="flex gap-6">
              <Text as="p" className="truncate text-sm font-sub text-fg">
                {item.label}
              </Text>
              <Text as="p" className="truncate text-sm font-emphasize text-fg">
                {item.amount}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
