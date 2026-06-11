import type {
  CalendarCategory,
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
  onPrevMonth: () => void;
  onNextMonth: () => void;
  kindVisible: Record<CalendarEventKind, boolean>;
  onToggleKind: (kind: CalendarEventKind) => void;
  categories: CalendarCategory[];
  categoryVisible: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  onAddEvent?: (kind: CalendarEventKind) => void;
  onAddCategory?: () => void;
  onConnectGoogle?: () => void;
}

const Divider = () => <div className="border-t border-[#ecedf3]" />;

/** 우측 사이드탭 — 일정추가/미니달력/표시토글/나의캘린더/연동카드 */
export function CalendarSidebar({
  current,
  onPrevMonth,
  onNextMonth,
  kindVisible,
  onToggleKind,
  categories,
  categoryVisible,
  onToggleCategory,
  onAddEvent,
  onAddCategory,
  onConnectGoogle,
}: CalendarSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-6 px-4 pb-6 pt-10">
      <AddEventButtons onAdd={onAddEvent} />
      <MiniCalendar
        current={current}
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
        onAddCategory={onAddCategory}
      />
      <div className="mt-auto pt-4">
        <GoogleConnectCard onConnect={onConnectGoogle} />
      </div>
    </div>
  );
}
