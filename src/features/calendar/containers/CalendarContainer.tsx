import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useDevice } from '@/shared/hooks/useDevice';

import { calendarDataSource } from '../adapters';
import type { AddEventDraft } from '../components/sidebar/AddEventPanel';
import {
  useCalendarCategories,
  useCalendarEvents,
} from '../hooks/useCalendarEvents';
import { useCalendarState } from '../hooks/useCalendarState';
import type { CalendarEventInput } from '../types';
import { minutesToHHmm, type Dayjs } from '../utils/calendarDate';

import { CalendarView } from './CalendarView';
import { MobileCalendarView } from './MobileCalendarView';

/**
 * 캘린더 컨테이너 — 상태/데이터/필터 로직.
 * 데이터는 어댑터(mock) 경유. 표시 필터(kind/category)를 적용해 View에 전달.
 */
export default function CalendarContainer() {
  const queryClient = useQueryClient();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const {
    viewMode,
    setViewMode,
    current,
    setCurrent,
    goPrev,
    goNext,
    kindVisible,
    toggleKind,
    categoryVisible,
    toggleCategory,
    setCategoryDefault,
    sidePanel,
    addEventKind,
    addEventTime,
    editingEvent,
    openEditEvent,
    openSeq,
    openAddEvent,
    openAddCalendar,
    closePanel,
    selectedDate,
    setSelectedDate,
  } = useCalendarState();

  const { data: events = [] } = useCalendarEvents(viewMode, current);
  const { data: categories = [] } = useCalendarCategories();

  // 카테고리 로드 시 기본 표시(true)로 등록
  React.useEffect(() => {
    categories.forEach((category) => setCategoryDefault(category.id));
  }, [categories, setCategoryDefault]);

  // 표시 필터 적용: kind 표시 && (카테고리 없음 || 카테고리 표시)
  const visibleEvents = React.useMemo(
    () =>
      events.filter(
        (e) =>
          kindVisible[e.kind] &&
          (!e.categoryId || categoryVisible[e.categoryId] !== false)
      ),
    [events, kindVisible, categoryVisible]
  );

  // 단일 클릭:
  //  - 추가 모드: 선택 날짜만 갱신(작성 중 내용 유지)
  //  - 편집 모드: 그 날짜의 '새 일정 추가' 모드로 전환(기본값 초기화)
  //  - 패널 닫힘: 아무 동작 안 함
  const handleDateClick = React.useCallback(
    (day: Dayjs) => {
      if (sidePanel !== 'addEvent') return;
      if (editingEvent) openAddEvent('counseling', day);
      else setSelectedDate(day);
    },
    [sidePanel, editingEvent, openAddEvent, setSelectedDate]
  );

  // 더블 클릭(데스크탑): 추가 모드(편집 아님)면 날짜만 갱신, 그 외(닫힘/편집)는 추가 모드로 오픈
  const handleDateDoubleClick = React.useCallback(
    (day: Dayjs) => {
      if (sidePanel === 'addEvent' && !editingEvent) setSelectedDate(day);
      else openAddEvent('counseling', day);
    },
    [sidePanel, editingEvent, setSelectedDate, openAddEvent]
  );

  // 주간 드래그: 선택한 시간 범위로 일정 추가 패널 오픈
  const handleWeekRange = React.useCallback(
    (day: Dayjs, startMin: number, endMin: number) => {
      openAddEvent('counseling', day, {
        start: minutesToHHmm(startMin),
        end: minutesToHHmm(endMin),
      });
    },
    [openAddEvent]
  );

  // 일정 추가/변경 제출: 편집 중이면 update, 아니면 create → 쿼리 무효화
  const handleSubmitEvent = React.useCallback(
    async (draft: AddEventDraft) => {
      const date = selectedDate ?? current;
      const [sh, sm] = draft.startTime.split(':').map(Number);
      const [eh, em] = draft.endTime.split(':').map(Number);
      const start = date
        .hour(sh || 0)
        .minute(sm || 0)
        .second(0);
      const end = date
        .hour(eh || 0)
        .minute(em || 0)
        .second(0);

      // 종류가 그대로면 기존 색/카테고리 유지, 바뀌면 kind 기본값으로
      const colorKey =
        editingEvent && editingEvent.kind === draft.kind
          ? editingEvent.colorKey
          : draft.kind === 'counseling'
            ? 'green'
            : 'red';
      const input: CalendarEventInput = {
        title: draft.title.trim() || '(제목 없음)',
        kind: draft.kind,
        colorKey,
        start: start.toISOString(),
        end: end.toISOString(),
        categoryId: editingEvent
          ? editingEvent.categoryId
          : draft.kind === 'counseling'
            ? 'cat-mindthos'
            : undefined,
      };

      if (editingEvent) {
        await calendarDataSource.updateEvent?.(editingEvent.id, input);
      } else {
        await calendarDataSource.createEvent?.(input);
      }
      await queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
      closePanel();
    },
    [selectedDate, current, editingEvent, queryClient, closePanel]
  );

  if (isMobileView) {
    return (
      <MobileCalendarView
        current={current}
        viewMode={viewMode}
        events={visibleEvents}
        categories={categories}
        kindVisible={kindVisible}
        categoryVisible={categoryVisible}
        sidePanel={sidePanel}
        addEventKind={addEventKind}
        addEventTime={addEventTime}
        editingEvent={editingEvent}
        openSeq={openSeq}
        selectedDate={selectedDate}
        onViewModeChange={setViewMode}
        onSetCurrent={setCurrent}
        onToggleKind={toggleKind}
        onToggleCategory={toggleCategory}
        onEventClick={openEditEvent}
        onOpenAddEvent={openAddEvent}
        onOpenAddCalendar={openAddCalendar}
        onClosePanel={closePanel}
        onSelectDate={setSelectedDate}
        onSubmitEvent={handleSubmitEvent}
      />
    );
  }

  return (
    <CalendarView
      current={current}
      viewMode={viewMode}
      events={visibleEvents}
      categories={categories}
      kindVisible={kindVisible}
      categoryVisible={categoryVisible}
      onPrev={goPrev}
      onNext={goNext}
      onViewModeChange={setViewMode}
      onToggleKind={toggleKind}
      onToggleCategory={toggleCategory}
      onPrevMonth={() => setCurrent(current.subtract(1, 'month'))}
      onNextMonth={() => setCurrent(current.add(1, 'month'))}
      sidePanel={sidePanel}
      addEventKind={addEventKind}
      addEventTime={addEventTime}
      editingEvent={editingEvent}
      openSeq={openSeq}
      selectedDate={selectedDate}
      onDateClick={handleDateClick}
      onSelectDate={setSelectedDate}
      onDateDoubleClick={handleDateDoubleClick}
      onEventClick={openEditEvent}
      onCreateRange={handleWeekRange}
      onOpenAddEvent={openAddEvent}
      onOpenAddCalendar={openAddCalendar}
      onClosePanel={closePanel}
      onSubmitEvent={handleSubmitEvent}
    />
  );
}
