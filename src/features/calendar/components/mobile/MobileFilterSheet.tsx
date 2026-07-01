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
        <div className="border-t border-[#ecedf3]" />
        <MyCalendars
          categories={categories}
          categoryVisible={categoryVisible}
          onToggleCategory={onToggleCategory}
        />
        {/* 연동/재연동 진입점 — 데스크탑 사이드탭과 동일하게 하단 카드 하나로 통일. */}
        <GoogleConnectCard
          onConnect={onOpenAddCalendar}
          disabled={categories.some((c) => c.sourceProvider === 'google')}
        />
      </div>
    </Modal>
  );
}
