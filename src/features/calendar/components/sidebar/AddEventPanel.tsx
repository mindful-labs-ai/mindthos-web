import React from 'react';

import { Calendar, ChevronDown, User, X } from 'lucide-react';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useDevice } from '@/shared/hooks/useDevice';
import { useDropdownPosition } from '@/shared/hooks/useDropdownPosition';
import { MobileModalHeader } from '@/shared/ui';
import { Modal } from '@/shared/ui/composites/Modal';
import { ClientSelector } from '@/widgets/client/ClientSelector';

import { CALENDAR_COLOR_STYLES, WEEKDAYS_KO } from '../../constants';
import { useCalendarCategories } from '../../hooks/useCalendarEvents';
import type {
  CalendarEventKind,
  CalendarEvent,
  CalendarEventTimeKind,
  CalendarRepeatRule,
  CounselMethod,
} from '../../types';
import { dayjs, type Dayjs } from '../../utils/calendarDate';

import { CounselMethodSelect } from './CounselMethodSelect';
import { DatePopoverCalendar } from './DatePopoverCalendar';
import { RepeatSelect } from './RepeatSelect';
import { TimeSelect } from './TimeSelect';

export interface AddEventDraft {
  kind: CalendarEventKind;
  title: string;
  /** 시간 종류 — ALL_DAY면 시간 대신 그 날 전체. */
  eventTimeKind: CalendarEventTimeKind;
  startTime: string;
  endTime: string;
  /** 상담 일정 대상 내담자 id (상담 일정에서만, 개인은 null) */
  clientId: string | null;
  /** 상담 방식 (상담 일정에서만, 개인은 null) */
  counselMethod: CounselMethod | null;
  /** '나의 캘린더' 카테고리 id (개인 일정에서만, 상담은 null) */
  categoryId: string | null;
  /** 반복 규칙 (없으면 단일 일정) */
  repeat: CalendarRepeatRule | null;
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
  /** 편집 모드 삭제 — 있으면 하단에 '삭제하기' 노출. 반복 일정은 'this'(이 회차)/'all'(전체) 구분 */
  onDelete?: (mode: 'this' | 'all') => void;
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

const FieldLabel = ({
  children,
  required,
}: {
  children: React.ReactNode;
  /** 필수값(CTA 활성화 조건) — 라벨 오른쪽에 빨간 * */
  required?: boolean;
}) => (
  <span className="text-sm font-emphasize text-grey-100">
    {children}
    {required && <span className="ml-0.5 text-red-80">*</span>}
  </span>
);

/** 반복 주기 라벨 — 격주 = weekly + interval 2. */
function repeatCycleLabel(repeat: CalendarRepeatRule): string {
  switch (repeat.cycle) {
    case 'daily':
      return '매일';
    case 'weekly':
      return repeat.interval === 2 ? '격주' : '매주';
    case 'monthly':
      return '매월';
    case 'yearly':
      return '매년';
    default:
      return repeat.cycle;
  }
}

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
  onDelete,
}: AddEventPanelProps) {
  const [kind, setKind] = React.useState<CalendarEventKind>(initialKind);
  const [title, setTitle] = React.useState(editingEvent?.title ?? '');
  const [allDay, setAllDay] = React.useState(
    editingEvent?.eventTimeKind === 'ALL_DAY'
  );
  const [startTime, setStartTime] = React.useState(initialStartTime);
  const [endTime, setEndTime] = React.useState(initialEndTime);
  const [repeat, setRepeat] = React.useState<CalendarRepeatRule | null>(
    editingEvent?.repeat ?? null
  );
  const [counselMethod, setCounselMethod] =
    React.useState<CounselMethod | null>(editingEvent?.counselMethod ?? null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const dateFieldRef = React.useRef<HTMLDivElement>(null);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [clientSelectOpen, setClientSelectOpen] = React.useState(false);
  // 개인 일정 카테고리('나의 캘린더') — 선택 시 그 카테고리 색으로 표시. null = 선택 안 함.
  const [categoryId, setCategoryId] = React.useState<string | null>(
    editingEvent?.categoryId ?? null
  );
  const [categorySelectOpen, setCategorySelectOpen] = React.useState(false);
  const categoryFieldRef = React.useRef<HTMLDivElement>(null);
  const { clients } = useClientList();
  const { data: categories = [] } = useCalendarCategories();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;

  // 카테고리 드롭다운 바깥 클릭 시 닫기
  useClickOutside(
    categoryFieldRef,
    () => setCategorySelectOpen(false),
    categorySelectOpen
  );
  // 화면 밖으로 안 나가게: 카테고리 드롭다운 위/아래 펼침 + 넘치면 좌표 보정
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);
  const { direction: categoryDirection, offset: categoryOffset } =
    useDropdownPosition(
      categoryFieldRef,
      categoryDropdownRef,
      categorySelectOpen,
      { estimatedHeight: 210 }
    );

  // 패널이 열린 상태에서 다시 드래그/선택해 초기 시간이 바뀌면 입력값 동기화
  React.useEffect(() => {
    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
  }, [initialStartTime, initialEndTime]);

  // 팝오버 바깥 클릭 시 닫기
  useClickOutside(dateFieldRef, () => setDatePickerOpen(false), datePickerOpen);

  // 편집 모드 — 상담 일정의 기존 내담자를 셀렉터에 prefill (clients 로드 후 1회)
  const clientPrefilledRef = React.useRef(false);
  React.useEffect(() => {
    if (clientPrefilledRef.current) return;
    if (editingEvent?.clientId && clients.length) {
      setSelectedClient(
        clients.find((c) => c.id === editingEvent.clientId) ?? null
      );
      clientPrefilledRef.current = true;
    }
  }, [editingEvent?.clientId, clients]);

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
  // 내담자·상담 방식은 상담 일정에서만, 카테고리는 개인 일정에서만 의미 — 그 외면 null로 본다.
  const effectiveClientId =
    kind === 'counseling' ? (selectedClient?.id ?? null) : null;
  const effectiveCounselMethod = kind === 'counseling' ? counselMethod : null;
  const effectiveCategoryId = kind === 'personal' ? categoryId : null;
  const isDirty =
    !editingEvent ||
    kind !== editingEvent.kind ||
    title !== editingEvent.title ||
    allDay !== (editingEvent.eventTimeKind === 'ALL_DAY') ||
    startTime !== (origStart ? origStart.format('HH:mm') : '') ||
    endTime !== (origEnd ? origEnd.format('HH:mm') : '') ||
    (selectedDate ? selectedDate.format('YYYY-MM-DD') : '') !==
      (origStart ? origStart.format('YYYY-MM-DD') : '') ||
    effectiveClientId !== (editingEvent.clientId ?? null) ||
    effectiveCounselMethod !== (editingEvent.counselMethod ?? null) ||
    effectiveCategoryId !== (editingEvent.categoryId ?? null) ||
    JSON.stringify(repeat) !== JSON.stringify(editingEvent.repeat ?? null);
  // 상담 일정은 내담자 선택이 필수(서버 계약: COUNSELING은 clientId 필요).
  const counselingNeedsClient = kind === 'counseling' && !selectedClient;
  // 필수값: 상담 일정이면 내담자. 제목은 비워도 추가 가능('제목 없음'으로 저장).
  const ctaEnabled = (!isEdit || isDirty) && !counselingNeedsClient;

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 — 모바일은 녹음 업로드 모달과 동일한 고정 헤더, 데스크탑은 슬라이드오버 헤더 */}
      {isMobileView ? (
        <MobileModalHeader
          title={isEdit ? '일정 변경하기' : '일정 추가하기'}
          onBack={onClose}
        />
      ) : (
        <div className="flex items-center justify-between px-5 pb-4 pt-7">
          <h2 className="text-sm font-emphasize text-[#222121]">
            {isEdit ? '일정 변경하기' : '일정 추가하기'}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="text-[#8b8c93]"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>
      )}

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
                    'h-[35px] w-[60px] rounded-md border text-sm font-medium',
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

        {/* 내담자 선택 — 상담 일정에서만 노출(개인 일정은 숨김) */}
        {kind === 'counseling' && (
          <div className="flex items-center justify-between gap-4">
            <FieldLabel required>내담자 선택</FieldLabel>
            <ClientSelector
              variant="dropdown"
              clients={clients}
              selectedClient={selectedClient}
              onSelect={setSelectedClient}
              open={clientSelectOpen}
              onOpenChange={setClientSelectOpen}
              placement="bottom-right"
              trigger={
                <div className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#ecedf3] bg-white px-2.5 text-sm">
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
        )}

        {/* 일정 제목 — 비워두면 '제목 없음'으로 저장(필수 아님) */}
        <div className="flex flex-col gap-4">
          <FieldLabel>일정 제목</FieldLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요"
            className="h-[38px] w-full rounded-md border border-grey-40 bg-grey-10 px-3 text-sm text-grey-100 placeholder:text-grey-60 focus:outline-none"
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
                className="flex h-[38px] w-full items-center justify-between rounded-md border border-grey-40 bg-grey-10 px-3 text-sm text-grey-100"
              >
                <span
                  className={selectedDate ? 'text-grey-100' : 'text-grey-60'}
                >
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
            {/* 하루 종일 토글 — 켜면 시간 선택을 숨기고 그 날 전체 일정으로 */}
            <div className="flex items-center justify-between px-0.5 py-1">
              <span className="text-sm text-grey-100">하루 종일</span>
              <button
                type="button"
                role="switch"
                aria-checked={allDay}
                aria-label="하루 종일"
                onClick={() => setAllDay((v) => !v)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  allDay ? 'bg-green-80' : 'bg-[#dfe1ea]'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 rounded-full bg-white transition-transform',
                    allDay ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
            {!allDay && (
              <div className="flex items-center gap-2">
                <TimeSelect
                  value={startTime}
                  options={TIME_OPTIONS}
                  onChange={handleStartChange}
                  ariaLabel="시작 시간"
                />
                <span className="shrink-0 text-sm text-black">~</span>
                <TimeSelect
                  value={endTime}
                  options={endOptions}
                  onChange={setEndTime}
                  ariaLabel="종료 시간"
                />
              </div>
            )}
          </div>
        </div>

        {/* 주기 (반복 규칙) — 개인 일정은 '일정 주기', 상담은 '상담 주기' */}
        <RepeatSelect
          value={repeat}
          onChange={setRepeat}
          anchorDate={selectedDate}
          label={kind === 'personal' ? '일정 주기' : '상담 주기'}
        />

        {/* 상담 방식 — 상담 일정에서만 노출(개인 일정은 숨김) */}
        {kind === 'counseling' && (
          <CounselMethodSelect
            value={counselMethod}
            onChange={setCounselMethod}
          />
        )}

        {/* 카테고리(나의 캘린더) — 개인 일정에서만. 선택 시 그 카테고리 색으로 표시 */}
        {kind === 'personal' && (
          <div
            ref={categoryFieldRef}
            className="flex items-center justify-between gap-4"
          >
            <FieldLabel>카테고리</FieldLabel>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategorySelectOpen((o) => !o)}
                className="flex h-9 min-w-[140px] items-center justify-between gap-2 rounded-md border border-[#ecedf3] bg-white px-2.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {selectedCategory ? (
                    <>
                      <span
                        className={cn(
                          'h-3 w-3 shrink-0 rounded-full',
                          CALENDAR_COLOR_STYLES[selectedCategory.colorKey]
                            .swatchBg
                        )}
                      />
                      <span className="truncate text-grey-100">
                        {selectedCategory.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-[#abaebe]">선택 안 함</span>
                  )}
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  className="shrink-0 text-[#abaebe]"
                />
              </button>
              {categorySelectOpen && (
                <div
                  ref={categoryDropdownRef}
                  style={{
                    transform:
                      categoryOffset.x || categoryOffset.y
                        ? `translate(${categoryOffset.x}px, ${categoryOffset.y}px)`
                        : undefined,
                  }}
                  className={cn(
                    'absolute right-0 z-30 max-h-[210px] w-[180px] overflow-y-auto rounded-md border border-grey-40 bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.1)]',
                    categoryDirection === 'up'
                      ? 'bottom-full mb-1'
                      : 'top-full mt-1'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryId(null);
                      setCategorySelectOpen(false);
                    }}
                    className="flex w-full items-center px-3 py-2 text-sm text-grey-60 lg:hover:bg-grey-10"
                  >
                    선택 안 함
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(c.id);
                        setCategorySelectOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-grey-100 lg:hover:bg-grey-10"
                    >
                      <span
                        className={cn(
                          'h-3 w-3 shrink-0 rounded-full',
                          CALENDAR_COLOR_STYLES[c.colorKey].swatchBg
                        )}
                      />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                  {categories.length === 0 && (
                    <p className="px-3 py-2 text-xs text-grey-60">
                      카테고리가 없어요
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 편집 모드 — 항목 제일 하단 삭제하기 (확인 다이얼로그) */}
        {isEdit && onDelete && (
          <>
            <div className="border-t border-[#ecedf3]" />
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="self-center text-sm font-emphasize text-red-80 transition-colors lg:hover:text-red-50"
            >
              삭제하기
            </button>
          </>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-5 pb-9 pt-4">
        <button
          type="button"
          disabled={!ctaEnabled}
          onClick={() =>
            onSubmit({
              kind,
              title,
              eventTimeKind: allDay ? 'ALL_DAY' : 'TIMED',
              startTime,
              endTime,
              clientId: effectiveClientId,
              counselMethod: effectiveCounselMethod,
              categoryId: effectiveCategoryId,
              repeat,
            })
          }
          className={cn(
            'h-[41px] w-full rounded-md text-sm font-emphasize text-white',
            ctaEnabled ? 'bg-green-80' : 'cursor-not-allowed bg-grey-40'
          )}
        >
          {isEdit ? '변경하기' : '일정 추가하기'}
        </button>
      </div>

      {/* 삭제 확인 — 컴팩트 다이얼로그 */}
      <Modal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        className="max-w-[320px]"
      >
        <div className="flex flex-col px-5 pb-6 pt-7 text-center">
          <h2 className="text-l font-headline text-grey-100">
            일정을 삭제할까요?
          </h2>

          {editingEvent?.repeat ? (
            <>
              <p className="mt-2 text-sm font-medium text-grey-80">
                반복 일정이에요. 삭제 범위를 선택해 주세요.
              </p>
              <p className="mt-1 text-xs text-grey-60">
                {repeatCycleLabel(editingEvent.repeat)}
                {editingEvent.repeat.count != null
                  ? ` · 총 ${editingEvent.repeat.count}회`
                  : editingEvent.repeat.until
                    ? ` · ${editingEvent.repeat.until}까지`
                    : ''}
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete?.('this');
                  }}
                  className="h-11 w-full rounded-lg bg-red-80 text-m font-medium text-white transition-opacity lg:hover:opacity-90"
                >
                  이 일정만 삭제
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete?.('all');
                  }}
                  className="h-11 w-full rounded-lg border border-red-80 bg-white text-m font-medium text-red-80 transition-colors lg:hover:bg-grey-10"
                >
                  전체 일정 삭제
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="mt-1 py-1 text-sm font-medium text-grey-60 transition-colors lg:hover:text-grey-80"
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-grey-70">
                삭제한 일정은 되돌릴 수 없어요.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-11 flex-1 rounded-lg border border-grey-40 bg-white text-m font-medium text-grey-100 transition-colors lg:hover:bg-grey-10"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete?.('all');
                  }}
                  className="h-11 flex-1 rounded-lg bg-red-80 text-m font-medium text-white transition-opacity lg:hover:opacity-90"
                >
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
