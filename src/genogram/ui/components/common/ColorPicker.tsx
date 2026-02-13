import React, { useCallback, useEffect, useRef, useState } from 'react';

import { PALETTE, RELATION_HOSTILE } from '@/genogram/core/constants/colors';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const normalizedValue = value.toUpperCase();
  const isTransparentValue =
    normalizedValue === 'TRANSPARENT' || value === 'transparent';

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

  const handleSelect = useCallback(
    (color: string) => {
      onChange(color);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* 미리보기 버튼 */}
      <button
        type="button"
        className="h-8 w-8 rounded-md border-2 border-border transition-shadow hover:border-fg-muted"
        style={{
          backgroundColor: isTransparentValue ? '#FFFFFF' : value,
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        {isTransparentValue && (
          <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden="true">
            <line
              x1="4"
              y1="4"
              x2="28"
              y2="28"
              stroke={RELATION_HOSTILE}
              strokeWidth="2"
            />
          </svg>
        )}
      </button>

      {/* 드롭다운 팔레트 */}
      {open && (
        <div className="absolute right-0 top-10 z-20 flex flex-col gap-2 rounded-2xl border border-border bg-white p-3 shadow-lg">
          {[PALETTE.slice(0, 6), PALETTE.slice(6)].map((row, ri) => (
            <div key={ri} className="flex gap-2">
              {row.map((color) => {
                const isTransparent = color === 'transparent';
                const isSelected =
                  normalizedValue === color ||
                  (isTransparent && isTransparentValue);

                return (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 shrink-0 rounded-md border-2 transition-shadow ${
                      isSelected
                        ? 'border-fg shadow-sm'
                        : 'border-border hover:border-fg-muted'
                    }`}
                    style={{
                      backgroundColor: isTransparent ? '#FFFFFF' : color,
                    }}
                    onClick={() => handleSelect(color)}
                  >
                    {isTransparent && (
                      <svg
                        viewBox="0 0 32 32"
                        className="h-full w-full"
                        aria-hidden="true"
                      >
                        <line
                          x1="4"
                          y1="4"
                          x2="28"
                          y2="28"
                          stroke={RELATION_HOSTILE}
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
