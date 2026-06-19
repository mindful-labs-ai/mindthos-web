import { mockImportAdapter } from './import/mockImportAdapter';
import { realImportAdapter } from './import/realImportAdapter';
import type { CalendarImportAdapter } from './import/types';
import { mockCalendarDataSource } from './mockCalendarDataSource';
import { realCalendarDataSource } from './realCalendarDataSource';
import type { CalendarDataSource } from './types';

/**
 * 활성 어댑터 선택 지점 (단일 교체 포인트).
 *
 * 기본은 실제 mindthos-server 어댑터.
 * 백엔드 없이 UI를 확인하려면 VITE_USE_MOCK_CALENDAR=true 로 mock 사용.
 * (UI·훅은 CalendarDataSource / CalendarImportAdapter 인터페이스만 의존)
 */
const useMock = import.meta.env.VITE_USE_MOCK_CALENDAR === 'true';

export const calendarDataSource: CalendarDataSource = useMock
  ? mockCalendarDataSource
  : realCalendarDataSource;

/** 외부 캘린더 import 어댑터 (서버 매개 OAuth, apple은 비활성) */
export const calendarImportAdapter: CalendarImportAdapter = useMock
  ? mockImportAdapter
  : realImportAdapter;

export type { CalendarDataSource } from './types';
export type {
  CalendarImportAdapter,
  CalendarProvider,
  CalendarImportFinalizeInput,
  CalendarImportResult,
} from './import/types';
