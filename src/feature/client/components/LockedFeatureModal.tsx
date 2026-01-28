import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';

interface LockedFeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LockedFeatureModal: React.FC<LockedFeatureModalProps> = React.memo(
  ({ open, onOpenChange }) => {
    return (
      <Modal open={open} onOpenChange={onOpenChange} className="max-w-md">
        <div className="flex flex-col items-center py-4">

          <Title as="h2" className="mb-8 text-center font-bold text-fg">
            출시 예정 기능
          </Title>


          <div className="mb-6 flex flex-col items-center">
            <Title as="h3" className="mb-4 text-center font-bold text-fg">
              해당 기능은 현재 개발 중입니다
            </Title>
            <Text className="text-center text-base text-fg-muted">
              기능이 출시되면 업데이트 알림을 통해
              <br />
              소식을 알려드릴게요.
            </Text>
          </div>


          <div className="flex w-full max-w-[375px] gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              확인
            </button>
          </div>
        </div>
      </Modal>
    );
  }
);

LockedFeatureModal.displayName = 'LockedFeatureModal';
