/**
 * 축어록 태그 칩 색상 — 뷰(TranscriptText)·편집기(SegmentContentEditor) 공용.
 *
 * 크기·간격(px, mx 등)은 문맥마다 다르므로 각 컴포넌트가 갖고,
 * 태그 유형별 색상만 여기서 단일 관리해 뷰/편집기 드리프트를 막는다.
 *
 * NOTE: 비언어 칩은 Tailwind 기본 팔레트를 사용 중 (프로젝트 시맨틱
 * 토큰에는 blue/amber/purple 스케일이 없어 1:1 매핑 불가). 토큰 확장 시
 * 이 파일만 바꾸면 된다. deid 계열은 프로젝트 orange-100 토큰 사용.
 */

import type { NonverbalTagType } from '@/features/session/utils/transcriptTags';

/** 비언어 태그 유형별 칩 색상 (배경·글자·테두리 + 다크모드) */
export const NV_CHIP_COLORS: Record<NonverbalTagType, string> = {
  // 침묵 - 회색
  S: 'border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300',
  // 행동 - 파란색
  A: 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  // 감정/강조 - 주황색
  E: 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  // 겹침 - 보라색
  O: 'border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
};

/** 비식별화 라벨 텍스트 강조 (뷰) */
export const DEID_LABEL_TEXT_CLASS = 'font-headline text-orange-100';

/** 비식별화 칩 (편집기, showDeid ON) */
export const DEID_CHIP_CLASS =
  'border-orange-100/30 bg-orange-100/10 text-orange-100';

/** 비식별화 인라인 밑줄 (편집기, showDeid OFF) */
export const DEID_INLINE_CLASS =
  'border-b border-dashed border-orange-100/50 text-orange-100';
