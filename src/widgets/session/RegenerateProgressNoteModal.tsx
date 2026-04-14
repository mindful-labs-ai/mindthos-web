/**
 * 상담노트 재생성 확인 모달
 * 첫 번째 재생성은 무료, 이후는 10 크레딧 소모
 */

import React from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { CreditIcon } from '@/shared/icons';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';

const REGENERATE_CREDIT = 10;

interface RegenerateProgressNoteModalProps {
  /** 모달 열림 상태 */
  open: boolean;
  /** 모달 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 확인 버튼 클릭 핸들러 */
  onConfirm: () => void;
  /** 첫 번째 재생성 여부 (무료) */
  isFirstRegeneration: boolean;
  /** 템플릿 이름 */
  templateName?: string;
}

export const RegenerateProgressNoteModal: React.FC<RegenerateProgressNoteModalProps> =
  React.memo(
    ({ open, onOpenChange, onConfirm, isFirstRegeneration, templateName }) => {
      React.useEffect(() => {
        if (open) {
          trackEvent(MixpanelEvent.ProgressNoteRegenerateModalOpen);
        }
      }, [open]);

      return (
        <Modal open={open} onOpenChange={onOpenChange} className="max-w-md">
          <div className="flex flex-col items-center py-4">
            {/* 제목 */}
            <Title as="h2" className="mb-8 text-center font-headline text-fg">
              상담 노트 재생성
            </Title>

            {/* 내용 */}
            <div className="mb-6 flex flex-col items-center">
              <Title as="h3" className="mb-4 text-center font-headline text-fg">
                {templateName ? `'${templateName}'를` : ''} 다시
                생성하시겠습니까?
              </Title>
              <Text className="typo-m text-center text-fg-muted">
                현재의 축어록을 기반으로 다시 노트를 생성합니다. <br />
                이전 상담노트는 삭제됩니다.
              </Text>
            </div>

            {/* 크레딧 뱃지 (첫 번째 재생성이 아닌 경우에만 표시) */}
            {!isFirstRegeneration && (
              <div className="flex items-center gap-1 rounded-lg bg-primary-subtle px-3 py-1">
                <span className="font-headline text-primary">
                  {REGENERATE_CREDIT}
                </span>
                <CreditIcon size={14} />
                <span className="font-medium text-green-80">사용</span>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex w-full max-w-[375px] gap-2 pt-2">
              <button
                onClick={() => {
                  trackEvent(MixpanelEvent.ProgressNoteRegenerateAttempt);
                  onConfirm();
                }}
                className="typo-sm lg:hover:bg-primary-600 w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-fg transition-colors"
              >
                다시 생성하기
              </button>
            </div>
          </div>
        </Modal>
      );
    }
  );

RegenerateProgressNoteModal.displayName = 'RegenerateProgressNoteModal';
