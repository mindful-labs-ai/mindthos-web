import React from 'react';

import { Title } from '@/shared/ui';
import { Badge } from '@/shared/ui/atoms/Badge';

export interface HomeViewProps {
  onboardingSection: React.ReactNode;
  greetingSection: React.ReactNode;
  actionCards: React.ReactNode;
  sessionList: React.ReactNode;
  isDummyFlow: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onboardingSection,
  greetingSection,
  actionCards,
  sessionList,
  isDummyFlow,
}) => {
  return (
    <div className="mx-auto w-full max-w-[1332px] p-16 text-left">
      {onboardingSection}

      {greetingSection}

      {actionCards}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Title as="h2" className="text-xl font-semibold">
              지난 상담 기록
            </Title>
            {isDummyFlow && (
              <Badge tone="warning" variant="soft" size="sm">
                예시
              </Badge>
            )}
          </div>
        </div>

        {sessionList}
      </div>
    </div>
  );
};
