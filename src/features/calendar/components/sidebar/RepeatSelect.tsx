import React from 'react';

import { Calendar, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/cn';

import type { CalendarRepeatCycle, CalendarRepeatRule } from '../../types';
import { dayjs, type Dayjs } from '../../utils/calendarDate';

import { DatePopoverCalendar } from './DatePopoverCalendar';

interface RepeatSelectProps {
  value: CalendarRepeatRule | null;
  onChange: (rule: CalendarRepeatRule | null) => void;
  /** 종료일 기본값/하한 기준이 되는 일정 시작일 */
  anchorDate: Dayjs | null;
  /** 필드 라벨 — 상담='상담 주기', 개인='일정 주기'. 기본 '상담 주기' */
  label?: string;
}

/** 주기 옵션 — UI 키 → (서버 cycle, interval). 격주 = weekly + interval 2. */
type CycleKey = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

const CYCLE_OPTIONS: {
  key: CycleKey;
  label: string;
  cycle?: CalendarRepeatCycle;
  interval?: number;
}[] = [
  { key: 'none', label: '반복 안함' },
  { key: 'daily', label: '매일', cycle: 'daily', interval: 1 },
  { key: 'weekly', label: '매주', cycle: 'weekly', interval: 1 },
  { key: 'biweekly', label: '격주', cycle: 'weekly', interval: 2 },
  { key: 'monthly', label: '매월', cycle: 'monthly', interval: 1 },
  { key: 'yearly', label: '매년', cycle: 'yearly', interval: 1 },
];

const CYCLE_LABEL: Record<CycleKey, string> = {
  none: '반복 안함',
  daily: '매일',
  weekly: '매주',
  biweekly: '격주',
  monthly: '매월',
  yearly: '매년',
};

type EndType = 'never' | 'until' | 'count';

const END_OPTIONS: { key: EndType; label: string }[] = [
  { key: 'never', label: '계속' },
  { key: 'until', label: '종료일' },
  { key: 'count', label: '횟수' },
];

/** 현재 규칙 → UI 주기 키 (weekly+interval2 → 격주). */
function cycleKeyOf(rule: CalendarRepeatRule | null): CycleKey {
  if (!rule) return 'none';
  if (rule.cycle === 'weekly' && rule.interval === 2) return 'biweekly';
  return rule.cycle;
}

/** 현재 규칙 → 종료 조건 타입. */
function endTypeOf(rule: CalendarRepeatRule | null): EndType {
  if (!rule) return 'never';
  if (rule.count !== null) return 'count';
  if (rule.until !== null) return 'until';
  return 'never';
}

/** 일정 반복 규칙 편집 — 주기 드롭다운 + 종료 조건(계속/종료일/횟수). */
export function RepeatSelect({
  value,
  onChange,
  anchorDate,
  label = '상담 주기',
}: RepeatSelectProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const dateRef = React.useRef<HTMLDivElement>(null);

  const cycleKey = cycleKeyOf(value);
  const endType = endTypeOf(value);

  // 팝오버 바깥 클릭 닫기
  React.useEffect(() => {
    if (!menuOpen && !datePickerOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (dateRef.current && !dateRef.current.contains(t)) {
        setDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen, datePickerOpen]);

  const selectCycle = (key: CycleKey) => {
    setMenuOpen(false);
    if (key === 'none') {
      onChange(null);
      return;
    }
    const opt = CYCLE_OPTIONS.find((o) => o.key === key);
    if (!opt?.cycle) return;
    // 주기를 바꿔도 기존 종료조건/예외는 유지.
    onChange({
      cycle: opt.cycle,
      interval: opt.interval ?? 1,
      count: value?.count ?? null,
      until: value?.until ?? null,
      exceptions: value?.exceptions ?? null,
    });
  };

  const defaultUntil = (): string =>
    (anchorDate ?? dayjs()).add(1, 'month').format('YYYY-MM-DD');

  const selectEnd = (type: EndType) => {
    if (!value) return;
    if (type === 'never') onChange({ ...value, count: null, until: null });
    if (type === 'count') {
      onChange({ ...value, count: value.count ?? 10, until: null });
    }
    if (type === 'until') {
      onChange({ ...value, until: value.until ?? defaultUntil(), count: null });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 주기 드롭다운 */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-emphasize text-grey-100">{label}</span>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              'flex h-[35px] items-center gap-1.5 rounded-md border border-[#ecedf3] bg-white px-2.5 text-sm',
              value ? 'text-grey-100' : 'text-[#abaebe]'
            )}
          >
            {CYCLE_LABEL[cycleKey]}
            <ChevronDown size={16} strokeWidth={1.5} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-[120px] rounded-md border border-[#ecedf3] bg-white p-1.5 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]">
              {CYCLE_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => selectCycle(o.key)}
                  className={cn(
                    'flex w-full items-center rounded px-2.5 py-2 text-left text-sm',
                    o.key === cycleKey
                      ? 'font-emphasize text-green-80'
                      : 'text-grey-100 lg:hover:bg-grey-10'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 종료 조건 — 반복일 때만 */}
      {value && (
        <div className="flex flex-col gap-3 rounded-md bg-grey-10 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-grey-100">반복 종료</span>
            <div className="flex gap-1.5">
              {END_OPTIONS.map((o) => {
                const active = o.key === endType;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => selectEnd(o.key)}
                    className={cn(
                      'h-[30px] rounded-md border px-2.5 text-sm font-medium',
                      active
                        ? 'border-green-80 bg-[#44ce4b0d] text-green-80'
                        : 'border-[#ecedf3] bg-white text-[#abaebe]'
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {endType === 'count' && (
            <div className="flex items-center justify-end gap-2">
              <input
                type="number"
                min={1}
                value={value.count ?? 1}
                onChange={(e) =>
                  onChange({
                    ...value,
                    count: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="h-[35px] w-[72px] rounded-md border border-grey-40 bg-white px-2.5 text-right text-sm text-grey-100 focus:outline-none"
              />
              <span className="text-sm text-grey-100">회</span>
            </div>
          )}

          {endType === 'until' && (
            <div ref={dateRef} className="relative flex justify-end">
              <button
                type="button"
                onClick={() => setDatePickerOpen((o) => !o)}
                className="flex h-[35px] items-center gap-1.5 rounded-md border border-grey-40 bg-white px-2.5 text-sm text-grey-100"
              >
                {value.until ?? '날짜 선택'}
                <Calendar
                  size={18}
                  strokeWidth={1.5}
                  className="shrink-0 text-[#a1a2a8]"
                />
              </button>
              {datePickerOpen && (
                <DatePopoverCalendar
                  value={value.until ? dayjs(value.until) : anchorDate}
                  onSelect={(d) => {
                    onChange({
                      ...value,
                      until: d.format('YYYY-MM-DD'),
                      count: null,
                    });
                    setDatePickerOpen(false);
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
