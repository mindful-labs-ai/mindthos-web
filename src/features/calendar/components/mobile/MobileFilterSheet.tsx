import React from 'react';

import { Modal } from '@/shared/ui/composites/Modal';

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
  // 외부 캘린더가 연결된 경우에만 '나의 캘린더' 노출. 구글 연동 시 하단 연동 카드는 숨김.
  const hasConnectedCalendars = categories.length > 0;
  const googleConnected = categories.some((c) => c.sourceProvider === 'google');
  // 연동 카드 X 닫힘 — 닫으면 '일정 표시' 아래 컴팩트 '캘린더 연결하기' 버튼으로 대체.
  const [connectCardDismissed, setConnectCardDismissed] = React.useState(false);

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
            onDismiss={() => setConnectCardDismissed(true)}
          />
        )}
      </div>
    </Modal>
  );
}
