import React from 'react';

import { Modal } from '@/shared/ui/composites/Modal';

import { CalendarFab } from '../components/mobile/CalendarFab';
import { MobileCalendarToolbar } from '../components/mobile/MobileCalendarToolbar';
import { MobileDayView } from '../components/mobile/MobileDayView';
import { MobileFilterSheet } from '../components/mobile/MobileFilterSheet';
import { MobileMonthGrid } from '../components/mobile/MobileMonthGrid';
import { AddCalendarPanel } from '../components/sidebar/AddCalendarPanel';
import {
  AddEventPanel,
  type AddEventDraft,
} from '../components/sidebar/AddEventPanel';
import type { CalendarSidePanel } from '../hooks/useCalendarState';
import type {
  CalendarCategory,
  CalendarEvent,
  CalendarEventKind,
  CalendarViewMode,
} from '../types';
import type { Dayjs } from '../utils/calendarDate';

interface MobileCalendarViewProps {
  current: Dayjs;
  viewMode: CalendarViewMode;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  kindVisible: Record<CalendarEventKind, boolean>;
  categoryVisible: Record<string, boolean>;
  sidePanel: CalendarSidePanel;
  addEventKind: CalendarEventKind;
  addEventTime: { start: string; end: string };
  editingEvent: CalendarEvent | null;
  openSeq: number;
  selectedDate: Dayjs | null;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onSetCurrent: (date: Dayjs) => void;
  onToggleKind: (kind: CalendarEventKind) => void;
  onToggleCategory: (categoryId: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onOpenAddEvent: (
    kind: CalendarEventKind,
    date?: Dayjs,
    time?: { start: string; end: string }
  ) => void;
  onOpenAddCalendar: () => void;
  onClosePanel: () => void;
  onSelectDate: (day: Dayjs) => void;
  onSubmitEvent: (draft: AddEventDraft) => void;
}

/**
 * 모바일/태블릿 캘린더 뷰 (<1024px).
 * 상단 툴바 + 월간(미니칩)/일간 타임라인 + 우하단 FAB + 패널(fullScreen Modal)/필터(bottomSheet).
 */
export function MobileCalendarView({
  current,
  viewMode,
  events,
  categories,
  kindVisible,
  categoryVisible,
  sidePanel,
  addEventKind,
  addEventTime,
  editingEvent,
  openSeq,
  selectedDate,
  onViewModeChange,
  onSetCurrent,
  onToggleKind,
  onToggleCategory,
  onEventClick,
  onOpenAddEvent,
  onOpenAddCalendar,
  onClosePanel,
  onSelectDate,
  onSubmitEvent,
}: MobileCalendarViewProps) {
  const [filterOpen, setFilterOpen] = React.useState(false);
  // 월간에서 탭으로 선택한 날짜 (없으면 null → 하이라이트/FAB 없음)
  const [selectedDay, setSelectedDay] = React.useState<Dayjs | null>(null);

  // 월간=월 단위, 일간=주 단위 이동(요일 선택은 상단 주간 스트립이 담당)
  const goPrev = () => {
    if (viewMode === 'month') {
      setSelectedDay(null);
      onSetCurrent(current.subtract(1, 'month'));
    } else {
      onSetCurrent(current.subtract(1, 'week'));
    }
  };
  const goNext = () => {
    if (viewMode === 'month') {
      setSelectedDay(null);
      onSetCurrent(current.add(1, 'month'));
    } else {
      onSetCurrent(current.add(1, 'week'));
    }
  };

  // 월간 날짜 탭 → 선택(하이라이트+FAB) + current 이동(일간 토글 시 그 날짜 표시)
  const handleMonthSelectDay = (day: Dayjs) => {
    setSelectedDay(day);
    onSetCurrent(day);
  };

  const handleConnect = () => {
    setFilterOpen(false);
    onOpenAddCalendar();
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <MobileCalendarToolbar
        current={current}
        viewMode={viewMode}
        onPrev={goPrev}
        onNext={goNext}
        onViewModeChange={onViewModeChange}
        onOpenFilter={() => setFilterOpen(true)}
      />

      <div className="min-h-0 flex-1">
        {viewMode === 'month' ? (
          <MobileMonthGrid
            current={current}
            events={events}
            selectedDate={selectedDay}
            onSelectDay={handleMonthSelectDay}
            onEventClick={onEventClick}
          />
        ) : (
          <MobileDayView
            current={current}
            events={events}
            onSelectDay={onSetCurrent}
            onEventClick={onEventClick}
          />
        )}
      </div>

      <CalendarFab onClick={() => onOpenAddEvent('counseling', current)} />

      {/* 일정 추가/변경 (전체 화면) */}
      <Modal
        open={sidePanel === 'addEvent'}
        onOpenChange={(o) => !o && onClosePanel()}
        mobileVariant="fullScreen"
        hideCloseButton
      >
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
      </Modal>

      {/* 캘린더 추가 (전체 화면) */}
      <Modal
        open={sidePanel === 'addCalendar'}
        onOpenChange={(o) => !o && onClosePanel()}
        mobileVariant="fullScreen"
        hideCloseButton
      >
        <AddCalendarPanel onClose={onClosePanel} />
      </Modal>

      {/* 필터(일정 표시/나의 캘린더) bottomSheet */}
      <MobileFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        kindVisible={kindVisible}
        onToggleKind={onToggleKind}
        categories={categories}
        categoryVisible={categoryVisible}
        onToggleCategory={onToggleCategory}
        onOpenAddCalendar={handleConnect}
      />
    </div>
  );
}
