import React from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { Modal } from '@/shared/ui/composites/Modal';

interface SegmentDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SegmentDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: SegmentDeleteConfirmModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      trackEvent(MixpanelEvent.TranscriptSegmentDeleteConfirmView);
    }
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-[480px]"
    >
      <div className="flex flex-col items-center px-0 py-4 lg:px-6">
        {/* 제목 */}
        <h2 className="typo-2xl font-headline text-fg">대화 내용 삭제</h2>

        {/* 확인 문구 */}
        <p className="typo-l mt-4 text-center font-medium text-fg">
          해당 대화 내용을 삭제하시겠습니까?
        </p>

        {/* 설명 */}
        <p className="typo-sm mb-4 text-fg-muted">
          삭제된 내용은 다시 되돌릴 수 없어요.
        </p>

        {/* 초기화 버튼 */}
        <button
          onClick={() => {
            trackEvent(MixpanelEvent.TranscriptSegmentDeleteConfirm);
            onConfirm();
          }}
          className="lg:hover:bg-primary-500/90 typo-l mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-fg transition-colors"
        >
          삭제하기
        </button>
      </div>
    </Modal>
  );
}
