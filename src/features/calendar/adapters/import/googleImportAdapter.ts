import type { CalendarEvent } from '../../types';

import type { CalendarImportAdapter } from './types';

/**
 * Google 캘린더 import 어댑터 — 스텁(미구현).
 * 후속 Phase에서 OAuth 연결 + 이벤트 매핑 구현.
 */
export const googleImportAdapter: CalendarImportAdapter = {
  provider: 'google',
  async connect(): Promise<void> {
    throw new Error('Google 캘린더 연동은 아직 구현되지 않았습니다.');
  },
  async importEvents(): Promise<CalendarEvent[]> {
    throw new Error('Google 캘린더 연동은 아직 구현되지 않았습니다.');
  },
};
