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
import { KIND_DEFAULT_COLOR } from '../constants';
import {
  TEMP_EVENT_PREFIX,
  useCalendarEventMutations,
} from '../hooks/useCalendarEventMutations';
import {
  useCalendarCategories,
  useCalendarEvents,
} from '../hooks/useCalendarEvents';
import { useCalendarState } from '../hooks/useCalendarState';
import type {
  AddEventDraft,
  CalendarEvent,
  CalendarEventScope,
} from '../types';
import { minutesToHHmm, type Dayjs } from '../utils/calendarDate';
import { buildCalendarEventInput } from '../utils/eventMutations';

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
    setAddEventTime,
    editingEvent,
    openEditEvent,
    openSeq,
    openAddEvent,
    openAddCalendar,
    closePanel,
    selectedDate,
    setSelectedDate,
  } = useCalendarState();

  // isLoading = 최초 로드(캐시 없음). 낙관적 갱신을 가리지 않도록 백그라운드 refetch(isFetching)에는
  // 스피너를 걸지 않는다 — 첫 로드에만 그리드 위 로딩 오버레이를 노출한다.
  const { data: events = [], isLoading: isEventsLoading } = useCalendarEvents(
    viewMode,
    current
  );
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

  // 작성 중(새 일정 추가) 미리보기 더미 일정 — 선택 날짜·시간에 임시 칩/블록을 띄워 어디에 추가될지 보여준다.
  // 월간(칩)·주간(시간 블록) 공통 표시. 주간은 더미 블록이 보이면 기존 선택 박스는 숨긴다.
  const draftEvent = React.useMemo<CalendarEvent | null>(() => {
    if (sidePanel !== 'addEvent' || editingEvent || !selectedDate) return null;
    const [sh, sm] = addEventTime.start.split(':').map(Number);
    const [eh, em] = addEventTime.end.split(':').map(Number);
    return {
      id: '__draft__',
      title: '',
      kind: addEventKind,
      colorKey: KIND_DEFAULT_COLOR[addEventKind],
      start: selectedDate
        .hour(sh)
        .minute(sm)
        .second(0)
        .millisecond(0)
        .toISOString(),
      end: selectedDate
        .hour(eh)
        .minute(em)
        .second(0)
        .millisecond(0)
        .toISOString(),
      eventTimeKind: 'TIMED',
      isDraft: true,
    };
  }, [sidePanel, editingEvent, selectedDate, addEventTime, addEventKind]);

  const eventsForView = React.useMemo(() => {
    // 낙관적 temp(진행 중 생성)가 이미 캐시에 있으면 __draft__ 미리보기를 숨겨
    // 같은 슬롯에 점선 칩이 둘 겹쳐 보이는 중복을 막는다.
    const hasPendingTemp = visibleEvents.some((e) =>
      e.id.startsWith(TEMP_EVENT_PREFIX)
    );
    return draftEvent && !hasPendingTemp
      ? [...visibleEvents, draftEvent]
      : visibleEvents;
  }, [visibleEvents, draftEvent]);

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

  // 일정 생성/수정·삭제 낙관적 뮤테이션(캐시 스냅샷·롤백·재조정)은 훅으로 분리.
  // 여기선 반환된 mutate를 per-call onSuccess(트래킹·패널 닫기)와 함께 오케스트레이션만 한다.
  const { submitEvent, deleteEvent } = useCalendarEventMutations();

  // 일정 추가/변경 제출: 편집 중이면 update(반복은 scope로 범위 지정), 아니면 create.
  // 낙관 반영은 뮤테이션이 담당하고, 성공 시에만 트래킹 + 패널 닫기.
  const handleSubmitEvent = React.useCallback(
    (draft: AddEventDraft, scope?: CalendarEventScope) => {
      const date = selectedDate ?? current;
      const input = buildCalendarEventInput(draft, date);
      submitEvent(
        {
          input,
          editing: editingEvent,
          scope,
          occurrenceDate: editingEvent?.occurrenceDate ?? null,
        },
        {
          onSuccess: () => {
            trackEvent(
              editingEvent
                ? MixpanelEvent.CalendarEventUpdate
                : MixpanelEvent.CalendarEventCreate,
              {
                kind: draft.kind,
                allDay: draft.eventTimeKind === 'ALL_DAY',
                recurring: !!draft.repeat || !!editingEvent?.seriesId,
              }
            );
            closePanel();
          },
        }
      );
    },
    [selectedDate, current, editingEvent, submitEvent, closePanel]
  );

  // 일정 삭제(편집 모드) — 반복은 this(EXDATE+override)/following(분할)/all. 낙관 제거는 뮤테이션이 담당.
  const handleDeleteEvent = React.useCallback(
    (scope: CalendarEventScope) => {
      if (!editingEvent) return;
      const target = editingEvent;
      closePanel();
      deleteEvent(
        {
          id: target.id,
          scope,
          occurrenceDate: target.occurrenceDate ?? null,
        },
        {
          onSuccess: () => {
            trackEvent(MixpanelEvent.CalendarEventDelete, {
              scope,
              recurring: !!target.seriesId,
            });
          },
        }
      );
    },
    [editingEvent, deleteEvent, closePanel]
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

  // 카테고리 생성(+ 버튼) — 이름만(색 없음). 생성 후 캘린더 무효화로 목록 갱신.
  const handleCreateCategory = React.useCallback(
    async (name: string) => {
      try {
        await calendarDataSource.createCategory?.({ name });
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
        events={eventsForView}
        isEventsLoading={isEventsLoading}
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
        onTimeChange={setAddEventTime}
        onSubmitEvent={handleSubmitEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    );
  }

  return (
    <CalendarView
      current={current}
      viewMode={viewMode}
      events={eventsForView}
      isEventsLoading={isEventsLoading}
      categories={categories}
      kindVisible={kindVisible}
      categoryVisible={categoryVisible}
      onPrev={goPrev}
      onNext={goNext}
      onViewModeChange={setViewMode}
      onToggleKind={toggleKind}
      onToggleCategory={toggleCategory}
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
      onTimeChange={setAddEventTime}
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
