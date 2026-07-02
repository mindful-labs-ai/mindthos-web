import { Modal } from '@/shared/ui/composites/Modal';

import type { CalendarCategory, CalendarEventKind } from '../../types';
import { GoogleConnectCard } from '../sidebar/GoogleConnectCard';
import { MyCalendars } from '../sidebar/MyCalendars';
import { VisibilityToggles } from '../sidebar/VisibilityToggles';

interface MobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
  kindVisible: Record<CalendarEventKind, boolean>;
  onToggleKind: (kind: CalendarEventKind) => void;
  categories: CalendarCategory[];
  categoryVisible: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  /** 카테고리 추가 / 외부 캘린더 연동 (시트 닫고 패널 오픈) */
  onOpenAddCalendar: () => void;
}

/** 모바일 필터 bottomSheet — 일정 표시 토글 + 나의 캘린더 + 외부 연동 */
export function MobileFilterSheet({
  open,
  onClose,
  kindVisible,
  onToggleKind,
  categories,
  categoryVisible,
  onToggleCategory,
  onOpenAddCalendar,
}: MobileFilterSheetProps) {
  // 외부 캘린더가 연결된 경우에만 '나의 캘린더' 노출. 구글 연동 시 하단 연동 카드는 숨김.
  const hasConnectedCalendars = categories.length > 0;
  const googleConnected = categories.some((c) => c.sourceProvider === 'google');

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      mobileVariant="bottomSheet"
    >
      <div className="flex flex-col gap-6 pb-2">
        <VisibilityToggles
          kindVisible={kindVisible}
          onToggleKind={onToggleKind}
        />
        {hasConnectedCalendars && (
          <>
            <div className="border-t border-[#ecedf3]" />
            <MyCalendars
              categories={categories}
              categoryVisible={categoryVisible}
              onToggleCategory={onToggleCategory}
              onConnect={onOpenAddCalendar}
            />
          </>
        )}
        {/* 연동 카드 — 구글이 아직 연동되지 않았을 때만 노출. */}
        {!googleConnected && (
          <GoogleConnectCard onConnect={onOpenAddCalendar} />
        )}
      </div>
    </Modal>
  );
}
