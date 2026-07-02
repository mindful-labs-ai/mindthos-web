import { Modal } from '@/shared/ui/composites/Modal';

import { useGoogleConnectState } from '../../hooks/useGoogleConnectState';
import type { CalendarCategory, CalendarEventKind } from '../../types';
import { GoogleConnectButton } from '../sidebar/GoogleConnectButton';
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
  /** 연동 캘린더(카테고리) 해제 — 설정 메뉴에서 삭제(소속 일정 포함) */
  onDeleteCategory?: (categoryId: string) => void;
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
  onDeleteCategory,
  onOpenAddCalendar,
}: MobileFilterSheetProps) {
  // 연동 표시 상태(연결/구글/카드 닫힘) — 데스크탑 사이드탭과 규칙 공유.
  const {
    hasConnectedCalendars,
    googleConnected,
    connectCardDismissed,
    dismissConnectCard,
  } = useGoogleConnectState(categories);

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
        {/* 연동 카드 닫힘 시 대체 진입점 — '일정 표시' 바로 아래 컴팩트 버튼 */}
        {!googleConnected && connectCardDismissed && (
          <GoogleConnectButton onConnect={onOpenAddCalendar} />
        )}
        {hasConnectedCalendars && (
          <>
            <div className="border-t border-[#ecedf3]" />
            <MyCalendars
              categories={categories}
              categoryVisible={categoryVisible}
              onToggleCategory={onToggleCategory}
              onConnect={onOpenAddCalendar}
              onDeleteCategory={onDeleteCategory}
            />
          </>
        )}
        {/* 연동 카드 — 구글 미연동 + 닫지 않았을 때. 닫으면 위 컴팩트 버튼으로 대체. */}
        {!googleConnected && !connectCardDismissed && (
          <GoogleConnectCard
            onConnect={onOpenAddCalendar}
            onDismiss={dismissConnectCard}
          />
        )}
      </div>
    </Modal>
  );
}
