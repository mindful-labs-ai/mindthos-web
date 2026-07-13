import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

import { CALENDAR_COLOR_STYLES } from '../../constants';
import type { CalendarColorKey } from '../../types';

interface CategoryToggleItemProps {
  label: string;
  /**
   * 색상 — 있으면 색 스와치(일정 표시 kind 토글), 없으면 중립 회색 체크박스(카테고리 토글).
   * 카테고리는 색을 갖지 않으므로 색 없이 표시한다.
   */
  colorKey?: CalendarColorKey;
  checked: boolean;
  onToggle: () => void;
}

/**
 * 체크박스형 토글 항목 ('일정 표시' / '나의 캘린더' 공용).
 * colorKey 있음: 색상 배경 + 색 체크 / 없음: 중립 회색 체크박스. 꺼짐: 빈 박스(테두리).
 */
export function CategoryToggleItem({
  label,
  colorKey,
  checked,
  onToggle,
}: CategoryToggleItemProps) {
  const style = colorKey ? CALENDAR_COLOR_STYLES[colorKey] : null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="flex w-full items-center gap-3"
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded',
          checked
            ? (style?.swatchBg ?? 'bg-grey-100')
            : 'border border-grey-40 bg-white'
        )}
      >
        {checked && (
          <Check
            size={18}
            strokeWidth={3}
            className={style?.swatchCheck ?? 'text-white'}
          />
        )}
      </span>
      <span className="text-sm font-medium text-grey-70">{label}</span>
    </button>
  );
}
