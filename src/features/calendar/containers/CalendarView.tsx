import { CalendarToolbar } from '../components/CalendarToolbar';
import { MonthGrid } from '../components/MonthGrid';
import { AddCalendarPanel } from '../components/sidebar/AddCalendarPanel';
import {
  AddEventPanel,
  type AddEventDraft,
} from '../components/sidebar/AddEventPanel';
import { CalendarSidebar } from '../components/sidebar/CalendarSidebar';
import { WeekGrid } from '../components/WeekGrid';
import type { CalendarSidePanel } from '../hooks/useCalendarState';
import type {
  CalendarCategory,
  CalendarEvent,
  CalendarEventKind,
  CalendarViewMode,
} from '../types';
import type { Dayjs } from '../utils/calendarDate';

interface CalendarViewProps {
  current: Dayjs;
  viewMode: CalendarViewMode;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  kindVisible: Record<CalendarEventKind, boolean>;
  categoryVisible: Record<string, boolean>;
  onPrev: () => void;
  onNext: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onToggleKind: (kind: CalendarEventKind) => void;
  onToggleCategory: (categoryId: string) => void;
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
  onDateDoubleClick: (day: Dayjs) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateRange: (day: Dayjs, startMinutes: number, endMinutes: number) => void;
  onOpenAddEvent: (kind: CalendarEventKind) => void;
  onOpenAddCalendar: () => void;
  onClosePanel: () => void;
  onSubmitEvent: (draft: AddEventDraft) => void;
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
  categories,
  kindVisible,
  categoryVisible,
  onPrev,
  onNext,
  onViewModeChange,
  onToggleKind,
  onToggleCategory,
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
  onDateDoubleClick,
  onEventClick,
  onCreateRange,
  onOpenAddEvent,
  onOpenAddCalendar,
  onClosePanel,
  onSubmitEvent,
}: CalendarViewProps) {
  return (
    <div className="relative flex h-full bg-grey-20">
      <section className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-8 py-8">
        <CalendarToolbar
          current={current}
          viewMode={viewMode}
          onPrev={onPrev}
          onNext={onNext}
          onViewModeChange={onViewModeChange}
        />
        {viewMode === 'month' ? (
          <MonthGrid
            current={current}
            events={events}
            selectedDate={selectedDate}
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
          />
        )}
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
          onAddEvent={onOpenAddEvent}
          onAddCategory={onOpenAddCalendar}
          onConnectGoogle={onOpenAddCalendar}
        />
      </aside>

      {/* 슬라이드오버 패널 (일정 추가 / 캘린더 추가) */}
      {sidePanel !== 'default' && (
        <div className="absolute right-0 top-0 z-20 h-full w-[363px] bg-white shadow-[-10px_-10px_40px_rgba(60,60,60,0.15)]">
          {sidePanel === 'addEvent' ? (
            <AddEventPanel
              key={openSeq}
              initialKind={addEventKind}
              selectedDate={selectedDate}
              initialStartTime={addEventTime.start}
              initialEndTime={addEventTime.end}
              editingEvent={editingEvent}
              onSelectDate={onSelectDate}
              onClose={onClosePanel}
              onSubmit={onSubmitEvent}
            />
          ) : (
            <AddCalendarPanel onClose={onClosePanel} />
          )}
        </div>
      )}
    </div>
  );
}
