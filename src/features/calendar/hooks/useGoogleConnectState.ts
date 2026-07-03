import React from 'react';

import type { CalendarCategory } from '../types';

/**
 * 외부 캘린더 연동 표시 상태 — 데스크탑 사이드탭(CalendarSidebar)과 모바일 필터 시트
 * (MobileFilterSheet)가 동일 규칙을 공유한다(중복 구현 방지).
 *
 * - hasConnectedCalendars: 하나라도 연결돼야 '나의 캘린더' 영역 노출
 * - googleConnected: 구글 연동 시 연동 카드/컴팩트 버튼 숨김
 * - connectCardDismissed: 카드 X 닫힘 — '일정 표시' 아래 컴팩트 '캘린더 연결하기' 버튼으로 대체
 */
export function useGoogleConnectState(categories: CalendarCategory[]): {
  hasConnectedCalendars: boolean;
  googleConnected: boolean;
  connectCardDismissed: boolean;
  dismissConnectCard: () => void;
} {
  const [connectCardDismissed, setConnectCardDismissed] = React.useState(false);

  return {
    hasConnectedCalendars: categories.length > 0,
    googleConnected: categories.some((c) => c.sourceProvider === 'google'),
    connectCardDismissed,
    dismissConnectCard: React.useCallback(
      () => setConnectCardDismissed(true),
      []
    ),
  };
}
