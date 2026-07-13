import React from 'react';

import { Calendar, Trash2, User, X } from 'lucide-react';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useDevice } from '@/shared/hooks/useDevice';
import { useDropdownPosition } from '@/shared/hooks/useDropdownPosition';
import { MobileModalHeader } from '@/shared/ui';
import { Modal } from '@/shared/ui/composites/Modal';
import { ClientSelector } from '@/widgets/client/ClientSelector';

import { KIND_DEFAULT_COLOR, WEEKDAYS_KO } from '../../constants';
import type {
  AddEventDraft,
  CalendarColorKey,
  CalendarEventKind,
  CalendarEvent,
  CalendarEventScope,
  CalendarRepeatRule,
  CounselMethod,
} from '../../types';
import { dayjs, type Dayjs } from '../../utils/calendarDate';
import { computeEventTimes } from '../../utils/eventMutations';

import { CalendarColorPicker } from './CalendarColorPicker';
import { CounselMethodSelect } from './CounselMethodSelect';
import { DatePopoverCalendar } from './DatePopoverCalendar';
import { RepeatSelect } from './RepeatSelect';
import { TimeSelect } from './TimeSelect';

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
  /** 시작/종료 시간 수정 (캘린더 더미/선택 미리보기와 실시간 동기화) */
  onTimeChange?: (time: { start: string; end: string }) => void;
  onClose: () => void;
  /** 저장. 반복(시리즈) 일정 편집이면 scope(this/following/all)를 함께 넘긴다(신규·단일은 생략). */
  onSubmit: (draft: AddEventDraft, scope?: CalendarEventScope) => void;
  /** 편집 모드 삭제 — 있으면 본문 최하단 '일정 삭제' 버튼 노출. 반복 일정은 this/following/all 구분 */
  onDelete?: (mode: CalendarEventScope) => void;
  /** 저장(추가·변경) 진행 중 — CTA·범위 선택 버튼 disable(중복 제출 방지). */
  submitting?: boolean;
  /** 삭제 진행 중 — 삭제 확인 버튼 disable. 성공 시 상위가 패널을 닫는다. */
  deleting?: boolean;
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

/** 일정 추가하기 슬라이드오버 패널 */
export function AddEventPanel({
  initialKind,
  selectedDate,
  initialStartTime,
  initialEndTime,
  editingEvent,
  onSelectDate,
  onTimeChange,
  onClose,
  onSubmit,
  onDelete,
  submitting = false,
  deleting = false,
}: AddEventPanelProps) {
  const [kind, setKind] = React.useState<CalendarEventKind>(initialKind);
  // 표시 색상 — 편집은 기존 색, 신규는 kind 기본색. 사용자가 색상 선택기로 변경 가능.
  const [colorKey, setColorKey] = React.useState<CalendarColorKey>(
    editingEvent ? editingEvent.colorKey : KIND_DEFAULT_COLOR[initialKind]
  );
  const [title, setTitle] = React.useState(editingEvent?.title ?? '');
  const [allDay, setAllDay] = React.useState(
    editingEvent?.eventTimeKind === 'ALL_DAY'
  );
  const [startTime, setStartTime] = React.useState(initialStartTime);
  const [endTime, setEndTime] = React.useState(initialEndTime);
  // 반복 규칙 — 신규 생성, 또는 반복(시리즈) 편집 시 마스터 규칙을 표시/수정(이후/전체 scope에 적용).
  const [repeat, setRepeat] = React.useState<CalendarRepeatRule | null>(
    editingEvent?.repeat ?? null
  );
  const [counselMethod, setCounselMethod] =
    React.useState<CounselMethod | null>(editingEvent?.counselMethod ?? null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  // 반복(시리즈) 일정 편집 저장 시 적용 범위 선택 모달.
  const [confirmEditScope, setConfirmEditScope] = React.useState(false);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const dateFieldRef = React.useRef<HTMLDivElement>(null);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [clientSelectOpen, setClientSelectOpen] = React.useState(false);
  const { clients } = useClientList();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  // 날짜 팝오버 — 하단에서 아래로 펼치면 CTA 밑으로 잘리므로 위치 보정(달력 ~360px).
  const datePopoverRef = React.useRef<HTMLDivElement>(null);
  const { direction: dateDirection, offset: dateOffset } = useDropdownPosition(
    dateFieldRef,
    datePopoverRef,
    datePickerOpen,
    { estimatedHeight: 360 }
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

  // 시작 시간 변경 시, 종료가 시작보다 빠르면 자동으로 다음 슬롯으로 밀기.
  // 신규 추가 모드면 캘린더 미리보기(더미/선택)도 즉시 갱신.
  const handleStartChange = (v: string) => {
    setStartTime(v);
    let nextEnd = endTime;
    if (endTime <= v) {
      const idx = END_TIME_OPTIONS.indexOf(v);
      nextEnd = END_TIME_OPTIONS[idx + 1] ?? v;
      setEndTime(nextEnd);
    }
    if (!editingEvent) onTimeChange?.({ start: v, end: nextEnd });
  };

  const handleEndChange = (v: string) => {
    setEndTime(v);
    if (!editingEvent) onTimeChange?.({ start: startTime, end: v });
  };

  // 종류 변경 시 색을 그 종류 기본색으로 초기화(이후 색상 선택기로 재선택 가능).
  const handleKindChange = (next: CalendarEventKind) => {
    if (next === kind) return;
    setKind(next);
    setColorKey(KIND_DEFAULT_COLOR[next]);
  };

  // 편집 모드 + 변경 감지 (수정사항이 있을 때만 CTA 활성화)
  const isEdit = !!editingEvent;
  // 반복(시리즈) 일정의 편집 — 저장 시 적용 범위(이 회차/이후/전체)를 묻는다.
  const isRecurringEdit = isEdit && !!editingEvent?.seriesId;
  const origStart = editingEvent ? dayjs(editingEvent.start) : null;
  const origEnd =
    editingEvent && editingEvent.end
      ? dayjs(editingEvent.end)
      : (origStart?.add(1, 'hour') ?? null);
  // 내담자·상담 방식은 상담 일정에서만 의미 — 그 외면 null로 본다.
  const effectiveClientId =
    kind === 'counseling' ? (selectedClient?.id ?? null) : null;
  const effectiveCounselMethod = kind === 'counseling' ? counselMethod : null;
  const isDirty =
    !editingEvent ||
    kind !== editingEvent.kind ||
    colorKey !== editingEvent.colorKey ||
    title !== editingEvent.title ||
    allDay !== (editingEvent.eventTimeKind === 'ALL_DAY') ||
    startTime !== (origStart ? origStart.format('HH:mm') : '') ||
    endTime !== (origEnd ? origEnd.format('HH:mm') : '') ||
    (selectedDate ? selectedDate.format('YYYY-MM-DD') : '') !==
      (origStart ? origStart.format('YYYY-MM-DD') : '') ||
    effectiveClientId !== (editingEvent.clientId ?? null) ||
    effectiveCounselMethod !== (editingEvent.counselMethod ?? null) ||
    JSON.stringify(repeat) !== JSON.stringify(editingEvent.repeat ?? null);
  // 상담 일정은 내담자 선택이 필수(서버 계약: COUNSELING은 clientId 필요).
  const counselingNeedsClient = kind === 'counseling' && !selectedClient;
  // 필수값: 상담 일정이면 내담자. 제목은 비워도 추가 가능('제목 없음'으로 저장).
  const ctaEnabled = (!isEdit || isDirty) && !counselingNeedsClient;
  // 저장/삭제 진행 중 — CTA·삭제·범위 선택 버튼을 잠가 중복 제출을 막는다.
  const busy = submitting || deleting;

  const buildDraft = (): AddEventDraft => ({
    kind,
    colorKey,
    title,
    eventTimeKind: allDay ? 'ALL_DAY' : 'TIMED',
    startTime,
    endTime,
    clientId: effectiveClientId,
    counselMethod: effectiveCounselMethod,
    // 일정 폼에서 카테고리는 선택 불가(연동 전용 도메인) — 편집 시 기존 값 보존, 신규는 null.
    categoryId: editingEvent?.categoryId ?? null,
    repeat,
  });

  // 저장 — 반복(시리즈) 편집은 적용 범위 모달을 먼저 띄우고, 그 외엔 바로 저장.
  const handleSave = () => {
    if (busy) return;
    if (isRecurringEdit) {
      setConfirmEditScope(true);
      return;
    }
    onSubmit(buildDraft());
  };

  // 반복 종료일 상한/하한 기준 — 서버로 보낼 실제 시작의 'UTC 날짜'(서버 회차 판정과 동일 기준).
  // 로컬 선택일이 아니라 이 값을 써야 이른 새벽/올데이의 KST↔UTC 날짜 밀림에서도 상한이 정확히 맞는다.
  const repeatAnchorDate: Dayjs | null = selectedDate
    ? dayjs(
        computeEventTimes(buildDraft(), selectedDate)
          .start.toISOString()
          .slice(0, 10)
      )
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 — 모바일은 녹음 업로드 모달과 동일한 고정 헤더, 데스크탑은 슬라이드오버 헤더.
          편집 모드 삭제는 본문 최하단 '일정 삭제' 버튼 — 반복 일정은 확인 다이얼로그에서 scope 선택. */}
      {isMobileView ? (
        <MobileModalHeader
          title={isEdit ? '일정 변경하기' : '일정 추가하기'}
          onBack={onClose}
        />
      ) : (
        <div className="flex items-center justify-between px-5 pb-4 pt-7">
          <h2 className="text-sm font-emphasize text-grey-100">
            {isEdit ? '일정 변경하기' : '일정 추가하기'}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="text-grey-70"
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
                  onClick={() => handleKindChange(opt.value)}
                  className={cn(
                    'h-[35px] w-[60px] rounded-md border text-sm font-medium',
                    active
                      ? 'bg-green-80/5 border-green-80 text-green-80'
                      : 'border-grey-30 bg-white text-grey-60'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 색상 — 기본은 kind 기본색, 색상 선택기로 변경 가능(모든 일정) */}
        <div className="flex items-center justify-between gap-4">
          <FieldLabel>색상</FieldLabel>
          <CalendarColorPicker value={colorKey} onChange={setColorKey} />
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
                <div className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-grey-30 bg-white px-2.5 text-sm">
                  <User
                    size={18}
                    strokeWidth={1.5}
                    className="shrink-0 text-grey-60"
                  />
                  <span
                    className={
                      selectedClient ? 'text-grey-100' : 'text-grey-60'
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

        <div className="border-t border-grey-30" />

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
                  className="shrink-0 text-grey-70"
                />
              </button>
              {datePickerOpen && (
                <DatePopoverCalendar
                  ref={datePopoverRef}
                  direction={dateDirection}
                  offset={dateOffset}
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
                  allDay ? 'bg-green-80' : 'bg-grey-40'
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
                  onChange={handleEndChange}
                  ariaLabel="종료 시간"
                />
              </div>
            )}
          </div>
        </div>

        {/* 주기 (반복 규칙) — 신규 생성, 또는 반복(시리즈) 편집 시 노출(규칙은 이후/전체 scope에 적용). */}
        {(!isEdit || isRecurringEdit) && (
          <RepeatSelect
            value={repeat}
            onChange={setRepeat}
            anchorDate={repeatAnchorDate}
            label={kind === 'personal' ? '일정 주기' : '상담 주기'}
          />
        )}

        {/* 상담 방식 — 상담 일정에서만 노출(개인 일정은 숨김) */}
        {kind === 'counseling' && (
          <CounselMethodSelect
            value={counselMethod}
            onChange={setCounselMethod}
          />
        )}

        {/* 일정 삭제 — 항목 최하단 중앙 버튼(편집 모드). 반복이면 확인 다이얼로그에서 범위 선택 */}
        {isEdit && onDelete && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDelete(true)}
            className="inline-flex w-fit items-center gap-1 self-center rounded-[10px] border border-grey-30 bg-white px-3.5 py-2 text-sm font-medium text-grey-70 transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:hover:bg-grey-10 lg:hover:text-grey-80"
          >
            <Trash2 size={20} strokeWidth={1.75} />
            일정 삭제
          </button>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-5 pb-9 pt-4">
        <button
          type="button"
          disabled={!ctaEnabled || busy}
          onClick={handleSave}
          className={cn(
            'h-[41px] w-full rounded-md text-sm font-emphasize text-white',
            ctaEnabled && !busy
              ? 'bg-green-80'
              : 'cursor-not-allowed bg-grey-40'
          )}
        >
          {submitting
            ? isEdit
              ? '변경 중...'
              : '추가 중...'
            : isEdit
              ? '변경하기'
              : '일정 추가하기'}
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

          {editingEvent?.seriesId ? (
            <>
              <p className="mt-2 text-sm font-medium text-grey-80">
                반복 일정이에요. 삭제 범위를 선택해 주세요.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => onDelete?.('this')}
                  className="h-11 w-full rounded-lg bg-red-80 text-m font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 lg:hover:opacity-90"
                >
                  {deleting ? '삭제 중...' : '이 일정만 삭제'}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => onDelete?.('following')}
                  className="h-11 w-full rounded-lg border border-red-80 bg-white text-m font-medium text-red-80 transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:hover:bg-grey-10"
                >
                  이 일정부터 삭제
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => onDelete?.('all')}
                  className="h-11 w-full rounded-lg border border-red-80 bg-white text-m font-medium text-red-80 transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:hover:bg-grey-10"
                >
                  전체 일정 삭제
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="mt-1 py-1 text-sm font-medium text-grey-60 transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:hover:text-grey-80"
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
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="h-11 flex-1 rounded-lg border border-grey-40 bg-white text-m font-medium text-grey-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:hover:bg-grey-10"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => onDelete?.('all')}
                  className="h-11 flex-1 rounded-lg bg-red-80 text-m font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 lg:hover:opacity-90"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* 반복 일정 편집 — 적용 범위 선택 */}
      <Modal
        open={confirmEditScope}
        onOpenChange={setConfirmEditScope}
        className="max-w-[320px]"
      >
        <div className="flex flex-col px-5 pb-6 pt-7 text-center">
          <h2 className="text-l font-headline text-grey-100">
            변경 범위를 선택해 주세요
          </h2>
          <p className="mt-2 text-sm font-medium text-grey-80">
            반복 일정이에요. 어디까지 변경할까요?
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => onSubmit(buildDraft(), 'this')}
              className="h-11 w-full rounded-lg bg-green-80 text-m font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 lg:hover:opacity-90"
            >
              {submitting ? '변경 중...' : '이 일정만 변경'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => onSubmit(buildDraft(), 'following')}
              className="h-11 w-full rounded-lg border border-green-80 bg-white text-m font-medium text-green-80 transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:hover:bg-grey-10"
            >
              이 일정부터 변경
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => onSubmit(buildDraft(), 'all')}
              className="h-11 w-full rounded-lg border border-green-80 bg-white text-m font-medium text-green-80 transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:hover:bg-grey-10"
            >
              전체 일정 변경
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setConfirmEditScope(false)}
              className="mt-1 py-1 text-sm font-medium text-grey-60 transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:hover:text-grey-80"
            >
              취소
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
