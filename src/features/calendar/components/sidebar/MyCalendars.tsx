import { Plus } from 'lucide-react';

import type { CalendarCategory } from '../../types';

import { CategoryToggleItem } from './CategoryToggleItem';

interface MyCalendarsProps {
  categories: CalendarCategory[];
  categoryVisible: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  /** 후속 Phase: 카테고리 추가 */
  onAddCategory?: () => void;
}

/** '나의 캘린더' — 카테고리 목록 + 추가 */
export function MyCalendars({
  categories,
  categoryVisible,
  onToggleCategory,
  onAddCategory,
}: MyCalendarsProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-l font-medium text-grey-100">나의 캘린더</h3>
        <button
          type="button"
          aria-label="카테고리 추가"
          onClick={onAddCategory}
          className="flex h-6 w-6 items-center justify-center text-grey-100"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {categories.map((category) => (
          <CategoryToggleItem
            key={category.id}
            label={category.name}
            colorKey={category.colorKey}
            checked={categoryVisible[category.id] ?? true}
            onToggle={() => onToggleCategory(category.id)}
          />
        ))}
      </div>
    </div>
  );
}
