import React from 'react';

import type { TemplateListItem } from '@/features/template/types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { StarIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';

export interface TemplateCardProps {
  template: TemplateListItem;
  onTogglePin?: (template: TemplateListItem) => void;
  onSetDefault?: (template: TemplateListItem) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onTogglePin,
  onSetDefault,
}) => {
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent(MixpanelEvent.TemplatePinToggle, {
      template_id: template.id,
      pinned: !template.pin,
    });
    onTogglePin?.(template);
  };

  const handleDefaultClick = () => {
    if (!template.is_default) {
      trackEvent(MixpanelEvent.TemplateSetDefault, {
        template_id: template.id,
      });
      onSetDefault?.(template);
    }
  };

  return (
    <div className="h-[219px] rounded-lg border border-grey-40 bg-white">
      <div className="flex h-full flex-col space-y-4 p-6 text-left">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-l font-headline text-grey-100">
            {template.title}
          </h3>
          <button
            type="button"
            onClick={handlePinClick}
            className="flex-shrink-0 text-grey-60 transition-colors hover:text-green-80"
            aria-label={template.pin ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <StarIcon
              size={20}
              fill={template.pin ? 'currentColor' : 'none'}
              className={template.pin ? 'text-green-80' : ''}
            />
          </button>
        </div>

        <p className="flex-1 overflow-y-auto text-left text-m font-medium text-grey-100">
          {template.description}
        </p>

        {template.is_default ? (
          <div className="inline-flex h-8 w-fit select-none items-center justify-center rounded-sm bg-green-80 px-3 text-sm font-medium text-white">
            기본 노트로 설정됨
          </div>
        ) : (
          <Button
            tone="neutral"
            size="sm"
            onClick={handleDefaultClick}
            className="w-fit bg-grey-40"
          >
            기본 노트로 변경하기
          </Button>
        )}
      </div>
    </div>
  );
};
