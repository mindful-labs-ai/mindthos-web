import { useEffect, useRef, useState } from 'react';

import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

import { CALENDAR_COLOR_STYLES, CALENDAR_PALETTE } from '../../constants';
import type { CalendarColorKey } from '../../types';

interface CalendarColorPickerProps {
  value: CalendarColorKey;
  onChange: (key: CalendarColorKey) => void;
}

/**
 * 일정 색상 선택기 — 제노그램 색상 선택기와 동일한 룩의 스와치 그리드 팝오버.
 * 트리거(현재 색 스와치) 클릭 → 8색 팔레트(2행 4열) 팝오버. 바깥 클릭(mousedown) 시 닫힘.
 */
export function CalendarColorPicker({
  value,
  onChange,
}: CalendarColorPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const handleSelect = (key: CalendarColorKey) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 현재 색 미리보기 버튼 */}
      <button
        type="button"
        aria-label="색상 선택"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'h-8 w-8 rounded-md border-2 border-grey-40 transition-shadow lg:hover:border-grey-70',
          CALENDAR_COLOR_STYLES[value].swatchBg
        )}
      />

      {/* 팔레트 팝오버 */}
      {open && (
        <div className="absolute right-0 top-10 z-30 flex flex-col gap-2 rounded-2xl border border-grey-40 bg-white p-3 shadow-elevated">
          {[CALENDAR_PALETTE.slice(0, 4), CALENDAR_PALETTE.slice(4)].map(
            (row, ri) => (
              <div key={ri} className="flex gap-2">
                {row.map((key) => {
                  const isSelected = key === value;
                  const style = CALENDAR_COLOR_STYLES[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={key}
                      aria-pressed={isSelected}
                      onClick={() => handleSelect(key)}
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 transition-shadow',
                        style.swatchBg,
                        isSelected
                          ? 'border-fg shadow-subtle'
                          : 'border-grey-40 lg:hover:border-grey-70'
                      )}
                    >
                      {isSelected && (
                        <Check
                          size={16}
                          strokeWidth={3}
                          className={style.swatchCheck}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
