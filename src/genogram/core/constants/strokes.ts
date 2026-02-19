/**
 * 가계도 선 굵기 상수.
 * 모든 stroke 관련 값은 이 파일을 단일 출처(SSOT)로 참조한다.
 */

import { StrokeWidth } from '../types/enums';

// ── 기본 선 굵기 (px) ──

/** 기본 선 굵기 */
export const STROKE_WIDTH_DEFAULT = 2;

/** 가는 선 굵기 */
export const STROKE_WIDTH_THIN = 1;

/** 굵은 선 굵기 */
export const STROKE_WIDTH_THICK = 3;

/** 보조 선 굵기 (파트너 이혼 슬래시 등) */
export const STROKE_WIDTH_SUB = 2;

/** 노드 외곽선 굵기 */
export const STROKE_WIDTH_NODE = 2.5;

// ── StrokeWidth enum → px 매핑 ──

export const STROKE_WIDTH_PX: Record<string, number> = {
  [StrokeWidth.Thin]: STROKE_WIDTH_THIN,
  [StrokeWidth.Default]: STROKE_WIDTH_DEFAULT,
  [StrokeWidth.Thick]: STROKE_WIDTH_THICK,
};

/** StrokeWidth enum 값을 px로 변환 (기본값: STROKE_WIDTH_DEFAULT) */
export const getStrokeWidthPx = (strokeWidth: string | undefined): number => {
  if (!strokeWidth) return STROKE_WIDTH_DEFAULT;
  return STROKE_WIDTH_PX[strokeWidth] ?? STROKE_WIDTH_DEFAULT;
};
