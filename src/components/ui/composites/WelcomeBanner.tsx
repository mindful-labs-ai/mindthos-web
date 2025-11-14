import React from 'react';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';

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
      className={`relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-primary-500 to-primary-300 px-8 py-12 text-white shadow-lg ${className}`}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-6 top-4 rounded-full p-1 hover:bg-white/20"
          aria-label="배너 닫기"
        >
          <X size={20} />
        </button>
      )}
      <div className="flex flex-col gap-y-4">
        <Title as="h2" className="text-2xl font-semibold text-white">
          {title}
        </Title>
        <Text className="text-base font-semibold text-white/90">
          {description}
        </Text>
      </div>
      <Button
        onClick={onButtonClick}
        variant="solid"
        size="sm"
        className="absolute bottom-6 right-4 bg-white text-primary-500 hover:bg-white/90"
      >
        {buttonText}
      </Button>
    </div>
  );
};
