import React from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';

import { dayjs, getMonthMatrix, isSameDay } from '../../utils/calendarDate';
import type { Dayjs } from '../../utils/calendarDate';

interface DatePopoverCalendarProps {
  value: Dayjs | null;
  onSelect: (day: Dayjs) => void;
  /** 선택 가능 하한 — 이 날짜 이전은 비활성(미지정 시 제한 없음). */
  minDate?: Dayjs | null;
  /** 선택 가능 상한 — 이 날짜 이후는 비활성(미지정 시 제한 없음). */
  maxDate?: Dayjs | null;
  /** 펼침 방향 — 'up'이면 트리거 위로(하단에서 CTA 밑으로 잘리는 것 방지). 기본 'down'. */
  direction?: 'up' | 'down';
  /** 뷰포트 침범 보정 translate(px). */
  offset?: { x: number; y: number };
}

/**
 * 날짜 필드 클릭 시 뜨는 팝오버 달력.
 * 오늘 = 초록 링(테두리), 선택 = 초록 채움(bg green-20), 타월 = 회색.
 * direction/offset은 useDropdownPosition으로 부모가 계산해 넘긴다(스크롤 패널 클리핑 보정).
 */
export const DatePopoverCalendar = React.forwardRef<
  HTMLDivElement,
  DatePopoverCalendarProps
>(function DatePopoverCalendar(
  { value, onSelect, minDate, maxDate, direction = 'down', offset },
  ref
) {
  const [viewMonth, setViewMonth] = React.useState<Dayjs>(
    () => value ?? dayjs()
  );
  const weeks = getMonthMatrix(viewMonth);
  const today = dayjs();

  const isOutOfRange = (day: Dayjs): boolean =>
    (!!minDate && day.isBefore(minDate, 'day')) ||
    (!!maxDate && day.isAfter(maxDate, 'day'));

  // 인접 달이 통째로 범위 밖이면 이동 버튼 비활성(빈 달 탐색 방지).
  const canGoPrev =
    !minDate ||
    !viewMonth.subtract(1, 'month').endOf('month').isBefore(minDate);
  const canGoNext =
    !maxDate || !viewMonth.add(1, 'month').startOf('month').isAfter(maxDate);

  return (
    <div
      ref={ref}
      style={
        offset && (offset.x || offset.y)
          ? { transform: `translate(${offset.x}px, ${offset.y}px)` }
          : undefined
      }
      className={cn(
        'absolute left-0 z-30 w-[311px] rounded-md border border-[#ecedf3] bg-white p-6 shadow-modal',
        direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-m font-medium text-grey-100">
          {viewMonth.format('YYYY.MM')}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="이전 달"
            disabled={!canGoPrev}
            onClick={() =>
              canGoPrev && setViewMonth((m) => m.subtract(1, 'month'))
            }
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md border border-grey-40 bg-grey-10 text-[#a1a2a8]',
              !canGoPrev && 'cursor-not-allowed opacity-40'
            )}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="다음 달"
            disabled={!canGoNext}
            onClick={() => canGoNext && setViewMonth((m) => m.add(1, 'month'))}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md border border-grey-40 bg-grey-10 text-[#a1a2a8]',
              !canGoNext && 'cursor-not-allowed opacity-40'
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-2">
        {weeks.flat().map((day) => {
          const inMonth = day.isSame(viewMonth, 'month');
          const isSelected = !!value && isSameDay(day, value);
          const isToday = isSameDay(day, today);
          const disabled = isOutOfRange(day);
          return (
            <div
              key={day.toISOString()}
              className="flex items-center justify-center"
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelect(day)}
                className={cn(
                  'flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm font-medium',
                  disabled
                    ? 'cursor-not-allowed text-grey-40'
                    : isSelected
                      ? 'bg-green-20 text-green-80'
                      : isToday
                        ? 'border border-green-80 text-grey-100'
                        : inMonth
                          ? 'text-grey-100'
                          : 'text-grey-60'
                )}
              >
                {day.date()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
