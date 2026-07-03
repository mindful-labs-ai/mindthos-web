import React, { useState } from 'react';

import type { TemplateListItem } from '@/features/template/types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { StarIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent(MixpanelEvent.TemplatePinToggle, {
      template_id: template.id,
      pinned: !template.pin,
    });
    onTogglePin?.(template);
  };

  const handleDefaultClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!template.is_default) {
      setIsConfirmOpen(true);
    }
  };

  const handleConfirmDefault = () => {
    trackEvent(MixpanelEvent.TemplateSetDefault, {
      template_id: template.id,
    });
    onSetDefault?.(template);
    setIsConfirmOpen(false);
  };

  return (
    <div className="relative h-[219px] rounded-2xl border border-grey-40 bg-white p-7 text-left">
      {/* 즐겨찾기(별) — 우상단 */}
      <button
        type="button"
        onClick={handlePinClick}
        aria-label={template.pin ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        className="absolute right-4 top-4 transition-colors"
      >
        <StarIcon
          size={24}
          fill={template.pin ? 'currentColor' : 'none'}
          className={template.pin ? 'text-green-80' : 'text-grey-40'}
        />
      </button>

      <h3 className="line-clamp-1 pr-8 text-l font-headline text-grey-100">
        {template.title}
      </h3>
      {/* 설명 — 생략(...) 대신 스크롤로 전체 내용을 볼 수 있게. 하단 배지(absolute)와 겹치지 않도록 높이 제한. */}
      <p className="mt-4 max-h-[64px] overflow-y-auto whitespace-pre-line pr-1 text-m font-medium text-grey-100">
        {template.description}
      </p>

      {/* 기본 노트 상태 — 배지(기본) 또는 변경 버튼 — 좌하단 */}
      <div className="absolute bottom-6 left-7">
        {template.is_default ? (
          <span className="inline-flex items-center rounded-md bg-green-20 px-[19px] py-1.5 text-m font-headline text-green-80">
            기본 노트
          </span>
        ) : (
          <button
            type="button"
            onClick={handleDefaultClick}
            className="inline-flex items-center rounded-md bg-grey-20 px-[19px] py-1.5 text-m font-headline text-grey-80 transition-colors lg:hover:bg-grey-40"
          >
            기본 노트로 변경하기
          </button>
        )}
      </div>

      <Modal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        className="max-w-sm"
      >
        <div className="flex flex-col items-center gap-4 p-2 text-center">
          <p className="text-l font-emphasize text-grey-100">
            기본 노트를 변경하시겠습니까?
          </p>
          <p className="text-sm text-grey-60">
            '{template.title}'을(를) 기본 노트로 설정해요.
          </p>
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              tone="neutral"
              size="md"
              className="flex-1"
              onClick={() => setIsConfirmOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="solid"
              tone="primary"
              size="md"
              className="flex-1"
              onClick={handleConfirmDefault}
            >
              변경하기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
