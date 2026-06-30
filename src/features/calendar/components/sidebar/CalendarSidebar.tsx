import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import type { CalendarCategory, CalendarEventKind } from '../../types';
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
  onDeleteCategory?: (categoryId: string) => void;
  onCreateCategory?: (name: string) => void;
  onAddEvent?: (kind: CalendarEventKind) => void;
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
  onDeleteCategory,
  onCreateCategory,
  onAddEvent,
  onConnectGoogle,
}: CalendarSidebarProps) {
  // 미니 달력 점은 항상 '현재 달' 범위를 별도 조회한다 — 메인이 주간뷰여도 그 주만 로드된
  // 이벤트로 점을 찍지 않게(월간뷰와 동일 범위, react-query가 월간뷰일 땐 dedup).
  const { data: monthEvents = [] } = useCalendarEvents('month', current);

  return (
    <div className="flex min-h-full flex-col gap-6 px-4 pb-6 pt-10">
      <AddEventButtons onAdd={onAddEvent} />
      <MiniCalendar
        current={current}
        events={monthEvents}
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
