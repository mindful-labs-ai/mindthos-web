/**
 * 가계도 공통 색상 팔레트.
 * 모든 기본 색상은 이 파일을 단일 출처(SSOT)로 참조한다.
 */

// ── 컬러피커에 노출되는 사용자 선택용 팔레트 ──

export const PALETTE = [
  'transparent',
  '#FFFFFF',
  '#3C3C3C',
  '#44CE4B',
  '#E83131',
  '#2353FF',
  '#FF9009',
  '#F8D300',
  '#EE33BF',
  '#6C0BD3',
  '#FFBEC7',
  '#B7A9FF',
] as const;

// ── 의미별 기본 색상 (모델 기본값, UI 하드코딩 대체) ──

/** 배경 / fill 기본값 */
export const DEFAULT_BG = '#FFFFFF';

/** 텍스트, stroke 기본값 */
export const DEFAULT_FG = '#3C3C3C';

/** 그룹 경계선 기본 색상 */
export const DEFAULT_GROUP_STROKE = '#2353FF';

/** 선택 하이라이트 테두리 */
export const SELECTION_BORDER = '#44CE4B';

/** 선택 하이라이트 내부(연한 녹색) */
export const SELECTION_INNER = '#f0fdf0';

/** 선택 노드 후광 */
export const SELECTION_HALO = 'rgba(68, 206, 75, 0.12)';

// ── 관계선 상태별 색상 ──

/** 관계: 친밀 / 융합 */
export const RELATION_CLOSE = '#44CE4B';

/** 관계: 거리감 */
export const RELATION_DISTANT = '#B7A9FF';

/** 관계: 적대 / 친밀적대 */
export const RELATION_HOSTILE = '#E83131';

/** 관계: 단절 / 기본 */
export const RELATION_CUTOFF = '#3C3C3C';

/** 관계: 일반(Connected 등 기본) */
export const RELATION_DEFAULT = '#3C3C3C';

/** 영향선 */
export const INFLUENCE_STROKE = '#E83131';
