import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

import { CALENDAR_COLOR_STYLES } from '../../constants';
import type { CalendarColorKey } from '../../types';

interface CategoryToggleItemProps {
  label: string;
  colorKey: CalendarColorKey;
  checked: boolean;
  onToggle: () => void;
}

/**
 * 색상 체크박스형 토글 항목 ('일정 표시' / '나의 캘린더' 공용).
 * 켜짐: 색상 배경 + 체크 / 꺼짐: 빈 박스(테두리)
 */
export function CategoryToggleItem({
  label,
  colorKey,
  checked,
  onToggle,
}: CategoryToggleItemProps) {
  const style = CALENDAR_COLOR_STYLES[colorKey];

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
          checked ? style.swatchBg : 'border border-grey-40 bg-white'
        )}
      >
        {checked && (
          <Check size={18} strokeWidth={3} className={style.swatchCheck} />
        )}
      </span>
      <span className="text-sm font-medium text-[#a2a2a2]">{label}</span>
    </button>
  );
}
