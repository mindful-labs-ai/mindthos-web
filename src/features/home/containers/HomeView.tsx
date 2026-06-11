import React from 'react';

export interface HomeViewProps {
  /** 상단 이벤트 배너 띠 */
  eventBanner?: React.ReactNode;
  onboardingSection: React.ReactNode;
  greetingSection: React.ReactNode;
  actionCards: React.ReactNode;
  sessionSection: React.ReactNode;
}

export const HomeView: React.FC<HomeViewProps> = ({
  eventBanner,
  onboardingSection,
  greetingSection,
  actionCards,
  sessionSection,
}) => {
  return (
    <div className="mx-auto w-full max-w-[1332px] p-16 text-left">
      {eventBanner}

      {onboardingSection}

      {greetingSection}

      {actionCards}

      {sessionSection}
    </div>
  );
};
