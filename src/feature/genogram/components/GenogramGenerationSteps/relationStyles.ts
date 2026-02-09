/**
 * 관계 시각화 스타일 상수
 * genogram 라이브러리의 스타일을 기반으로 함
 */

// ─────────────────────────────────────────────────────────────────────────────
// 색상
// ─────────────────────────────────────────────────────────────────────────────

/** 기본 색상 */
export const DEFAULT_FG = '#3C3C3C';

/** 친밀/융합 관계 (녹색) */
export const RELATION_CLOSE = '#44CE4B';

/** 거리감 관계 (보라색) */
export const RELATION_DISTANT = '#B7A9FF';

/** 적대/갈등 관계 (빨간색) */
export const RELATION_HOSTILE = '#E83131';

/** 단절 관계 */
export const RELATION_CUTOFF = '#3C3C3C';

/** 영향선 (학대 등) */
export const INFLUENCE_STROKE = '#E83131';

// ─────────────────────────────────────────────────────────────────────────────
// 선 굵기
// ─────────────────────────────────────────────────────────────────────────────

export const STROKE_WIDTH_DEFAULT = 3;
export const STROKE_WIDTH_THIN = 2;
export const STROKE_WIDTH_THICK = 3;

// ─────────────────────────────────────────────────────────────────────────────
// 패턴 상수
// ─────────────────────────────────────────────────────────────────────────────

/** 지그재그 진폭 */
export const ZIGZAG_AMP = 6;

/** 지그재그 주기 */
export const ZIGZAG_PERIOD = 8;

/** 평행선 간격 */
export const PARALLEL_GAP = 4;

// ─────────────────────────────────────────────────────────────────────────────
// SVG 패턴 생성 함수
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 지그재그 패스 생성
 */
export function createZigzagPath(
  width: number,
  height: number,
  amplitude: number = ZIGZAG_AMP,
  period: number = ZIGZAG_PERIOD
): string {
  const midY = height / 2;
  const points: string[] = [`M 0 ${midY}`];

  for (let x = 0; x <= width; x += period) {
    const y = midY + (Math.floor(x / period) % 2 === 0 ? -amplitude : amplitude);
    points.push(`L ${x} ${y}`);
  }
  points.push(`L ${width} ${midY}`);

  return points.join(' ');
}

/**
 * 직선 패스 생성
 */
export function createStraightPath(width: number, height: number): string {
  const midY = height / 2;
  return `M 0 ${midY} L ${width} ${midY}`;
}

/**
 * 이중선 패스 생성 (친밀 관계용)
 */
export function createDoublePath(
  width: number,
  height: number,
  gap: number = PARALLEL_GAP
): { top: string; bottom: string } {
  const midY = height / 2;
  return {
    top: `M 0 ${midY - gap} L ${width} ${midY - gap}`,
    bottom: `M 0 ${midY + gap} L ${width} ${midY + gap}`,
  };
}

/**
 * 삼중선 패스 생성 (융합 관계용)
 */
export function createTriplePath(
  width: number,
  height: number,
  gap: number = PARALLEL_GAP
): { top: string; middle: string; bottom: string } {
  const midY = height / 2;
  return {
    top: `M 0 ${midY - gap} L ${width} ${midY - gap}`,
    middle: `M 0 ${midY} L ${width} ${midY}`,
    bottom: `M 0 ${midY + gap} L ${width} ${midY + gap}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 관계 타입별 스타일 설정
// ─────────────────────────────────────────────────────────────────────────────

export type RelationStyleType =
  | 'connected'
  | 'close'
  | 'fused'
  | 'distant'
  | 'hostile'
  | 'close_hostile'
  | 'cutoff';

export interface RelationStyle {
  color: string;
  strokeWidth: number;
  dashArray?: string;
  pattern: 'straight' | 'zigzag' | 'double' | 'triple' | 'double_zigzag';
}

export const RELATION_STYLES: Record<RelationStyleType, RelationStyle> = {
  connected: {
    color: DEFAULT_FG,
    strokeWidth: STROKE_WIDTH_DEFAULT,
    pattern: 'straight',
  },
  close: {
    color: RELATION_CLOSE,
    strokeWidth: STROKE_WIDTH_DEFAULT,
    pattern: 'double',
  },
  fused: {
    color: RELATION_CLOSE,
    strokeWidth: STROKE_WIDTH_DEFAULT,
    pattern: 'triple',
  },
  distant: {
    color: RELATION_DISTANT,
    strokeWidth: STROKE_WIDTH_THIN,
    dashArray: '5,5',
    pattern: 'straight',
  },
  hostile: {
    color: RELATION_HOSTILE,
    strokeWidth: STROKE_WIDTH_DEFAULT,
    pattern: 'zigzag',
  },
  close_hostile: {
    color: RELATION_HOSTILE,
    strokeWidth: STROKE_WIDTH_DEFAULT,
    pattern: 'double_zigzag',
  },
  cutoff: {
    color: RELATION_CUTOFF,
    strokeWidth: STROKE_WIDTH_DEFAULT,
    dashArray: '8,4',
    pattern: 'straight',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Influence 타입별 스타일 설정
// ─────────────────────────────────────────────────────────────────────────────

export type InfluenceStyleType =
  | 'physical_abuse'
  | 'emotional_abuse'
  | 'sexual_abuse'
  | 'focused_on'
  | 'focused_on_negatively';

export interface InfluenceStyle {
  color: string;
  strokeWidth: number;
  pattern: 'zigzag' | 'straight' | 'double_zigzag';
  arrowFilled: boolean;
}

export const INFLUENCE_STYLES: Record<InfluenceStyleType, InfluenceStyle> = {
  physical_abuse: {
    color: INFLUENCE_STROKE,
    strokeWidth: STROKE_WIDTH_THICK,
    pattern: 'zigzag',
    arrowFilled: true,
  },
  emotional_abuse: {
    color: INFLUENCE_STROKE,
    strokeWidth: STROKE_WIDTH_THICK,
    pattern: 'zigzag',
    arrowFilled: false,
  },
  sexual_abuse: {
    color: INFLUENCE_STROKE,
    strokeWidth: STROKE_WIDTH_THICK,
    pattern: 'double_zigzag',
    arrowFilled: true,
  },
  focused_on: {
    color: INFLUENCE_STROKE,
    strokeWidth: STROKE_WIDTH_DEFAULT,
    pattern: 'straight',
    arrowFilled: true,
  },
  focused_on_negatively: {
    color: INFLUENCE_STROKE,
    strokeWidth: STROKE_WIDTH_DEFAULT,
    pattern: 'zigzag',
    arrowFilled: true,
  },
};
