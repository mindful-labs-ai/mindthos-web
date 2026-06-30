import React from 'react';

import { Plus } from 'lucide-react';

import { cn } from '@/lib/cn';

import type { CalendarCategory } from '../../types';

import { CategorySettingsMenu } from './CategorySettingsMenu';
import { CategoryToggleItem } from './CategoryToggleItem';

interface MyCalendarsProps {
  categories: CalendarCategory[];
  categoryVisible: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  /** 카테고리 생성(이름만 — 카테고리는 색을 갖지 않음) */
  onCreateCategory?: (name: string) => void;
  /** 카테고리 삭제(설정 메뉴, 소속 일정 함께 삭제) */
  onDeleteCategory?: (categoryId: string) => void;
}

/** '나의 캘린더' — 카테고리 목록 + 생성(+) + 항목별 설정(삭제) */
export function MyCalendars({
  categories,
  categoryVisible,
  onToggleCategory,
  onCreateCategory,
  onDeleteCategory,
}: MyCalendarsProps) {
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  // 생성 제출 중복 방지 — 첫 클릭 후 폼이 닫힐 때까지 추가 버튼 비활성.
  const [submitting, setSubmitting] = React.useState(false);

  const resetForm = () => {
    setCreating(false);
    setNewName('');
    setSubmitting(false);
  };

  const submit = () => {
    if (submitting) return;
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    onCreateCategory?.(name);
    resetForm();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-m font-medium text-grey-100">카테고리</h3>
        <button
          type="button"
          aria-label="카테고리 추가"
          onClick={() => setCreating((c) => !c)}
          className="flex h-6 w-6 items-center justify-center text-grey-100"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>

      {/* 카테고리 생성 폼 — + 버튼으로 토글. 이름만 입력(색 없음). */}
      {creating && (
        <div className="mt-4 rounded-md border border-grey-40 p-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="카테고리 이름"
            className="h-9 w-full rounded-md border border-grey-40 bg-grey-10 px-3 text-sm text-grey-100 placeholder:text-grey-60 focus:outline-none"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-md border border-grey-40 bg-white py-1.5 text-sm font-medium text-grey-100 lg:hover:bg-grey-10"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!newName.trim() || submitting}
              onClick={submit}
              className={cn(
                'flex-1 rounded-md py-1.5 text-sm font-medium text-white',
                newName.trim() && !submitting
                  ? 'bg-green-80'
                  : 'cursor-not-allowed bg-grey-40'
              )}
            >
              추가
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <CategoryToggleItem
                label={category.name}
                checked={categoryVisible[category.id] ?? true}
                onToggle={() => onToggleCategory(category.id)}
              />
            </div>
            {onDeleteCategory && (
              <CategorySettingsMenu
                categoryName={category.name}
                onDelete={() => onDeleteCategory(category.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
