/**
 * 상담노트 재생성 확인 모달
 * 첫 번째 재생성은 무료, 이후는 10 크레딧 소모
 */

import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';

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
      return (
        <Modal open={open} onOpenChange={onOpenChange} className="max-w-md">
          <div className="flex flex-col items-center py-4">
            {/* 제목 */}
            <Title as="h2" className="mb-8 text-center font-bold text-fg">
              상담 노트 재생성
            </Title>

            {/* 내용 */}
            <div className="mb-6 flex flex-col items-center">
              <Title as="h3" className="mb-4 text-center font-bold text-fg">
                {templateName ? `'${templateName}'를` : ''} 다시
                생성하시겠습니까?
              </Title>
              <Text className="text-center text-base text-fg-muted">
                현재의 축어록을 기반으로 다시 노트를 생성합니다. <br />
                이전 상담노트는 삭제됩니다.
              </Text>
            </div>

            {/* 크레딧 뱃지 (첫 번째 재생성이 아닌 경우에만 표시) */}
            {!isFirstRegeneration && (
              <div className="flex items-center gap-1 rounded-lg bg-primary-100 px-3 py-1">
                <Text className="font-bold text-primary-600">
                  {REGENERATE_CREDIT}
                </Text>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary-600"
                >
                  <g clipPath="url(#clip0_regenerate_credit)">
                    <path
                      d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                      fill="currentColor"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_regenerate_credit">
                      <rect width="14" height="14" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <Text className="text-primary-600">사용</Text>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex w-full max-w-[375px] gap-2 pt-2">
              <button
                onClick={onConfirm}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
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
