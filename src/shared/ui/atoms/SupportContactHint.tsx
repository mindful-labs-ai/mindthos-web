import React from 'react';

import {
  SUPPORT_KAKAO_URL,
  SUPPORT_LINK_LABEL,
  SUPPORT_TRIGGER_PHRASE,
} from '@/shared/constants/support';

export interface SupportContactHintProps {
  /** 화면에 표시 중인 오류 메시지. 트리거 문구가 없으면 아무것도 그리지 않는다 */
  message?: string | null;
}

/**
 * 인라인 오류 메시지 옆에 문의 링크를 붙인다.
 *
 * 토스트는 Toast 컴포넌트가 같은 일을 자동으로 하지만, setError로 폼이나
 * 사이드바에 직접 그리는 오류에는 문의 경로가 없었다. 판단 기준은 토스트와
 * 같게 둔다 — 메시지에 `잠시 후 다시 시도해 주세요`가 있을 때만 붙어서,
 * 입력값 오류처럼 사용자가 스스로 고칠 수 있는 경우에는 나타나지 않는다.
 */
export const SupportContactHint: React.FC<SupportContactHintProps> = ({
  message,
}) => {
  if (!message?.includes(SUPPORT_TRIGGER_PHRASE)) return null;

  return (
    <>
      {' '}
      <a
        href={SUPPORT_KAKAO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline lg:hover:text-primary-hover"
      >
        {SUPPORT_LINK_LABEL}
      </a>
    </>
  );
};
