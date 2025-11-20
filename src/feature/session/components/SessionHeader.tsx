import React from 'react';

import { formatKoreanDateTime } from '@/shared/utils/date';

interface SessionHeaderProps {
  title: string;
  createdAt: string;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  title,
  createdAt,
}) => {
  return (
    <div className="border-b border-border bg-bg px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <button
            type="button"
            className="text-fg-muted hover:text-fg"
            aria-label="제목 수정"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
        <span className="text-sm text-fg-muted">
          {formatKoreanDateTime(new Date(createdAt))}
        </span>
      </div>
    </div>
  );
};
