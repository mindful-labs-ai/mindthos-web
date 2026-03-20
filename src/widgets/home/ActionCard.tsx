import React from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { cn } from '@/lib/cn';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';

export interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  onClick,
  className,
}) => {
  const handleClick = () => {
    trackEvent(MixpanelEvent.ActionCardClick, { title });
    onClick();
  };

  return (
    <button
      className={cn(
        'w-full cursor-pointer rounded-2xl border border-grey-30 bg-white px-1 py-4 transition-all',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex flex-col items-start justify-center gap-3 px-4 text-center md:gap-4 md:px-6 md:py-4">
        <div className="flex size-11 items-center justify-center rounded-md border border-grey-30">
          {icon}
        </div>
        <p className="action-card-title">{title}</p>
      </div>
    </button>
  );
};
