import { useEffect } from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { Modal } from '@/shared/ui/composites/Modal';

interface GenerationConfirmModalProps {
  isOpen: boolean;
  hasUnsavedChanges: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 가계도 생성 확인 모달
 * - 편집 중인 카드가 있으면 저장하라는 안내
 * - 없으면 생성 확인 안내
 * (크레딧 체크는 ConfirmStep에서 이미 완료)
 */
export function GenerationConfirmModal({
  isOpen,
  hasUnsavedChanges,
  onClose,
  onConfirm,
}: GenerationConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      trackEvent(MixpanelEvent.GenogramGenerationConfirmModalOpen);
    }
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-[500px]"
    >
      <div className="py-4 text-center">
        {/* 제목 */}
        <h2 className="typo-xl mb-8 font-headline text-fg">가계도 생성 시작</h2>

        {/* 내용 */}
        {hasUnsavedChanges ? (
          <>
            <p className="typo-l mb-2 font-medium text-fg">
              저장하지 않은 구성원/관계가 있습니다.
            </p>
            <p className="typo-sm mb-8 text-fg-muted">
              편집 중인 카드를 저장한 후 다시 시도해주세요.
            </p>
            <button
              onClick={onClose}
              className="typo-l lg:hover:bg-primary-600 h-14 w-full rounded-xl bg-primary font-medium text-primary-fg transition-colors"
            >
              확인
            </button>
          </>
        ) : (
          <>
            <p className="typo-l mb-2 font-medium text-fg">
              이 내용으로 가계도를 제작할까요?
            </p>
            <p className="typo-sm mb-8 text-fg-muted">
              구성원 정보에 수정이 필요한 내용이 있다면
              <br />
              미리 작성해주세요.
            </p>
            <button
              onClick={onConfirm}
              className="typo-l lg:hover:bg-primary-600 h-14 w-full rounded-xl bg-primary font-medium text-primary-fg transition-colors"
            >
              생성 시작하기
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
