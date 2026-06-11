import type { CalendarColorKey, CalendarEventKind } from '../types';

/** 요일 헤더 (일요일 시작) */
export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

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
  /** 색상 체크박스 배경 (사이드탭) */
  swatchBg: string;
  /** 체크 아이콘 색상 */
  swatchCheck: string;
}

export const CALENDAR_COLOR_STYLES: Record<CalendarColorKey, CalendarColorStyle> =
  {
    green: {
      chipBg: 'bg-green-20',
      chipTitle: 'text-black',
      chipTime: 'text-[#31a837]',
      swatchBg: 'bg-green-20',
      swatchCheck: 'text-green-80',
    },
    red: {
      chipBg: 'bg-[#ffe7e7]',
      chipTitle: 'text-black',
      chipTime: 'text-[#ff8787]',
      swatchBg: 'bg-[#ffe7e7]',
      swatchCheck: 'text-[#ff8787]',
    },
    blue: {
      chipBg: 'bg-[#e7edff]',
      chipTitle: 'text-black',
      chipTime: 'text-[#6462f7]',
      swatchBg: 'bg-[#e7edff]',
      swatchCheck: 'text-[#6462f7]',
    },
    grey: {
      chipBg: 'bg-[#efefef]',
      chipTitle: 'text-[#8e8e8e]',
      chipTime: 'text-[#8e8e8e]',
      swatchBg: 'bg-[#efefef]',
      swatchCheck: 'text-[#8e8e8e]',
    },
  };

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
