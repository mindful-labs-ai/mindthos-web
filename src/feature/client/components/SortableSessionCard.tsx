/**
 * 드래그 가능한 세션 카드 컴포넌트
 */

import React from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Session } from '@/feature/session/types';
import { cn } from '@/lib/cn';
import { MoreVerticalIcon } from '@/shared/icons';

interface SortableSessionCardProps {
  session: Session;
  index: number;
  onRemove: (sessionId: string) => void;
}

export const SortableSessionCard: React.FC<SortableSessionCardProps> = ({
  session,
  index,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formattedDate = new Date(session.created_at).toLocaleDateString(
    'ko-KR',
    {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    }
  );

  const formattedTime = new Date(session.created_at).toLocaleTimeString(
    'ko-KR',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex h-[96px] items-center gap-3 rounded-lg border border-surface-strong px-3 py-4',
        isDragging && 'z-50 opacity-50'
      )}
    >
      {/* 드래그 핸들 */}
      <button
        type="button"
        className="flex cursor-grab touch-none flex-col items-center justify-center gap-0.5 text-fg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <MoreVerticalIcon size={20} />
      </button>

      {/* 세션 정보 */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-fg">
          {session.title || '제목 없는 기록'}
        </div>
        <div className="text-xs text-fg-muted">
          {formattedDate} {formattedTime}
        </div>
      </div>

      {/* 회기 표시 */}
      <div className="absolute bottom-4 right-3 rounded-md bg-surface-strong px-2 py-1 text-sm font-semibold text-fg">
        {index + 1}회기
      </div>

      {/* X 버튼 */}
      <button
        type="button"
        onClick={() => onRemove(session.id)}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-fg-muted"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
