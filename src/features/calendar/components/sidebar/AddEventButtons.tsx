import { Plus } from 'lucide-react';

import type { CalendarEventKind } from '../../types';

interface AddEventButtonsProps {
  /** 후속 Phase: 일정 추가 모달 오픈 */
  onAdd?: (kind: CalendarEventKind) => void;
}

/** 상담 일정 추가 / 개인 일정 추가 버튼 (사이드탭 상단) */
export function AddEventButtons({ onAdd }: AddEventButtonsProps) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onAdd?.('counseling')}
        className="flex h-[39px] flex-1 items-center justify-center gap-1.5 rounded-md bg-green-80 text-sm font-medium text-white"
      >
        <Plus size={14} strokeWidth={2.5} />
        일정 추가하기
      </button>
    </div>
  );
}
