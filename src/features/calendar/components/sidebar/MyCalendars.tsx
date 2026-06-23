import React from 'react';

import { Plus } from 'lucide-react';

import { cn } from '@/lib/cn';

import { CALENDAR_COLOR_STYLES, CALENDAR_PALETTE } from '../../constants';
import type { CalendarCategory, CalendarColorKey } from '../../types';

import { CategorySettingsMenu } from './CategorySettingsMenu';
import { CategoryToggleItem } from './CategoryToggleItem';

interface MyCalendarsProps {
  categories: CalendarCategory[];
  categoryVisible: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  /** 카테고리 생성(이름 + 색) */
  onCreateCategory?: (name: string, colorKey: CalendarColorKey) => void;
  /** 카테고리 색상 변경(설정 팝오버) */
  onChangeCategoryColor?: (
    categoryId: string,
    colorKey: CalendarColorKey
  ) => void;
  /** 카테고리 삭제(설정 팝오버, 소속 일정 함께 삭제) */
  onDeleteCategory?: (categoryId: string) => void;
}

/** '나의 캘린더' — 카테고리 목록 + 생성(+) + 항목별 설정(색상/삭제) */
export function MyCalendars({
  categories,
  categoryVisible,
  onToggleCategory,
  onCreateCategory,
  onChangeCategoryColor,
  onDeleteCategory,
}: MyCalendarsProps) {
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newColor, setNewColor] = React.useState<CalendarColorKey>('green');

  const resetForm = () => {
    setCreating(false);
    setNewName('');
    setNewColor('green');
  };

  const submit = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateCategory?.(name, newColor);
    resetForm();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-m font-medium text-grey-100">나의 캘린더</h3>
        <button
          type="button"
          aria-label="카테고리 추가"
          onClick={() => setCreating((c) => !c)}
          className="flex h-6 w-6 items-center justify-center text-grey-100"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>

      {/* 카테고리 생성 폼 — + 버튼으로 토글. 이름 + 색 선택 후 추가. */}
      {creating && (
        <div className="mt-4 rounded-md border border-grey-40 p-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="카테고리 이름"
            className="h-9 w-full rounded-md border border-grey-40 bg-grey-10 px-3 text-sm text-grey-100 placeholder:text-grey-60 focus:outline-none"
          />
          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {CALENDAR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                aria-pressed={c === newColor}
                onClick={() => setNewColor(c)}
                className={cn(
                  'h-5 w-5 rounded-full',
                  CALENDAR_COLOR_STYLES[c].swatchBg,
                  c === newColor && 'ring-2 ring-grey-100 ring-offset-1'
                )}
              />
            ))}
          </div>
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
              disabled={!newName.trim()}
              onClick={submit}
              className={cn(
                'flex-1 rounded-md py-1.5 text-sm font-medium text-white',
                newName.trim() ? 'bg-green-80' : 'cursor-not-allowed bg-grey-40'
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
                colorKey={category.colorKey}
                checked={categoryVisible[category.id] ?? true}
                onToggle={() => onToggleCategory(category.id)}
              />
            </div>
            {(onChangeCategoryColor || onDeleteCategory) && (
              <CategorySettingsMenu
                categoryName={category.name}
                colorKey={category.colorKey}
                onChangeColor={(colorKey) =>
                  onChangeCategoryColor?.(category.id, colorKey)
                }
                onDelete={() => onDeleteCategory?.(category.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
