import { useQuery } from '@tanstack/react-query';

import { calendarDataSource } from '../adapters';
import type { CalendarViewMode } from '../types';
import {
  getMonthVisibleRange,
  getWeekVisibleRange,
} from '../utils/calendarDate';
import type { Dayjs } from '../utils/calendarDate';

/** 현재 보기 모드/날짜의 가시 범위 일정 조회 (어댑터 경유) */
export function useCalendarEvents(viewMode: CalendarViewMode, current: Dayjs) {
  const range =
    viewMode === 'month'
      ? getMonthVisibleRange(current)
      : getWeekVisibleRange(current);

  return useQuery({
    queryKey: ['calendar', 'events', viewMode, range.start, range.end],
    queryFn: () => calendarDataSource.listEvents(range),
    staleTime: 1000 * 60,
  });
}

/** '나의 캘린더' 카테고리 목록 조회 */
export function useCalendarCategories() {
  return useQuery({
    queryKey: ['calendar', 'categories'],
    queryFn: () => calendarDataSource.listCategories(),
    staleTime: Infinity,
  });
}
