import React from 'react';

import { RadioGroup } from '@/components/ui/atoms/Radio';

interface SortMenuProps {
  sortOrder: 'newest' | 'oldest';
  onSortChange: (order: 'newest' | 'oldest') => void;
  onBack: () => void;
}

export const SortMenu: React.FC<SortMenuProps> = ({
  sortOrder,
  onSortChange,
  onBack,
}) => {
  return (
    <div className="flex w-full flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded p-1 hover:bg-surface"
          aria-label="뒤로가기"
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
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-fg">정렬</h3>
      </div>

      {/* 정렬 옵션 */}
      <RadioGroup
        value={sortOrder}
        onChange={(value) => onSortChange(value as 'newest' | 'oldest')}
        options={[
          { value: 'newest', label: '최신순' },
          { value: 'oldest', label: '오래된순' },
        ]}
        size="sm"
        orientation="vertical"
      />
    </div>
  );
};
