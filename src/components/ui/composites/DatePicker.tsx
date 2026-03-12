import React from 'react';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

export interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** 선택 가능한 최소 날짜 (YYYY-MM-DD) */
  min?: string;
  /** 선택 가능한 최대 날짜 (YYYY-MM-DD) */
  max?: string;
  /** 범위 시작 기준점 — 이 날짜부터 선택한(또는 호버한) 날짜까지 하이라이트 */
  rangeStart?: string;
  /** 범위 종료 기준점 — 선택한(또는 호버한) 날짜부터 이 날짜까지 하이라이트 */
  rangeEnd?: string;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** YYYY-MM-DD → "YYYY년 M월 D일" */
function formatDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

/** Date → "YYYY-MM-DD" */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 해당 월의 캘린더 그리드 (이전달 패딩 포함) */
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // 이전 달 패딩
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // 현재 달
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // 다음 달 패딩 (6줄 채우기)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  return days;
}

const DROPDOWN_HEIGHT = 320;

/**
 * DatePicker - 캘린더 팝업 날짜 선택 컴포넌트
 *
 * @example
 * <DatePicker value="2025-01-15" onChange={setDate} placeholder="날짜 선택" />
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = '날짜를 선택하세요',
  disabled = false,
  className,
  min,
  max,
  rangeStart,
  rangeEnd,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(() =>
    new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = React.useState(() => new Date().getMonth());
  const [hoverDate, setHoverDate] = React.useState<string | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });

  const today = toDateString(new Date());

  // value 변경 시 해당 월로 뷰 이동
  React.useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  // 드롭다운 위치 계산
  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldShowAbove =
        spaceBelow < DROPDOWN_HEIGHT && rect.top > spaceBelow;

      setPosition({
        top: shouldShowAbove
          ? rect.top + window.scrollY - DROPDOWN_HEIGHT - 4
          : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 280),
      });
    }
  }, [isOpen]);

  // 외부 클릭 감지
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelect = (date: Date) => {
    onChange?.(toDateString(date));
    setIsOpen(false);
    setHoverDate(null);
  };

  // ── 범위 계산 ──
  // rangeEnd가 있으면: 이 피커는 시작일 피커 → (hover||value) ~ rangeEnd
  // rangeStart가 있으면: 이 피커는 종료일 피커 → rangeStart ~ (hover||value)
  let rStart: string | undefined;
  let rEnd: string | undefined;

  if (rangeEnd) {
    const anchor = hoverDate || value;
    if (anchor && anchor <= rangeEnd) {
      rStart = anchor;
      rEnd = rangeEnd;
    }
  } else if (rangeStart) {
    const anchor = hoverDate || value;
    if (anchor && rangeStart <= anchor) {
      rStart = rangeStart;
      rEnd = anchor;
    }
  }

  const days = getCalendarDays(viewYear, viewMonth);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between',
          'rounded-[var(--radius-md)] border-2 border-border bg-surface px-4',
          'text-sm transition-colors duration-200',
          'hover:border-primary-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'border-primary',
          className
        )}
      >
        <span className={cn(!value && 'text-fg-muted', 'text-fg')}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-fg-muted" />
      </button>

      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
            }}
            className={cn(
              'z-[9999]',
              'rounded-[var(--radius-md)] border-2 border-border bg-surface shadow-lg',
              'p-3'
            )}
          >
            {/* 헤더: 월 네비게이션 */}
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="cursor-pointer rounded bg-surface px-1 py-0.5 text-sm font-semibold text-fg hover:bg-surface-contrast focus:outline-none"
                >
                  {Array.from(
                    { length: new Date().getFullYear() - 1970 + 3 },
                    (_, i) => 1970 + i
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="cursor-pointer rounded bg-surface px-1 py-0.5 text-sm font-semibold text-fg hover:bg-surface-contrast focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>
                      {m + 1}월
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 요일 라벨 */}
            <div className="mb-1 grid grid-cols-7 gap-0">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-xs font-medium text-fg-muted"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div
              className="grid grid-cols-7 gap-0"
              onMouseLeave={() => setHoverDate(null)}
            >
              {days.map(({ date, isCurrentMonth }, i) => {
                const dateStr = toDateString(date);
                const isToday = dateStr === today;
                const isSelected = dateStr === value;
                const isOutOfRange =
                  (min && dateStr < min) || (max && dateStr > max);

                // 범위 하이라이트
                const inRange =
                  !isOutOfRange &&
                  rStart &&
                  rEnd &&
                  dateStr >= rStart &&
                  dateStr <= rEnd;
                const isRangeStart = inRange && dateStr === rStart;
                const isRangeEnd = inRange && dateStr === rEnd;

                return (
                  <div
                    key={i}
                    className="relative flex h-8 items-center justify-center"
                    onMouseEnter={() => !isOutOfRange && setHoverDate(dateStr)}
                  >
                    {/* 범위 배경 스트립 */}
                    {inRange && !(isRangeStart && isRangeEnd) && (
                      <div
                        className={cn(
                          'absolute inset-y-0 bg-primary-50',
                          isRangeStart &&
                            'left-1/4 right-0 rounded-bl-full rounded-tl-full',
                          isRangeEnd &&
                            'left-0 right-1/4 rounded-br-full rounded-tr-full',
                          !isRangeStart && !isRangeEnd && 'inset-x-0'
                        )}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => !isOutOfRange && handleSelect(date)}
                      disabled={!!isOutOfRange}
                      className={cn(
                        'relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors',
                        isOutOfRange && 'cursor-not-allowed text-fg-muted',
                        !isOutOfRange && !isCurrentMonth && 'text-fg-muted',
                        !isOutOfRange &&
                          isCurrentMonth &&
                          !isSelected &&
                          'text-fg hover:bg-primary-50',
                        !isOutOfRange &&
                          isToday &&
                          !isSelected &&
                          'ring-primary/30 font-medium ring-1 ring-inset',
                        isSelected && 'bg-primary font-semibold text-white'
                      )}
                    >
                      {date.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

DatePicker.displayName = 'DatePicker';
