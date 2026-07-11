import type { CalendarProvider } from '../adapters';
import { CalendarToolbar } from '../components/CalendarToolbar';
import { GridLoadingOverlay } from '../components/GridLoadingOverlay';
import { MonthGrid } from '../components/MonthGrid';
import { AddCalendarPanel } from '../components/sidebar/AddCalendarPanel';
import { AddEventPanel } from '../components/sidebar/AddEventPanel';
import { CalendarSidebar } from '../components/sidebar/CalendarSidebar';
import { WeekGrid } from '../components/WeekGrid';
import type { CalendarSidePanel } from '../hooks/useCalendarState';
import type {
  AddEventDraft,
  CalendarCategory,
  CalendarEvent,
  CalendarEventKind,
  CalendarEventScope,
  CalendarViewMode,
} from '../types';
import type { Dayjs } from '../utils/calendarDate';

interface CalendarViewProps {
  current: Dayjs;
  viewMode: CalendarViewMode;
  events: CalendarEvent[];
  /** 최초 일정 로드 중 여부 — 그리드 영역에 로딩 오버레이 표시(백그라운드 refetch는 제외). */
  isEventsLoading?: boolean;
  categories: CalendarCategory[];
  kindVisible: Record<CalendarEventKind, boolean>;
  categoryVisible: Record<string, boolean>;
  onPrev: () => void;
  onNext: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onToggleKind: (kind: CalendarEventKind) => void;
  onToggleCategory: (categoryId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  // 사이드 패널 / 일정 추가
  sidePanel: CalendarSidePanel;
  addEventKind: CalendarEventKind;
  addEventTime: { start: string; end: string };
  editingEvent: CalendarEvent | null;
  openSeq: number;
  selectedDate: Dayjs | null;
  onDateClick: (day: Dayjs) => void;
  onSelectDate: (day: Dayjs) => void;
  onTimeChange: (time: { start: string; end: string }) => void;
  onDateDoubleClick: (day: Dayjs) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateRange: (day: Dayjs, startMinutes: number, endMinutes: number) => void;
  onOpenAddEvent: (kind: CalendarEventKind) => void;
  onOpenAddCalendar: () => void;
  onConnectProvider: (provider: CalendarProvider) => void;
  onClosePanel: () => void;
  onSubmitEvent: (draft: AddEventDraft, scope?: CalendarEventScope) => void;
  onDeleteEvent?: (mode: CalendarEventScope) => void;
  /** 일정 저장(추가·변경) 진행 중 — 패널 CTA·범위 선택 버튼 disable */
  submitting?: boolean;
  /** 일정 삭제 진행 중 — 패널 삭제 버튼 disable */
  deleting?: boolean;
}

/**
 * 캘린더 2-pane 레이아웃 (데스크탑 전용).
 * 좌: 툴바 + 월간/주간 그리드 / 우: 사이드탭
 * 일정 추가/캘린더 추가 시 우측에 슬라이드오버 패널 오버레이.
 */
export function CalendarView({
  current,
  viewMode,
  events,
  isEventsLoading,
  categories,
  kindVisible,
  categoryVisible,
  onPrev,
  onNext,
  onViewModeChange,
  onToggleKind,
  onToggleCategory,
  onDeleteCategory,
  onPrevMonth,
  onNextMonth,
  sidePanel,
  addEventKind,
  addEventTime,
  editingEvent,
  openSeq,
  selectedDate,
  onDateClick,
  onSelectDate,
  onTimeChange,
  onDateDoubleClick,
  onEventClick,
  onCreateRange,
  onOpenAddEvent,
  onOpenAddCalendar,
  onConnectProvider,
  onClosePanel,
  onSubmitEvent,
  onDeleteEvent,
  submitting,
  deleting,
}: CalendarViewProps) {
  return (
    <div className="relative flex h-full bg-grey-20">
      <section className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-8">
        {/* 초대형 모니터에서 그리드 과확장 방지 — 콘텐츠만 중앙 캡 */}
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6">
          <CalendarToolbar
            current={current}
            viewMode={viewMode}
            onPrev={onPrev}
            onNext={onNext}
            onViewModeChange={onViewModeChange}
          />
          <div className="relative">
            {viewMode === 'month' ? (
              <MonthGrid
                current={current}
                events={events}
                selectedDate={selectedDate}
                selectedEvent={editingEvent}
                onDateClick={onDateClick}
                onDateDoubleClick={onDateDoubleClick}
                onEventClick={onEventClick}
              />
            ) : (
              <WeekGrid
                current={current}
                events={events}
                onCreateRange={onCreateRange}
                onEventClick={onEventClick}
                selectedDate={selectedDate}
                selectedEvent={editingEvent}
                addEventTime={addEventTime}
                showAddSelection={sidePanel === 'addEvent' && !editingEvent}
              />
            )}
            {isEventsLoading && <GridLoadingOverlay rounded />}
          </div>
        </div>
      </section>

      <aside className="h-full w-[295px] shrink-0 overflow-y-auto border-l border-[#ecedf3] bg-white">
        <CalendarSidebar
          current={current}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          kindVisible={kindVisible}
          onToggleKind={onToggleKind}
          categories={categories}
          categoryVisible={categoryVisible}
          onToggleCategory={onToggleCategory}
          onDeleteCategory={onDeleteCategory}
          onAddEvent={onOpenAddEvent}
          onConnectGoogle={onOpenAddCalendar}
        />
      </aside>

      {/* 슬라이드오버 패널 (일정 추가 / 캘린더 추가)
          z-[1050]: 알림 패널(z-modal=1000) 위로 올리되, 패널 내부 내담자 선택 포털
          드롭다운(z-1100)보다는 아래로 둬 그 목록이 패널에 가리지 않게 한다. */}
      {sidePanel !== 'default' && (
        <div className="absolute right-0 top-0 z-[1050] h-full w-[363px] bg-white shadow-[-10px_-10px_40px_rgba(60,60,60,0.15)]">
          {sidePanel === 'addEvent' ? (
            <AddEventPanel
              key={openSeq}
              initialKind={addEventKind}
              selectedDate={selectedDate}
              initialStartTime={addEventTime.start}
              initialEndTime={addEventTime.end}
              editingEvent={editingEvent}
              onSelectDate={onSelectDate}
              onTimeChange={onTimeChange}
              onClose={onClosePanel}
              onSubmit={onSubmitEvent}
              onDelete={onDeleteEvent}
              submitting={submitting}
              deleting={deleting}
            />
          ) : (
            <AddCalendarPanel
              onClose={onClosePanel}
              onConnect={onConnectProvider}
            />
          )}
        </div>
      )}
    </div>
  );
}
