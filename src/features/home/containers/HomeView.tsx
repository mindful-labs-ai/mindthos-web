import React from 'react';

export interface HomeViewProps {
  onboardingSection: React.ReactNode;
  greetingSection: React.ReactNode;
  actionCards: React.ReactNode;
  sessionSection: React.ReactNode;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onboardingSection,
  greetingSection,
  actionCards,
  sessionSection,
}) => {
  return (
    <div className="mx-auto w-full max-w-[1332px] p-16 pt-6 text-left">
      {onboardingSection}

      {greetingSection}

      {actionCards}

      {sessionSection}
    </div>
  );
};
