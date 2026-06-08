import { Plus } from 'lucide-react';

import { Modal } from '@/shared/ui/composites/Modal';

import type { CalendarCategory, CalendarEventKind } from '../../types';
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
          onAddCategory={onOpenAddCalendar}
        />
        <div className="border-t border-[#ecedf3]" />
        <button
          type="button"
          onClick={onOpenAddCalendar}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-md border border-grey-40 bg-white text-sm font-headline text-grey-100"
        >
          <Plus size={14} strokeWidth={2.5} />
          외부 캘린더 연결하기
        </button>
      </div>
    </Modal>
  );
}
