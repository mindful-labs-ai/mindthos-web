import React from 'react';

import type {
  CalendarEvent,
  CalendarEventKind,
  CalendarViewMode,
} from '../types';
import { dayjs } from '../utils/calendarDate';
import type { Dayjs } from '../utils/calendarDate';

const ALL_KINDS_VISIBLE: Record<CalendarEventKind, boolean> = {
  holiday: true,
  counseling: true,
  personal: true,
};

/** 우측 사이드 패널 상태 */
export type CalendarSidePanel = 'default' | 'addEvent' | 'addCalendar';

const DEFAULT_EVENT_TIME = { start: '11:00', end: '12:00' };

export interface CalendarState {
  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;
  /** 현재 포커스된 날짜(보고 있는 월/주 기준) */
  current: Dayjs;
  setCurrent: (date: Dayjs) => void;
  goPrev: () => void;
  goNext: () => void;
  goToday: () => void;
  /** kind별 표시 여부 ('일정 표시' 토글) */
  kindVisible: Record<CalendarEventKind, boolean>;
  toggleKind: (kind: CalendarEventKind) => void;
  /** 카테고리별 표시 여부 ('나의 캘린더' 토글) */
  categoryVisible: Record<string, boolean>;
  toggleCategory: (categoryId: string) => void;
  setCategoryDefault: (categoryId: string) => void;
  /** 사이드 패널 (일정 추가 / 캘린더 추가) */
  sidePanel: CalendarSidePanel;
  addEventKind: CalendarEventKind;
  /** 일정 추가 패널 초기 시간 (주간 드래그/기본값) */
  addEventTime: { start: string; end: string };
  openAddEvent: (
    kind: CalendarEventKind,
    date?: Dayjs,
    time?: { start: string; end: string }
  ) => void;
  openAddCalendar: () => void;
  closePanel: () => void;
  /** 편집 중인 일정 (있으면 패널이 '변경하기' 모드) */
  editingEvent: CalendarEvent | null;
  openEditEvent: (event: CalendarEvent) => void;
  /** 패널 오픈 시퀀스 — AddEventPanel key로 사용해 매 오픈마다 폼 초기화 */
  openSeq: number;
  /** 일정 추가 시 선택된 날짜 (달력에 테두리로 동기화) */
  selectedDate: Dayjs | null;
  setSelectedDate: (date: Dayjs) => void;
}

/**
 * 캘린더 화면 상태 (뷰모드 / 현재 날짜 / 표시 필터 / 사이드 패널 / 선택 날짜).
 * 로컬 상태로 충분 — 전역 공유 필요 없음.
 */
export function useCalendarState(): CalendarState {
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>('month');
  const [current, setCurrent] = React.useState<Dayjs>(() => dayjs());
  const [kindVisible, setKindVisible] =
    React.useState<Record<CalendarEventKind, boolean>>(ALL_KINDS_VISIBLE);
  const [categoryVisible, setCategoryVisible] = React.useState<
    Record<string, boolean>
  >({});
  const [sidePanel, setSidePanel] =
    React.useState<CalendarSidePanel>('default');
  const [addEventKind, setAddEventKind] =
    React.useState<CalendarEventKind>('counseling');
  const [addEventTime, setAddEventTime] = React.useState(DEFAULT_EVENT_TIME);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(
    null
  );
  const [openSeq, setOpenSeq] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  const step = viewMode === 'month' ? 'month' : 'week';

  const goPrev = React.useCallback(
    () => setCurrent((d) => d.subtract(1, step)),
    [step]
  );
  const goNext = React.useCallback(
    () => setCurrent((d) => d.add(1, step)),
    [step]
  );
  const goToday = React.useCallback(() => setCurrent(dayjs()), []);

  const toggleKind = React.useCallback((kind: CalendarEventKind) => {
    setKindVisible((prev) => ({ ...prev, [kind]: !prev[kind] }));
  }, []);

  const toggleCategory = React.useCallback((categoryId: string) => {
    setCategoryVisible((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  }, []);

  /** 카테고리 목록 로드 시 기본 표시(true)로 등록 */
  const setCategoryDefault = React.useCallback((categoryId: string) => {
    setCategoryVisible((prev) =>
      categoryId in prev ? prev : { ...prev, [categoryId]: true }
    );
  }, []);

  const openAddEvent = React.useCallback(
    (
      kind: CalendarEventKind,
      date?: Dayjs,
      time?: { start: string; end: string }
    ) => {
      setEditingEvent(null);
      setAddEventKind(kind);
      setSelectedDate(date ?? current);
      setAddEventTime(time ?? DEFAULT_EVENT_TIME);
      setSidePanel('addEvent');
      setOpenSeq((n) => n + 1);
    },
    [current]
  );
  const openEditEvent = React.useCallback((event: CalendarEvent) => {
    const start = dayjs(event.start);
    const end = event.end ? dayjs(event.end) : start.add(1, 'hour');
    setEditingEvent(event);
    setAddEventKind(event.kind);
    setSelectedDate(start);
    setAddEventTime({ start: start.format('HH:mm'), end: end.format('HH:mm') });
    setSidePanel('addEvent');
    setOpenSeq((n) => n + 1);
  }, []);
  const openAddCalendar = React.useCallback(
    () => setSidePanel('addCalendar'),
    []
  );
  const closePanel = React.useCallback(() => {
    setSidePanel('default');
    setSelectedDate(null);
    setEditingEvent(null);
  }, []);

  return {
    viewMode,
    setViewMode,
    current,
    setCurrent,
    goPrev,
    goNext,
    goToday,
    kindVisible,
    toggleKind,
    categoryVisible,
    toggleCategory,
    setCategoryDefault,
    sidePanel,
    addEventKind,
    addEventTime,
    openAddEvent,
    openAddCalendar,
    closePanel,
    editingEvent,
    openEditEvent,
    openSeq,
    selectedDate,
    setSelectedDate,
  };
}
