import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { useToast } from '@/shared/ui/composites/Toast';

import {
  calendarDataSource,
  calendarImportAdapter,
  type CalendarProvider,
} from '../adapters';
import type { AddEventDraft } from '../components/sidebar/AddEventPanel';
import {
  useCalendarCategories,
  useCalendarEvents,
} from '../hooks/useCalendarEvents';
import { useCalendarState } from '../hooks/useCalendarState';
import type {
  CalendarColorKey,
  CalendarEvent,
  CalendarEventInput,
} from '../types';
import { dayjs, minutesToHHmm, type Dayjs } from '../utils/calendarDate';

import { CalendarView } from './CalendarView';
import { MobileCalendarView } from './MobileCalendarView';

/**
 * 캘린더 컨테이너 — 상태/데이터/필터 로직.
 * 데이터는 어댑터(mock) 경유. 표시 필터(kind/category)를 적용해 View에 전달.
 */
export default function CalendarContainer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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

  // 단일 클릭(구글 캘린더식 — 클릭으로 사이드패널 활성화):
  //  - 추가 작성 중: 선택 날짜만 갱신(작성 중 내용 유지)
  //  - 그 외(패널 닫힘/편집 중): 그 날짜로 '새 일정 추가' 패널 오픈
  const handleDateClick = React.useCallback(
    (day: Dayjs) => {
      if (sidePanel === 'addEvent' && !editingEvent) setSelectedDate(day);
      else openAddEvent('counseling', day);
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
      // 하루 종일: 그 날 00:00 시작 + 종료 없음. 시간 일정: 선택한 시작/종료 시각.
      const [sh, sm] = draft.startTime.split(':').map(Number);
      const [eh, em] = draft.endTime.split(':').map(Number);
      const isAllDay = draft.eventTimeKind === 'ALL_DAY';
      const start = isAllDay
        ? date.hour(0).minute(0).second(0).millisecond(0)
        : date
            .hour(sh || 0)
            .minute(sm || 0)
            .second(0);
      const end = isAllDay
        ? undefined
        : date
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
        title: draft.title.trim() || '제목 없음',
        kind: draft.kind,
        colorKey,
        start: start.toISOString(),
        end: end?.toISOString(),
        eventTimeKind: draft.eventTimeKind,
        // 카테고리는 '나의 캘린더' 개인 일정에만 — 패널이 개인일 때만 선택값을 싣고, 상담이면 null.
        // 이벤트 색은 카테고리(있으면)에서 파생되므로 색은 재조회 시 자동 반영.
        categoryId: draft.categoryId ?? undefined,
        clientId: draft.clientId,
        counselMethod: draft.counselMethod,
        repeat: draft.repeat,
      };

      try {
        if (editingEvent) {
          await calendarDataSource.updateEvent?.(editingEvent.id, input);
        } else {
          await calendarDataSource.createEvent?.(input);
        }
        await queryClient.invalidateQueries({
          queryKey: ['calendar', 'events'],
        });
        trackEvent(
          editingEvent
            ? MixpanelEvent.CalendarEventUpdate
            : MixpanelEvent.CalendarEventCreate,
          { kind: draft.kind, allDay: isAllDay, recurring: !!draft.repeat }
        );
        closePanel();
      } catch {
        toast({
          title: '일정 저장 실패',
          description: '잠시 후 다시 시도해 주세요.',
        });
      }
    },
    [selectedDate, current, editingEvent, queryClient, closePanel, toast]
  );

  // 일정 삭제(편집 모드) — 낙관적 제거(반응성) 후 API. 단일/전체는 DELETE,
  // 반복 '이 회차만'은 예외(EXDATE) 추가(부분 PATCH). 실패 시 캐시 롤백.
  const handleDeleteEvent = React.useCallback(
    async (mode: 'this' | 'all') => {
      if (!editingEvent) return;
      const target = editingEvent;
      const occDate = dayjs(target.start).format('YYYY-MM-DD');
      const isOccurrence = mode === 'this' && !!target.repeat;

      // 낙관적 제거 — 캐시에서 즉시 빼고 패널을 닫는다.
      const snapshots = queryClient.getQueriesData<CalendarEvent[]>({
        queryKey: ['calendar', 'events'],
      });
      queryClient.setQueriesData<CalendarEvent[]>(
        { queryKey: ['calendar', 'events'] },
        (old) =>
          old?.filter((e) =>
            isOccurrence
              ? !(e.id === target.id && e.start === target.start)
              : e.id !== target.id
          )
      );
      closePanel();

      try {
        if (isOccurrence && target.repeat) {
          const exceptions = [...(target.repeat.exceptions ?? []), occDate];
          await calendarDataSource.updateEventExceptions?.(
            target.id,
            exceptions
          );
        } else {
          await calendarDataSource.deleteEvent?.(target.id);
        }
        await queryClient.invalidateQueries({
          queryKey: ['calendar', 'events'],
        });
        trackEvent(MixpanelEvent.CalendarEventDelete, {
          mode,
          recurring: !!target.repeat,
        });
      } catch {
        // 롤백 — 낙관적으로 제거한 캐시를 원복.
        snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
        toast({
          title: '일정 삭제 실패',
          description: '잠시 후 다시 시도해 주세요.',
        });
      }
    },
    [editingEvent, queryClient, closePanel, toast]
  );

  // 카테고리 색상 변경(설정 팝오버) — 이름 유지 + 색만 갱신. 이벤트 색은 카테고리에서 파생되므로
  // 캘린더 전체를 무효화해 색이 즉시 반영되게 한다.
  const handleChangeCategoryColor = React.useCallback(
    async (categoryId: string, colorKey: CalendarColorKey) => {
      const category = categories.find((c) => c.id === categoryId);
      if (!category) return;
      try {
        await calendarDataSource.updateCategory?.(categoryId, {
          name: category.name,
          colorKey,
        });
        await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      } catch {
        toast({
          title: '카테고리 변경 실패',
          description: '잠시 후 다시 시도해 주세요.',
        });
      }
    },
    [categories, queryClient, toast]
  );

  // 카테고리 삭제(설정 팝오버) — 소속 일정도 함께 삭제(서버 CASCADE). 캘린더 전체 무효화.
  const handleDeleteCategory = React.useCallback(
    async (categoryId: string) => {
      try {
        await calendarDataSource.deleteCategory?.(categoryId);
        await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      } catch {
        toast({
          title: '카테고리 삭제 실패',
          description: '잠시 후 다시 시도해 주세요.',
        });
      }
    },
    [queryClient, toast]
  );

  // 카테고리 생성(+ 버튼) — 이름 + 색. 생성 후 캘린더 무효화로 목록 갱신.
  const handleCreateCategory = React.useCallback(
    async (name: string, colorKey: CalendarColorKey) => {
      try {
        await calendarDataSource.createCategory?.({ name, colorKey });
        await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      } catch {
        toast({
          title: '카테고리 생성 실패',
          description: '잠시 후 다시 시도해 주세요.',
        });
      }
    },
    [queryClient, toast]
  );

  // 외부 캘린더 연결: 서버에서 동의 URL을 받아 브라우저를 리다이렉트(이후 콜백 페이지가 finalize).
  const handleConnectProvider = React.useCallback(
    async (provider: CalendarProvider) => {
      if (!calendarImportAdapter.isEnabled(provider)) {
        toast({
          title: '준비 중',
          description: '해당 캘린더 연동은 아직 준비 중이에요.',
        });
        return;
      }
      try {
        trackEvent(MixpanelEvent.CalendarGoogleConnect, { provider });
        await calendarImportAdapter.authorize(provider);
        // authorize는 동의 URL로 리다이렉트하므로 정상 흐름에선 여기 도달 X.
      } catch {
        toast({
          title: '캘린더 연동 실패',
          description: '잠시 후 다시 시도해 주세요.',
        });
      }
    },
    [toast]
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
        onConnectProvider={handleConnectProvider}
        onClosePanel={closePanel}
        onSelectDate={setSelectedDate}
        onSubmitEvent={handleSubmitEvent}
        onDeleteEvent={handleDeleteEvent}
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
      onChangeCategoryColor={handleChangeCategoryColor}
      onDeleteCategory={handleDeleteCategory}
      onCreateCategory={handleCreateCategory}
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
      onConnectProvider={handleConnectProvider}
      onClosePanel={closePanel}
      onSubmitEvent={handleSubmitEvent}
      onDeleteEvent={handleDeleteEvent}
    />
  );
}
