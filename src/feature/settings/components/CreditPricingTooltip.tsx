import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Tooltip } from '@/components/ui/composites/Tooltip';

interface CreditPricingTooltipProps {
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const CreditPricingTooltip: React.FC<CreditPricingTooltipProps> = ({
  children,
  placement = 'bottom',
}) => {
  const tooltipContent = (
    <div className="space-y-4 p-2">
      <Title as="h4" className="text-sm font-semibold text-fg">
        마음토스 크레딧
      </Title>

      <div className="space-y-3 rounded-lg border border-surface-strong bg-surface-contrast p-3">
        <Text className="text-center text-sm font-medium text-fg-muted">
          크레딧 사용 가격
        </Text>

        {/* 음성 변환 */}
        <div className="space-y-2">
          <Text className="text-xs font-medium text-fg-muted">음성 변환</Text>
          <div className="space-y-1">
            <div className="flex gap-2">
              <Text className="text-xs text-fg">기본 축어록</Text>
              <Text className="text-xs font-semibold text-fg">
                분당 1 크레딧
              </Text>
            </div>
            <div className="flex gap-2">
              <Text className="text-xs text-fg">고급 축어록</Text>
              <Text className="text-xs font-semibold text-fg">
                분당 1.5 크레딧
              </Text>
            </div>
          </div>
        </div>

        {/* AI 상담 노트 및 분석 */}
        <div className="space-y-2">
          <Text className="text-xs font-medium text-fg-muted">
            AI 상담 노트 및 분석
          </Text>
          <div className="space-y-1">
            <div className="flex gap-2">
              <Text className="text-xs text-fg">상담 노트 생성</Text>
              <Text className="text-xs font-semibold text-fg">10 크레딧</Text>
            </div>
            <div className="flex gap-2">
              <Text className="text-xs text-fg">클라이언트 사례 분석</Text>
              <Text className="text-xs font-semibold text-fg">50 크레딧</Text>
            </div>
          </div>
        </div>
      </div>

      <Text className="text-xs text-fg">
        마음토스 크레딧을 통해 축어록 풀이 및 AI 노트를 생성할 수 있습니다.
        크레딧은 구독 날짜를 기준으로 매월 초기화됩니다.
      </Text>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} placement={placement} delay={100}>
      {children}
    </Tooltip>
  );
};
