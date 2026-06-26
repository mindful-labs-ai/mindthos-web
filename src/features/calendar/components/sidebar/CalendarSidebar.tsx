import type {
  CalendarCategory,
  CalendarColorKey,
  CalendarEvent,
  CalendarEventKind,
} from '../../types';
import type { Dayjs } from '../../utils/calendarDate';

import { AddEventButtons } from './AddEventButtons';
import { GoogleConnectCard } from './GoogleConnectCard';
import { MiniCalendar } from './MiniCalendar';
import { MyCalendars } from './MyCalendars';
import { VisibilityToggles } from './VisibilityToggles';

interface CalendarSidebarProps {
  current: Dayjs;
  /** 미니 달력 점 표시용 이벤트 */
  events: CalendarEvent[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  kindVisible: Record<CalendarEventKind, boolean>;
  onToggleKind: (kind: CalendarEventKind) => void;
  categories: CalendarCategory[];
  categoryVisible: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  onChangeCategoryColor?: (
    categoryId: string,
    colorKey: CalendarColorKey
  ) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onCreateCategory?: (name: string, colorKey: CalendarColorKey) => void;
  onAddEvent?: (kind: CalendarEventKind) => void;
  onConnectGoogle?: () => void;
}

const Divider = () => <div className="border-t border-[#ecedf3]" />;

/** 우측 사이드탭 — 일정추가/미니달력/표시토글/나의캘린더/연동카드 */
export function CalendarSidebar({
  current,
  events,
  onPrevMonth,
  onNextMonth,
  kindVisible,
  onToggleKind,
  categories,
  categoryVisible,
  onToggleCategory,
  onChangeCategoryColor,
  onDeleteCategory,
  onCreateCategory,
  onAddEvent,
  onConnectGoogle,
}: CalendarSidebarProps) {
  return (
    <div className="flex min-h-full flex-col gap-6 px-4 pb-6 pt-10">
      <AddEventButtons onAdd={onAddEvent} />
      <MiniCalendar
        current={current}
        events={events}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
      <Divider />
      <VisibilityToggles
        kindVisible={kindVisible}
        onToggleKind={onToggleKind}
      />
      <Divider />
      <MyCalendars
        categories={categories}
        categoryVisible={categoryVisible}
        onToggleCategory={onToggleCategory}
        onCreateCategory={onCreateCategory}
        onChangeCategoryColor={onChangeCategoryColor}
        onDeleteCategory={onDeleteCategory}
      />
      {/* 구글 연동 후엔 배너 숨김(카테고리 sourceProvider로 감지) */}
      {!categories.some((c) => c.sourceProvider === 'google') && (
        <div className="mt-auto pt-4">
          <GoogleConnectCard onConnect={onConnectGoogle} />
        </div>
      )}
    </div>
  );
}
