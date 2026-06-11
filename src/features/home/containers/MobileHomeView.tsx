import React from 'react';

import type { HomeViewProps } from './HomeView';

export const MobileHomeView: React.FC<HomeViewProps> = ({
  eventBanner,
  onboardingSection,
  greetingSection,
  actionCards,
  sessionSection,
}) => {
  return (
    <div className="w-full p-4 text-left md:p-8">
      {eventBanner}

      {onboardingSection}

      {greetingSection}

      {actionCards}

      {sessionSection}
    </div>
  );
};
