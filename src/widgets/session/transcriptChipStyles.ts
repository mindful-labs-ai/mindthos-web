/**
 * 축어록 태그 칩 색상 — 뷰(TranscriptText)·편집기(SegmentContentEditor) 공용.
 *
 * 크기·간격(px, mx 등)은 문맥마다 다르므로 각 컴포넌트가 갖고,
 * 태그 유형별 색상만 여기서 단일 관리해 뷰/편집기 드리프트를 막는다.
 *
 * 색상은 tokens.css의 --color-chip-* 시맨틱 토큰을 참조한다.
 * 다크모드는 .dark 블록의 토큰 오버라이드가 처리하므로 dark: 변형 불필요.
 * deid 계열은 프로젝트 orange-100 토큰 사용.
 */

import type { NonverbalTagType } from '@/features/session/utils/transcriptTags';

/** 비언어 태그 유형별 칩 색상 (배경·글자·테두리, 라이트/다크는 토큰이 처리) */
export const NV_CHIP_COLORS: Record<NonverbalTagType, string> = {
  // 침묵 - 회색
  S: 'border-chip-silence-border bg-chip-silence-bg text-chip-silence-fg',
  // 행동 - 파란색
  A: 'border-chip-action-border bg-chip-action-bg text-chip-action-fg',
  // 감정/강조 - 주황색
  E: 'border-chip-emotion-border bg-chip-emotion-bg text-chip-emotion-fg',
  // 겹침 - 보라색
  O: 'border-chip-overlap-border bg-chip-overlap-bg text-chip-overlap-fg',
};

/** 비식별화 라벨 텍스트 강조 (뷰) */
export const DEID_LABEL_TEXT_CLASS = 'font-headline text-orange-100';

/** 비식별화 칩 (편집기, showDeid ON) */
export const DEID_CHIP_CLASS =
  'border-orange-100/30 bg-orange-100/10 text-orange-100';

/** 비식별화 인라인 밑줄 (편집기, showDeid OFF) */
export const DEID_INLINE_CLASS =
  'border-b border-dashed border-orange-100/50 text-orange-100';
