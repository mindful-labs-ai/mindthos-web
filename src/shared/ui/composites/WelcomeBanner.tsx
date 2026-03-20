import React from 'react';

import { XIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';

export interface WelcomeBannerProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  onClose?: () => void;
  className?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
  onClose,
  className = '',
}) => {
  return (
    <div
      className={`welcome-banner-height text-primary-fg from-green-80 relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r to-amber-200 p-5 transition-all md:p-12 ${className}`}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="hover:bg-primary-fg/20 absolute right-6 top-4 rounded-full p-1"
          aria-label="배너 닫기"
        >
          <XIcon size={20} />
        </button>
      )}
      <div className="flex flex-col gap-y-4">
        <h2 className="welcome-banner-title">{title}</h2>
        <p className="typo-m font-emphasize text-primary-fg/90">
          {description}
        </p>
      </div>
      <Button
        onClick={onButtonClick}
        variant="solid"
        size="md"
        className="hover:bg-surface/90 absolute bottom-6 right-4 bg-surface px-8 text-primary"
      >
        {buttonText}
      </Button>
    </div>
  );
};
