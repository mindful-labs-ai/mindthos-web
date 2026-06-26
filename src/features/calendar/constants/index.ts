import type { CalendarColorKey, CalendarEventKind } from '../types';

/** 요일 헤더 (일요일 시작) */
export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 주말 텍스트 색상 (요일 헤더 + 날짜 숫자 공통 단일 소스 — 일요일 빨강 / 토요일 파랑) */
export const WEEKEND_TEXT_CLASS = {
  /** 일요일 */ sun: 'text-[#ff8787]',
  /** 토요일 */ sat: 'text-[#87a5ff]',
} as const;

/**
 * 요일 인덱스(0=일 … 6=토) → 텍스트 색상 클래스.
 * 헤더(위 글자)와 날짜 숫자가 같은 hex를 쓰도록 한 곳에서 결정한다. 평일 색은 뷰마다
 * 달라(grey-100/80/60) `weekdayClass`로 주입하고, 주말만 공통 색으로 고정한다.
 */
export function weekdayColorClass(
  dayOfWeek: number,
  weekdayClass = 'text-grey-100'
): string {
  if (dayOfWeek === 0) return WEEKEND_TEXT_CLASS.sun;
  if (dayOfWeek === 6) return WEEKEND_TEXT_CLASS.sat;
  return weekdayClass;
}

/**
 * 색상 키 → Tailwind 클래스 매핑
 * (시맨틱 토큰 미사용: 팔레트 클래스 + 원시 hex 그대로 — 사용자 방침)
 */
export interface CalendarColorStyle {
  /** 월간 일정칩 배경 */
  chipBg: string;
  /** 일정명 텍스트 */
  chipTitle: string;
  /** 시간 텍스트 */
  chipTime: string;
  /** 선택(편집 중) 일정 칩 배경 — 시간 텍스트 색을 솔리드 배경으로 */
  selectedBg: string;
  /** 색상 체크박스 배경 (사이드탭) */
  swatchBg: string;
  /** 체크 아이콘 색상 */
  swatchCheck: string;
}

export const CALENDAR_COLOR_STYLES: Record<
  CalendarColorKey,
  CalendarColorStyle
> = {
  green: {
    chipBg: 'bg-green-20',
    chipTitle: 'text-black',
    chipTime: 'text-[#31a837]',
    selectedBg: 'bg-[#31a837]',
    swatchBg: 'bg-green-20',
    swatchCheck: 'text-green-80',
  },
  red: {
    chipBg: 'bg-[#ffe7e7]',
    chipTitle: 'text-black',
    chipTime: 'text-[#ff8787]',
    selectedBg: 'bg-[#ff8787]',
    swatchBg: 'bg-[#ffe7e7]',
    swatchCheck: 'text-[#ff8787]',
  },
  blue: {
    chipBg: 'bg-[#e7edff]',
    chipTitle: 'text-black',
    chipTime: 'text-[#6462f7]',
    selectedBg: 'bg-[#6462f7]',
    swatchBg: 'bg-[#e7edff]',
    swatchCheck: 'text-[#6462f7]',
  },
  grey: {
    chipBg: 'bg-[#efefef]',
    chipTitle: 'text-[#8e8e8e]',
    chipTime: 'text-[#8e8e8e]',
    selectedBg: 'bg-[#8e8e8e]',
    swatchBg: 'bg-[#efefef]',
    swatchCheck: 'text-[#8e8e8e]',
  },
  orange: {
    chipBg: 'bg-[#fff0e1]',
    chipTitle: 'text-black',
    chipTime: 'text-[#f08a24]',
    selectedBg: 'bg-[#f08a24]',
    swatchBg: 'bg-[#fff0e1]',
    swatchCheck: 'text-[#f08a24]',
  },
  yellow: {
    chipBg: 'bg-[#fff7d6]',
    chipTitle: 'text-black',
    chipTime: 'text-[#c79600]',
    selectedBg: 'bg-[#c79600]',
    swatchBg: 'bg-[#fff7d6]',
    swatchCheck: 'text-[#c79600]',
  },
  purple: {
    chipBg: 'bg-[#efe9ff]',
    chipTitle: 'text-black',
    chipTime: 'text-[#7c5cf0]',
    selectedBg: 'bg-[#7c5cf0]',
    swatchBg: 'bg-[#efe9ff]',
    swatchCheck: 'text-[#7c5cf0]',
  },
  pink: {
    chipBg: 'bg-[#ffe6f1]',
    chipTitle: 'text-black',
    chipTime: 'text-[#ec4f97]',
    selectedBg: 'bg-[#ec4f97]',
    swatchBg: 'bg-[#ffe6f1]',
    swatchCheck: 'text-[#ec4f97]',
  },
};

/** 카테고리 색 선택 팔레트(설정 팝오버·생성 폼 공용). */
export const CALENDAR_PALETTE: CalendarColorKey[] = [
  'green',
  'red',
  'blue',
  'grey',
  'orange',
  'yellow',
  'purple',
  'pink',
];

/** kind → 기본 색상 키 (개인은 카테고리 색으로 덮어쓸 수 있음) */
export const KIND_DEFAULT_COLOR: Record<CalendarEventKind, CalendarColorKey> = {
  counseling: 'green',
  personal: 'red',
  holiday: 'grey',
};

/** '일정 표시' 토글 항목 (kind 단위) */
export const VISIBILITY_KINDS: {
  kind: CalendarEventKind;
  label: string;
  colorKey: CalendarColorKey;
}[] = [
  { kind: 'holiday', label: '국가 공휴일', colorKey: 'grey' },
  { kind: 'counseling', label: '상담 일정', colorKey: 'green' },
  { kind: 'personal', label: '개인 일정', colorKey: 'red' },
];
