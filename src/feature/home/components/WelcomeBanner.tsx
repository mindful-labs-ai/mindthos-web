import React from 'react';

import { X } from 'lucide-react';

import { Button, Text, Title } from '@/components/ui';

interface WelcomeBannerProps {
  onClose: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onClose }) => {
  return (
    <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-primary-500 to-primary-300 px-8 py-12 text-white shadow-lg">
      <button
        onClick={onClose}
        className="absolute right-6 top-4 rounded-full p-1 hover:bg-white/20"
      >
        <X size={20} />
      </button>
      <div className="flex flex-col gap-y-4">
        <Title as="h2" className="text-2xl font-semibold text-white">
          마음토스 시작하기
        </Title>
        <Text className="text-base font-semibold text-white/90">
          아직 마음토스 사용법이 어렵다면, 가이드를 확인해보세요.
        </Text>
      </div>
      <Button
        onClick={() => {
          console.log('배너 경로 클릭');
        }}
        variant="solid"
        size="sm"
        className="absolute bottom-6 right-4 bg-white text-primary-500 hover:bg-white/90"
      >
        더 알아보기
      </Button>
    </div>
  );
};
