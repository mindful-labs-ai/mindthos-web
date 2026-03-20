import React from 'react';

import { cn } from '@/lib/cn';
import { ChevronLeftIcon } from '@/shared/icons';

export interface BackButtonProps {
  onClick: () => void;
  className?: string;
  'aria-label'?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  className,
  'aria-label': ariaLabel = '뒤로가기',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'flex size-8 items-center justify-center rounded-md',
        'border border-border text-fg-muted',

        className
      )}
    >
      <ChevronLeftIcon strokeWidth={1.5} size={24} />
    </button>
  );
};
