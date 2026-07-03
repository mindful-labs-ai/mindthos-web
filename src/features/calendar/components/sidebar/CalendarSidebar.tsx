import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { useGoogleConnectState } from '../../hooks/useGoogleConnectState';
import type { CalendarCategory, CalendarEventKind } from '../../types';
import type { Dayjs } from '../../utils/calendarDate';

import { AddEventButtons } from './AddEventButtons';
import { GoogleConnectButton } from './GoogleConnectButton';
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
  onAddEvent?: (kind: CalendarEventKind) => void;
  /** 외부 캘린더(구글) 연동/재연동 트리거 */
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
  onAddEvent,
  onConnectGoogle,
}: CalendarSidebarProps) {
  // 미니 달력 점은 항상 '현재 달' 범위를 별도 조회한다 — 메인이 주간뷰여도 그 주만 로드된
  // 이벤트로 점을 찍지 않게(월간뷰와 동일 범위, react-query가 월간뷰일 땐 dedup).
  const { data: monthEvents = [] } = useCalendarEvents('month', current);

  // 연동 표시 상태(연결/구글/카드 닫힘) — 모바일 필터 시트와 규칙 공유.
  const {
    hasConnectedCalendars,
    googleConnected,
    connectCardDismissed,
    dismissConnectCard,
  } = useGoogleConnectState(categories);

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
      {/* 연동 카드 닫힘 시 대체 진입점 — '일정 표시' 바로 아래 컴팩트 버튼 */}
      {!googleConnected && connectCardDismissed && (
        <GoogleConnectButton onConnect={onConnectGoogle} />
      )}
      {/* 나의 캘린더 — 외부 캘린더가 연결된 경우에만 노출(구분선 포함). */}
      {hasConnectedCalendars && (
        <>
          <Divider />
          <MyCalendars
            categories={categories}
            categoryVisible={categoryVisible}
            onToggleCategory={onToggleCategory}
            onConnect={onConnectGoogle}
            onDeleteCategory={onDeleteCategory}
          />
        </>
      )}
      {/* 하단 연동 카드 — 구글 미연동 + 닫지 않았을 때. 닫으면 위 컴팩트 버튼으로 대체. */}
      {!googleConnected && !connectCardDismissed && (
        <div className="mt-auto pt-4">
          <GoogleConnectCard
            onConnect={onConnectGoogle}
            onDismiss={dismissConnectCard}
          />
        </div>
      )}
    </div>
  );
}
