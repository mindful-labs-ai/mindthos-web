import { Plus } from 'lucide-react';

interface CalendarFabProps {
  onClick: () => void;
}

/** 모바일 우하단 플로팅 추가 버튼 '일정 +' (safe-area 대응) */
export function CalendarFab({ onClick }: CalendarFabProps) {
  return (
    <button
      type="button"
      aria-label="일정 추가"
      onClick={onClick}
      className="fixed right-5 z-20 flex h-12 items-center gap-1.5 rounded-full bg-green-80 pl-5 pr-4 text-white shadow-[0px_4px_12px_rgba(0,0,0,0.2)]"
      style={{ bottom: 'calc(20px + env(safe-area-inset-bottom))' }}
    >
      <span className="text-sm font-medium">일정</span>
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );
}
