import React from 'react';

import { MoreVertical, Trash2 } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { Modal } from '@/shared/ui/composites/Modal';

import { CALENDAR_COLOR_STYLES, CALENDAR_PALETTE } from '../../constants';
import type { CalendarColorKey } from '../../types';

const COLOR_LABEL: Record<CalendarColorKey, string> = {
  green: '초록',
  red: '빨강',
  blue: '파랑',
  grey: '회색',
  orange: '주황',
  yellow: '노랑',
  purple: '보라',
  pink: '분홍',
};

interface CategorySettingsMenuProps {
  /** 카테고리 이름(삭제 다이얼로그 문구) */
  categoryName: string;
  /** 현재 카테고리 색(선택 표시용) */
  colorKey: CalendarColorKey;
  onChangeColor: (colorKey: CalendarColorKey) => void;
  onDelete: () => void;
}

/**
 * 카테고리 설정 — 세로 점 3개(kebab) → 팝오버(색상 팔레트 + 삭제).
 * 삭제는 확인 다이얼로그를 거친다(소속 일정도 함께 삭제). 바깥 클릭 시 팝오버 닫힘.
 */
export function CategorySettingsMenu({
  categoryName,
  colorKey,
  onChangeColor,
  onDelete,
}: CategorySettingsMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label="카테고리 설정"
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 items-center justify-center rounded text-grey-60 lg:hover:bg-grey-10"
      >
        <MoreVertical size={16} strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-[176px] rounded-lg border border-grey-40 bg-white p-2 shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="px-1 pb-2">
            <p className="mb-2 text-xs font-medium text-grey-60">색상</p>
            <div className="grid grid-cols-4 gap-2">
              {CALENDAR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={COLOR_LABEL[c]}
                  aria-pressed={c === colorKey}
                  onClick={() => {
                    onChangeColor(c);
                    setOpen(false);
                  }}
                  className={cn(
                    'h-6 w-6 rounded-full',
                    CALENDAR_COLOR_STYLES[c].swatchBg,
                    c === colorKey && 'ring-2 ring-grey-100 ring-offset-1'
                  )}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-[#ecedf3]" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirmOpen(true);
            }}
            className="mt-1 flex w-full items-center gap-2 rounded px-1 py-1.5 text-sm font-medium text-red-80 lg:hover:bg-grey-10"
          >
            <Trash2 size={15} strokeWidth={2} />
            삭제
          </button>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        className="max-w-[480px]"
      >
        <div className="flex flex-col items-center px-4 py-6">
          <h2 className="text-xl font-headline text-grey-100">
            카테고리를 삭제할까요?
          </h2>
          <p className="mt-8 text-center text-l font-medium text-grey-100">
            ‘{categoryName}’ 카테고리와
            <br />
            소속 일정이 함께 삭제돼요.
          </p>
          <p className="mt-4 text-center text-sm text-grey-70">
            삭제하면 되돌릴 수 없어요.
          </p>
          <div className="mt-10 flex w-full gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="flex-1 rounded-lg border border-grey-40 bg-white py-2 text-l font-medium text-grey-100 transition-colors lg:hover:bg-grey-10"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                onDelete();
              }}
              className="flex-1 rounded-lg bg-red-80 py-2 text-l font-medium text-white transition-opacity lg:hover:opacity-90"
            >
              삭제
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
