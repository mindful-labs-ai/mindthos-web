import React from 'react';

import { Calendar, ChevronDown, ChevronLeft, User } from 'lucide-react';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { cn } from '@/lib/cn';
import { ClientSelector } from '@/widgets/client/ClientSelector';

import { WEEKDAYS_KO } from '../../constants';
import type { CalendarEvent, CalendarEventKind } from '../../types';
import { dayjs, type Dayjs } from '../../utils/calendarDate';

import { DatePopoverCalendar } from './DatePopoverCalendar';
import { TimeSelect } from './TimeSelect';

export interface AddEventDraft {
  kind: CalendarEventKind;
  title: string;
  startTime: string;
  endTime: string;
}

interface AddEventPanelProps {
  initialKind: CalendarEventKind;
  /** 달력에서 선택된 날짜 (양방향 동기화) */
  selectedDate: Dayjs | null;
  /** 초기 시작/종료 시간 (주간 드래그 선택 또는 기본값) */
  initialStartTime: string;
  initialEndTime: string;
  /** 편집 중인 일정 (있으면 '변경하기' 모드) */
  editingEvent?: CalendarEvent | null;
  /** 팝오버 달력에서 날짜 선택 (달력 하이라이트와 동기화) */
  onSelectDate: (day: Dayjs) => void;
  onClose: () => void;
  onSubmit: (draft: AddEventDraft) => void;
}

const KIND_OPTIONS: { value: CalendarEventKind; label: string }[] = [
  { value: 'counseling', label: '상담' },
  { value: 'personal', label: '개인' },
];

// 30분 단위 시간 옵션 (00:00 ~ 23:30)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 ? 30 : 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});
// 종료 시간 풀: 00:30 ~ 23:30 + 24:00 (00:00은 종료가 될 수 없음)
const END_TIME_OPTIONS = [...TIME_OPTIONS.slice(1), '24:00'];

function formatDateLabel(date: Dayjs | null): string {
  if (!date) return '날짜를 선택하세요';
  return `${date.format('YYYY.MM.DD')} ${WEEKDAYS_KO[date.day()]}요일`;
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-m font-emphasize text-grey-100">{children}</span>
);

/** 일정 추가하기 슬라이드오버 패널 */
export function AddEventPanel({
  initialKind,
  selectedDate,
  initialStartTime,
  initialEndTime,
  editingEvent,
  onSelectDate,
  onClose,
  onSubmit,
}: AddEventPanelProps) {
  const [kind, setKind] = React.useState<CalendarEventKind>(initialKind);
  const [title, setTitle] = React.useState(editingEvent?.title ?? '');
  const [startTime, setStartTime] = React.useState(initialStartTime);
  const [endTime, setEndTime] = React.useState(initialEndTime);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const dateFieldRef = React.useRef<HTMLDivElement>(null);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [clientSelectOpen, setClientSelectOpen] = React.useState(false);
  const { clients } = useClientList();

  // 패널이 열린 상태에서 다시 드래그/선택해 초기 시간이 바뀌면 입력값 동기화
  React.useEffect(() => {
    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
  }, [initialStartTime, initialEndTime]);

  // 팝오버 바깥 클릭 시 닫기
  React.useEffect(() => {
    if (!datePickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (
        dateFieldRef.current &&
        !dateFieldRef.current.contains(e.target as Node)
      ) {
        setDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [datePickerOpen]);

  // 종료 시간은 시작 이후만 선택 가능
  const endOptions = END_TIME_OPTIONS.filter((t) => t > startTime);

  // 시작 시간 변경 시, 종료가 시작보다 빠르면 자동으로 다음 슬롯으로 밀기
  const handleStartChange = (v: string) => {
    setStartTime(v);
    if (endTime <= v) {
      const idx = END_TIME_OPTIONS.indexOf(v);
      setEndTime(END_TIME_OPTIONS[idx + 1] ?? v);
    }
  };

  // 편집 모드 + 변경 감지 (수정사항이 있을 때만 CTA 활성화)
  const isEdit = !!editingEvent;
  const origStart = editingEvent ? dayjs(editingEvent.start) : null;
  const origEnd =
    editingEvent && editingEvent.end
      ? dayjs(editingEvent.end)
      : (origStart?.add(1, 'hour') ?? null);
  const isDirty =
    !editingEvent ||
    kind !== editingEvent.kind ||
    title !== editingEvent.title ||
    startTime !== (origStart ? origStart.format('HH:mm') : '') ||
    endTime !== (origEnd ? origEnd.format('HH:mm') : '') ||
    (selectedDate ? selectedDate.format('YYYY-MM-DD') : '') !==
      (origStart ? origStart.format('YYYY-MM-DD') : '');
  const ctaEnabled = !isEdit || isDirty;

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-5 pb-4 pt-7">
        <button
          type="button"
          aria-label="뒤로"
          onClick={onClose}
          className="text-[#8b8c93]"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h2 className="text-m font-emphasize text-[#222121]">
          {isEdit ? '일정 변경하기' : '일정 추가하기'}
        </h2>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-3">
        {/* 일정 종류 */}
        <div className="flex items-center justify-between gap-4">
          <FieldLabel>일정 종류</FieldLabel>
          <div className="flex gap-2.5">
            {KIND_OPTIONS.map((opt) => {
              const active = opt.value === kind;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKind(opt.value)}
                  className={cn(
                    'h-[35px] w-[60px] rounded-md border text-m font-medium',
                    active
                      ? 'border-green-80 bg-[#44ce4b0d] text-green-80'
                      : 'border-[#ecedf3] bg-white text-[#abaebe]'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 내담자 선택 — 앱 공용 ClientSelector 그대로 사용 */}
        <div className="flex items-center justify-between gap-4">
          <FieldLabel>내담자 선택</FieldLabel>
          <ClientSelector
            variant="dropdown"
            clients={clients}
            selectedClient={selectedClient}
            onSelect={setSelectedClient}
            open={clientSelectOpen}
            onOpenChange={setClientSelectOpen}
            placement="bottom-right"
            trigger={
              <div className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#ecedf3] bg-white px-2.5 text-m">
                <User
                  size={18}
                  strokeWidth={1.5}
                  className="shrink-0 text-[#abaebe]"
                />
                <span
                  className={
                    selectedClient ? 'text-grey-100' : 'text-[#abaebe]'
                  }
                >
                  {selectedClient ? selectedClient.name : '고객 선택 안됨'}
                </span>
              </div>
            }
          />
        </div>

        {/* 일정 제목 */}
        <div className="flex flex-col gap-4">
          <FieldLabel>일정 제목</FieldLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요"
            className="h-[38px] w-full rounded-md border border-grey-40 bg-grey-10 px-3 text-m text-grey-100 placeholder:text-grey-60 focus:outline-none"
          />
        </div>

        <div className="border-t border-[#ecedf3]" />

        {/* 날짜 및 시간 */}
        <div className="flex flex-col gap-4">
          <FieldLabel>날짜 및 시간</FieldLabel>
          <div className="flex flex-col gap-2">
            <div ref={dateFieldRef} className="relative">
              <button
                type="button"
                onClick={() => setDatePickerOpen((o) => !o)}
                className="flex h-[38px] w-full items-center justify-between rounded-md border border-grey-40 bg-grey-10 px-3 text-m text-grey-100"
              >
                <span className={selectedDate ? 'text-grey-100' : 'text-grey-60'}>
                  {formatDateLabel(selectedDate)}
                </span>
                <Calendar
                  size={20}
                  strokeWidth={1.5}
                  className="shrink-0 text-[#a1a2a8]"
                />
              </button>
              {datePickerOpen && (
                <DatePopoverCalendar
                  value={selectedDate}
                  onSelect={(d) => {
                    onSelectDate(d);
                    setDatePickerOpen(false);
                  }}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <TimeSelect
                value={startTime}
                options={TIME_OPTIONS}
                onChange={handleStartChange}
                ariaLabel="시작 시간"
              />
              <span className="shrink-0 text-m text-black">~</span>
              <TimeSelect
                value={endTime}
                options={endOptions}
                onChange={setEndTime}
                ariaLabel="종료 시간"
              />
            </div>
          </div>
        </div>

        {/* 상담 주기 */}
        <div className="flex items-center justify-between gap-4">
          <FieldLabel>상담 주기</FieldLabel>
          <button
            type="button"
            className="flex h-[35px] items-center gap-1.5 rounded-md border border-[#ecedf3] bg-white px-2.5 text-m text-[#abaebe]"
          >
            반복 안함
            <ChevronDown size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* 상담 방식 */}
        <div className="flex items-center justify-between gap-4">
          <FieldLabel>상담 방식</FieldLabel>
          <button
            type="button"
            className="flex h-[35px] items-center gap-1.5 rounded-md border border-[#ecedf3] bg-white px-2.5 text-m text-[#abaebe]"
          >
            선택 안함
            <ChevronDown size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 푸터 */}
      <div className="px-5 pb-9 pt-4">
        <button
          type="button"
          disabled={!ctaEnabled}
          onClick={() => onSubmit({ kind, title, startTime, endTime })}
          className={cn(
            'h-[41px] w-full rounded-md text-m font-emphasize text-white',
            ctaEnabled ? 'bg-green-80' : 'cursor-not-allowed bg-grey-40'
          )}
        >
          {isEdit ? '변경하기' : '일정 추가하기'}
        </button>
      </div>
    </div>
  );
}
