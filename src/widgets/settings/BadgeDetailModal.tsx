import React from 'react';

import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';
import type { UserAccess } from '@/shared/hooks/useFeatureAccess';

import { BADGE_ICON_MAP } from '@/features/settings/constants/badgeIcons';

function formatGrantedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} 획득`;
}

interface BadgeDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  access: UserAccess;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  open,
  onOpenChange,
  access,
}) => {
  const Icon = BADGE_ICON_MAP[access.type];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-[400px] border-none p-0"
    >
      <div className="flex flex-col items-center px-8 pb-6 pt-10">
        {Icon && <Icon size={96} />}

        <h2 className="mt-6 text-xl font-bold text-fg">{access.name}</h2>

        <p className="mt-3 text-sm text-fg-muted">
          {formatGrantedDate(access.grantedAt)}
        </p>

        <Button
          tone="primary"
          size="lg"
          onClick={() => onOpenChange(false)}
          className="mt-8 w-full font-bold"
        >
          확인
        </Button>
      </div>
    </Modal>
  );
};
