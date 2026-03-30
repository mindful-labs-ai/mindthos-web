import React from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { BADGE_ICON_MAP } from '@/shared/constants/badgeIcons';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import type { UserAccess } from '@/shared/hooks/useFeatureAccess';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';

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
  React.useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.BadgeDetailModalOpen);
    }
  }, [open]);

  const Icon = BADGE_ICON_MAP[access.type];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-[400px] border-none p-0"
    >
      <div className="flex flex-col items-center px-8 pb-6 pt-10">
        {Icon && <Icon size={96} />}

        <h2 className="typo-xl mt-6 font-headline text-fg">{access.name}</h2>

        <p className="typo-sm mt-3 text-fg-muted">
          {formatGrantedDate(access.grantedAt)}
        </p>

        <Button
          tone="primary"
          size="lg"
          onClick={() => onOpenChange(false)}
          className="mt-8 w-full font-headline"
        >
          확인
        </Button>
      </div>
    </Modal>
  );
};
