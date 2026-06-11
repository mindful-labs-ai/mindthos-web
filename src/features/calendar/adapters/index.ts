import { googleImportAdapter } from './import/googleImportAdapter';
import type { CalendarImportAdapter, CalendarProvider } from './import/types';
import { mockCalendarDataSource } from './mockCalendarDataSource';
import type { CalendarDataSource } from './types';

/**
 * 활성 어댑터 선택 지점 (단일 교체 포인트).
 *
 * 백엔드 연결 시: 아래 한 줄을 supabase/server 어댑터로 교체하면
 * UI/훅 변경 없이 실데이터로 전환된다.
 */
export const calendarDataSource: CalendarDataSource = mockCalendarDataSource;

/** provider별 외부 캘린더 import 어댑터 (현재 google 스텁만) */
export const calendarImportAdapters: Partial<
  Record<CalendarProvider, CalendarImportAdapter>
> = {
  google: googleImportAdapter,
};

export type { CalendarDataSource } from './types';
export type { CalendarImportAdapter, CalendarProvider } from './import/types';
